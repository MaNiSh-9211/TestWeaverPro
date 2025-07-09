const { StateGraph, END } = require('@langchain/langgraph');
const { WorkflowStateSchema } = require('./states');
const htmlProcessor = require('../htmlProcessor');
const groqService = require('../llm/groqService');
const testExecutor = require('../testExecutor');
const reportGenerator = require('../reportGenerator');
const logger = require('../../utils/logger');

class TestAutomationWorkflow {
    constructor() {
        this.graph = new StateGraph(WorkflowStateSchema);
        this.setupWorkflow();
    }
    
    setupWorkflow() {
        // Add nodes to the workflow
        this.graph.addNode('initialize', this.initializeNode.bind(this));
        this.graph.addNode('fetchAndCleanHtml', this.fetchAndCleanHtmlNode.bind(this));
        this.graph.addNode('generateSelectors', this.generateSelectorsNode.bind(this));
        this.graph.addNode('generateTestScript', this.generateTestScriptNode.bind(this));
        this.graph.addNode('executeTest', this.executeTestNode.bind(this));
        this.graph.addNode('generateReport', this.generateReportNode.bind(this));
        this.graph.addNode('handleError', this.handleErrorNode.bind(this));
        
        // Define workflow edges
        this.graph.addEdge('initialize', 'fetchAndCleanHtml');
        this.graph.addEdge('fetchAndCleanHtml', 'generateSelectors');
        this.graph.addEdge('generateSelectors', 'generateTestScript');
        this.graph.addEdge('generateTestScript', 'executeTest');
        this.graph.addEdge('executeTest', 'generateReport');
        this.graph.addEdge('generateReport', END);
        this.graph.addEdge('handleError', END);
        
        // Set conditional edges for error handling
        this.graph.addConditionalEdges('fetchAndCleanHtml', this.shouldContinueOrError.bind(this));
        this.graph.addConditionalEdges('generateSelectors', this.shouldContinueOrError.bind(this));
        this.graph.addConditionalEdges('generateTestScript', this.shouldContinueOrError.bind(this));
        this.graph.addConditionalEdges('executeTest', this.shouldContinueOrError.bind(this));
        
        // Set entry point
        this.graph.setEntryPoint('initialize');
        
        // Compile the graph
        this.workflow = this.graph.compile();
    }
    
    async initializeNode(state) {
        try {
            logger.info(`Initializing workflow for test: ${state.testId}`);
            
            await state.testResult.addLog('info', 'Workflow initialized', {
                userStory: state.userStory,
                url: state.url
            });
            
            return {
                ...state,
                status: 'initialized',
                startTime: new Date()
            };
        } catch (error) {
            logger.error('Failed to initialize workflow:', error);
            return {
                ...state,
                status: 'failed',
                error: error.message
            };
        }
    }
    
    async fetchAndCleanHtmlNode(state) {
        try {
            logger.info(`Fetching and cleaning HTML for: ${state.url}`);
            
            await state.testResult.addLog('info', 'Fetching HTML content', { url: state.url });
            
            // Fetch HTML content
            const htmlContent = await htmlProcessor.fetchHtml(state.url);
            
            await state.testResult.addLog('info', 'HTML content fetched', { 
                contentLength: htmlContent.length 
            });
            
            // Clean HTML for token optimization
            const cleanedHtml = await htmlProcessor.cleanHtml(htmlContent);
            const tokenCount = await htmlProcessor.estimateTokens(cleanedHtml);
            
            await state.testResult.addLog('info', 'HTML content cleaned', { 
                originalLength: htmlContent.length,
                cleanedLength: cleanedHtml.length,
                tokenCount
            });
            
            // Update test result
            await state.testResult.update({
                htmlContent,
                cleanedHtml,
                tokenCount,
                status: 'html_processed'
            });
            
            return {
                ...state,
                htmlContent,
                cleanedHtml,
                tokenCount,
                status: 'html_processed'
            };
        } catch (error) {
            logger.error('Failed to fetch and clean HTML:', error);
            await state.testResult.addError(error, { step: 'fetchAndCleanHtml' });
            
            return {
                ...state,
                status: 'failed',
                error: error.message
            };
        }
    }
    
    async generateSelectorsNode(state) {
        try {
            logger.info(`Generating selectors for test: ${state.testId}`);
            
            await state.testResult.addLog('info', 'Generating element selectors', {
                userStory: state.userStory
            });
            
            const selectors = await groqService.generateSelectors(
                state.userStory,
                state.cleanedHtml
            );
            
            await state.testResult.addLog('info', 'Selectors generated', {
                selectorCount: selectors.length
            });
            
            // Update test result
            await state.testResult.update({
                generatedSelectors: selectors,
                status: 'selectors_generated'
            });
            
            return {
                ...state,
                generatedSelectors: selectors,
                status: 'selectors_generated'
            };
        } catch (error) {
            logger.error('Failed to generate selectors:', error);
            await state.testResult.addError(error, { step: 'generateSelectors' });
            
            return {
                ...state,
                status: 'failed',
                error: error.message
            };
        }
    }
    
