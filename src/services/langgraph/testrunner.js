// Import the TestAutomationWorkflow class
const TestAutomationWorkflow = require('./workflow'); // ✅ adjust if your file is named differently

// Import the StateFactory from your state definition file
const { StateFactory } = require('./states'); // ✅ adjust if your file is named differently

// Create the workflow instance
const testAutomationWorkflow = new TestAutomationWorkflow();

// Create a mock test result logger (you can replace this with DB or external logger)
const testResult = {
    status: '',
    log: [],
    addLog: function (msg) {
        this.log.push(msg);
        console.log('📝 Log:', msg);
    },
    setStatus: function (status) {
        this.status = status;
    }
};

// Define your test parameters
const testId = 'test-001';
const userStory = 'complete form fill and select random values and then submit the form';
const baseUrl = 'https://testpages.eviltester.com/styled/basic-html-form-test.html';



// Create the initial workflow state
const initialState = StateFactory.createInitialState(testId, userStory, baseUrl, testResult);

// Run the workflow
testAutomationWorkflow.runWorkflow(initialState)
    .then(finalState => {
        console.log('\n✅ Workflow completed successfully');
        console.log('🧠 Final State:', JSON.stringify(finalState, null, 2));
    })
    .catch(error => {
        console.error('❌ Workflow failed with error:', error.message || error);
    });
