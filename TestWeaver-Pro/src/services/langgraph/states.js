const logger = require('../../utils/logger');

class StateFactory {
    static createInitialState(testId, userStory, baseUrl, testResult) {
        return {
            testId,
            userStory,
            baseUrl,
            currentUrl: baseUrl,
            testResult,
            
            // Testcase tracking
            testcases: [],
            currentTestcaseIndex: 0,
            
            // Selector management with fallback
            currentSelectors: [], // Array of 3 selectors per testcase
            currentSelectorIndex: 0,
            
            // Execution tracking
            executionResults: [], // ALL execution results (for final summary)
            recentExecutionResults: [], // Only last executed batch (for LLM input)
            lastExecutionBatchStartIndex: 0, // Track where last batch started
            lastExecutionBatchEndIndex: 0, // Track where last batch ended
            passedTestcases: [],
            failedTestcases: [],
            
            // Failed testcases with their selectors for regeneration
            failedTestcasesWithSelectors: [], // [{ testcaseId, selectors: [selector1, selector2, selector3], error }]
            
            // HTML state
            currentHtml: '',
            cleanedHtml: '',
            
            // Workflow state
            shouldContinue: true,
            status: 'running',
            testSuccess: false,
            
            // API rate limit handling
            lastApiCallTime: 0,
            apiRateLimitDelay: 30000, // 30 seconds
            
            // Retry tracking
            retryCount: 0,
            maxRetries: 3,
            
            // Error tracking
            errors: [],
            
            // Metadata
            startTime: new Date(),
            endTime: null
        };
    }
    
    static updateState(currentState, updates) {
        return {
            ...currentState,
            ...updates,
            lastUpdated: new Date()
        };
    }
    
    static addExecutionResult(state, result) {
        // Add to full execution results (for final summary)
        const executionResults = [...state.executionResults, result];
        
        // Add to recent execution results (for LLM input) - will be formatted later
        const recentExecutionResults = [...state.recentExecutionResults, result];
        
        return {
            ...state,
            executionResults,
            recentExecutionResults
        };
    }
    
    // Mark the start of a new execution batch
    static startExecutionBatch(state) {
        return {
            ...state,
            lastExecutionBatchStartIndex: state.executionResults.length,
            recentExecutionResults: [] // Clear previous batch
        };
    }
    
    // Format and prepare recent execution results for LLM (only last batch)
    // For passed testcases: Only include the successful selector
    // For failed testcases: Include ALL 3 selectors that were tried
    static prepareRecentExecutionResultsForLLM(state) {
        const batchStart = state.lastExecutionBatchStartIndex;
        const batchEnd = state.executionResults.length;
        
        // Get all results from last batch
        const lastBatchResults = state.executionResults.slice(batchStart, batchEnd);
        
        // Format results: passed = only successful selector, failed = all selectors
        const formattedResults = lastBatchResults.map(result => {
            if (result.success) {
                // Passed: Only include the successful selector (the one that worked)
                return {
                    testcaseId: result.testcaseId,
                    success: true,
                    selector: result.selector, // Only the one that worked
                    selectorIndex: result.selectorIndex,
                    shouldContinue: result.shouldContinue,
                    timestamp: result.timestamp
                };
            } else {
                // Failed: Include ALL 3 selectors that were tried
                // Use selectors from result if available, otherwise from failedTestcasesWithSelectors
                const selectors = result.selectors || 
                    (state.failedTestcasesWithSelectors.find(f => f.testcaseId === result.testcaseId)?.selectors || []);
                
                return {
                    testcaseId: result.testcaseId,
                    success: false,
                    error: result.error,
                    selectors: selectors, // ALL 3 selectors that failed
                    message: `This testcase failed with the following selectors: ${selectors.join(', ')}. Please generate COMPLETELY DIFFERENT selectors.`,
                    timestamp: result.timestamp
                };
            }
        });
        
        return {
            ...state,
            recentExecutionResults: formattedResults,
            lastExecutionBatchEndIndex: batchEnd
        };
    }
    
    // Reset recent execution results for new iteration
    static resetRecentExecutionResults(state) {
        return {
            ...state,
            recentExecutionResults: [],
            lastExecutionBatchStartIndex: state.executionResults.length,
            lastExecutionBatchEndIndex: state.executionResults.length
        };
    }
    
    static markTestcasePassed(state, testcaseId) {
        const passedTestcases = [...state.passedTestcases, testcaseId];
        const failedTestcases = state.failedTestcases.filter(id => id !== testcaseId);
        
        return {
            ...state,
            passedTestcases,
            failedTestcases
        };
    }
    
    static markTestcaseFailed(state, testcaseId, selectors, error) {
        const failedTestcases = state.failedTestcases.includes(testcaseId) 
            ? state.failedTestcases 
            : [...state.failedTestcases, testcaseId];
        
        // Track failed testcase with selectors for regeneration
        const failedEntry = {
            testcaseId,
            selectors: selectors || [],
            error: error?.message || error || 'Unknown error',
            timestamp: new Date()
        };
        
        const failedTestcasesWithSelectors = [
            ...state.failedTestcasesWithSelectors.filter(f => f.testcaseId !== testcaseId),
            failedEntry
        ];
        
        return {
            ...state,
            failedTestcases,
            failedTestcasesWithSelectors
        };
    }
    
    static setCurrentSelectors(state, selectors) {
        return {
            ...state,
            currentSelectors: selectors,
            currentSelectorIndex: 0
        };
    }
    
    static getNextSelector(state) {
        if (state.currentSelectorIndex < state.currentSelectors.length) {
            return {
                ...state,
                currentSelectorIndex: state.currentSelectorIndex + 1
            };
        }
        return state;
    }
    
    static hasMoreSelectors(state) {
        return state.currentSelectorIndex < state.currentSelectors.length;
    }
    
    static incrementRetryCount(state) {
        return {
            ...state,
            retryCount: state.retryCount + 1
        };
    }
    
    static resetRetryCount(state) {
        return {
            ...state,
            retryCount: 0
        };
    }
    
    static updateApiCallTime(state) {
        return {
            ...state,
            lastApiCallTime: Date.now()
        };
    }
    
    static shouldWaitForRateLimit(state) {
        const timeSinceLastCall = Date.now() - state.lastApiCallTime;
        return timeSinceLastCall < state.apiRateLimitDelay;
    }
    
    static getWaitTime(state) {
        const timeSinceLastCall = Date.now() - state.lastApiCallTime;
        return Math.max(0, state.apiRateLimitDelay - timeSinceLastCall);
    }
}

module.exports = { StateFactory };