    async generateTestScriptNode(state) {
        try {
            logger.info(`Generating test script for test: ${state.testId}`);
            
            await state.testResult.addLog('info', 'Generating test script', {
                userStory: state.userStory,
                selectorCount: state.generatedSelectors.length
            });
            
            const testScript = await groqService.generateTestScript(
                state.userStory,
                state.generatedSelectors,
                state.cleanedHtml
            );
            
            await state.testResult.addLog('info', 'Test script generated', {
                stepCount: testScript.steps.length,
                title: testScript.title
            });
            
            // Update test result
            await state.testResult.update({
                generatedScript: testScript,
                status: 'script_generated'
            });
            
            return {
                ...state,
                generatedScript: testScript,
                status: 'script_generated'
            };
        } catch (error) {
            logger.error('Failed to generate test script:', error);
            await state.testResult.addError(error, { step: 'generateTestScript' });
            
            return {
                ...state,
                status: 'failed',
                error: error.message
            };
        }
    }
    
    async executeTestNode(state) {
        try {
            logger.info(`Executing test: ${state.testId}`);
            
            await state.testResult.addLog('info', 'Starting test execution', {
                scriptTitle: state.generatedScript.title
            });
            
            const executionResult = await testExecutor.executeTest(
                state.generatedScript,
                state.testResult
            );
            
            await state.testResult.addLog('info', 'Test execution completed', {
                success: executionResult.success,
                stepCount: executionResult.steps.length,
                failedStep: executionResult.failedStep
            });
            
            const finalStatus = executionResult.success ? 'completed' : 'failed';
            
            // Update test result
            await state.testResult.update({
                executionResults: executionResult.steps,
                status: finalStatus,
                executionTime: executionResult.executionTime
            });
            
            return {
                ...state,
                executionResults: executionResult.steps,
                status: finalStatus,
                executionTime: executionResult.executionTime,
                testSuccess: executionResult.success
            };
        } catch (error) {
            logger.error('Failed to execute test:', error);
            await state.testResult.addError(error, { step: 'executeTest' });
            
            return {
                ...state,
                status: 'failed',
                error: error.message
            };
        }
    }
    
    async generateReportNode(state) {
        try {
            logger.info(`Generating report for test: ${state.testId}`);
            
            await state.testResult.addLog('info', 'Generating HTML report');
            
            const report = await reportGenerator.generateReport(state.testResult);
            
            await state.testResult.addLog('info', 'Report generated', {
                reportId: report.reportId,
                reportPath: report.reportPath
            });
            
            return {
                ...state,
                report,
                status: 'report_generated'
            };
        } catch (error) {
            logger.error('Failed to generate report:', error);
            await state.testResult.addError(error, { step: 'generateReport' });
            
            return {
                ...state,
                status: 'failed',
                error: error.message
            };
        }
    }
    
    async handleErrorNode(state) {
        try {
            logger.error(`Handling error for test: ${state.testId}`, state.error);
            
            await state.testResult.addLog('error', 'Workflow failed', {
                error: state.error,
                step: state.currentStep
            });
            
            // Update test result with final error status
            await state.testResult.update({
                status: 'failed'
            });
            
            return {
                ...state,
                status: 'failed'
            };
        } catch (error) {
            logger.error('Failed to handle error:', error);
            return state;
        }
    }
    
    shouldContinueOrError(state) {
        if (state.status === 'failed' || state.error) {
            return 'handleError';
        }
        
        switch (state.status) {
            case 'html_processed':
                return 'generateSelectors';
            case 'selectors_generated':
                return 'generateTestScript';
            case 'script_generated':
                return 'executeTest';
            case 'completed':
            case 'failed':
                return 'generateReport';
            default:
                return 'handleError';
        }
    }
    
    async runWorkflow(initialState) {
        try {
            logger.info(`Starting workflow for test: ${initialState.testId}`);
            
            const result = await this.workflow.invoke(initialState);
            
            logger.info(`Workflow completed for test: ${initialState.testId}`, {
                status: result.status,
                success: result.testSuccess
            });
            
            return result;
        } catch (error) {
            logger.error('Workflow execution failed:', error);
            throw error;
        }
    }
}

module.exports = TestAutomationWorkflow;
