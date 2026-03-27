// Import the TestAutomationWorkflow class
const TestAutomationWorkflow = require('./workflow');

// Import the StateFactory from your state definition file
const { StateFactory } = require('./states');

const logger = require('../../utils/logger');

/**
 * Main entry point for test execution
 * This file starts the workflow by creating initial state and running the test automation workflow
 */
async function executeTest(testId, userStory, baseUrl, testResult = null) {
    try {
        // Create a test result logger if not provided
        if (!testResult) {
            testResult = {
                status: '',
                log: [],
                addLog: function (msg) {
                    this.log.push(msg);
                    logger.info(`📝 Log: ${msg}`);
                },
                setStatus: function (status) {
                    this.status = status;
                    logger.info(`📊 Status: ${status}`);
                }
            };
        }
        
        logger.info(`\n🚀 Starting test execution: ${testId}`);
        logger.info(`📖 User Story: ${userStory.substring(0, 100)}...`);
        logger.info(`🌐 Base URL: ${baseUrl}\n`);
        
        // Create the workflow instance
        const testAutomationWorkflow = new TestAutomationWorkflow();
        
        // Create the initial workflow state
        const initialState = StateFactory.createInitialState(testId, userStory, baseUrl, testResult);
        
        // Run the workflow
        const finalState = await testAutomationWorkflow.runWorkflow(initialState);
        
        logger.info('\n✅ Workflow completed');
        logger.info(`📊 Final Status: ${finalState.status}`);
        logger.info(`✅ Passed Testcases: ${finalState.passedTestcases.length}`);
        logger.info(`❌ Failed Testcases: ${finalState.failedTestcases.length}`);
        
        // Log final state summary
        console.log('\n📋 Execution Summary:');
        console.log(`   Status: ${finalState.status}`);
        console.log(`   Test Success: ${finalState.testSuccess}`);
        console.log(`   Passed: ${finalState.passedTestcases.length}/${finalState.testcases.length}`);
        console.log(`   Failed: ${finalState.failedTestcases.length}/${finalState.testcases.length}`);
        console.log(`   Total Execution Results: ${finalState.executionResults.length}`);
        
        if (finalState.failedTestcases.length > 0) {
            console.log('\n❌ Failed Testcases:');
            finalState.failedTestcases.forEach(tcId => {
                const failedEntry = finalState.failedTestcasesWithSelectors.find(f => f.testcaseId === tcId);
                if (failedEntry) {
                    console.log(`   - ${tcId}: ${failedEntry.error}`);
                }
            });
        }
        
        return finalState;
        
    } catch (error) {
        logger.error('❌ Test execution failed:', error);
        console.error('❌ Workflow failed with error:', error.message || error);
        throw error;
    }
}

// If this file is run directly, execute a test
if (require.main === module) {
    const testId = process.argv[2] || 'test-001';
    const userStory = process.argv[3] || `Agent Instructions (follow exactly)
Steps (strict order):

Visit login page and perform simulated login (fill all input types present in the page).
Go to Big form tab . Fill every visible field with valid values(fill all input types present in the page).
Solve the captcha (a small math sum) shown on the form and submit.
After submission, proceed to /interaction. Execute the interactive sequence: Click Button 1, Click Button 2, Click "Increase Counter" 3 times, Toggle the checkbox.
Start the multi-step form via /multi-step-start and complete both steps.
Finally visit logs page  and verify your actions against the expected sequence on the left.
Important details
The site uses dynamic element IDs to emulate a real site. IDs are randomized per page load.
Some hidden honeypot fields exist — do NOT fill fields with names starting with hp_.
There may be small random server delays to simulate latency. Be patient.`;
    const baseUrl = process.argv[4] || 'http://localhost:9211';
    
    executeTest(testId, userStory, baseUrl)
        .then(finalState => {
            console.log('\n✅ Test execution completed');
            process.exit(finalState.testSuccess ? 0 : 1);
        })
        .catch(error => {
            console.error('❌ Test execution failed:', error);
            process.exit(1);
        });
}

module.exports = { executeTest };
