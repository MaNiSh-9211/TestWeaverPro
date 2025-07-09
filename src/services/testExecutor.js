const PlaywrightUtils = require('./playwright/utils');
const logger = require('../utils/logger');

class TestExecutor {
    constructor() {
        this.playwrightUtils = new PlaywrightUtils();
        this.executionContext = null;
        this.failFast = true;
    }
    
    async executeTest(testScript, testResult) {
        const startTime = Date.now();
        let currentStepIndex = 0;
        let executionResults = [];
        let success = true;
        let failedStep = null;
        
        try {
            logger.info(`Starting test execution: ${testScript.title}`);
            
            // Initialize browser
            await this.playwrightUtils.initializeBrowser({
                headless: true,
                viewport: { width: 1920, height: 1080 }
            });
            
            // Start DOM mutation tracking
            await this.playwrightUtils.startMutationTracking();
            
            // Navigate to initial URL
            await this.playwrightUtils.getBrowserManager().navigateToUrl(testScript.url);
            
            // Take initial screenshot
            const initialScreenshot = await this.playwrightUtils.getBrowserManager().takeScreenshot();
            await testResult.addEvidence('screenshot', initialScreenshot, 'Initial page load');
            
            // Execute setup steps if any
            if (testScript.setup && testScript.setup.length > 0) {
                logger.info('Executing setup steps');
                await testResult.addLog('info', 'Executing setup steps');
                
                for (const step of testScript.setup) {
                    const stepResult = await this.executeStep(step, testResult);
                    executionResults.push(stepResult);
                    
                    if (!stepResult.success && this.failFast) {
                        success = false;
                        failedStep = `setup-${testScript.setup.indexOf(step)}`;
                        break;
                    }
                }
            }
            
            // Execute main test steps
            if (success) {
                logger.info(`Executing ${testScript.steps.length} test steps`);
                await testResult.addLog('info', `Executing ${testScript.steps.length} test steps`);
                
                for (const step of testScript.steps) {
                    currentStepIndex++;
                    
                    const stepResult = await this.executeStep(step, testResult, currentStepIndex);
                    executionResults.push(stepResult);
                    
                    // Check for failure and fail-fast behavior
                    if (!stepResult.success && this.failFast) {
                        success = false;
                        failedStep = `step-${currentStepIndex}`;
                        logger.error(`Test failed at step ${currentStepIndex}: ${step.description}`);
                        break;
                    }
                }
            }
            
            // Execute assertions
            if (success && testScript.assertions) {
                logger.info('Executing assertions');
                await testResult.addLog('info', 'Executing assertions');
                
                for (const assertion of testScript.assertions) {
                    const assertionResult = await this.executeStep(assertion, testResult);
                    executionResults.push(assertionResult);
                    
                    if (!assertionResult.success && this.failFast) {
                        success = false;
                        failedStep = `assertion-${testScript.assertions.indexOf(assertion)}`;
                        break;
                    }
                }
            }
            
            // Execute teardown steps
            if (testScript.teardown && testScript.teardown.length > 0) {
                logger.info('Executing teardown steps');
                await testResult.addLog('info', 'Executing teardown steps');
                
                for (const step of testScript.teardown) {
                    const stepResult = await this.executeStep(step, testResult);
                    executionResults.push(stepResult);
                    // Don't fail on teardown errors unless critical
                }
            }
            
            // Take final screenshot
            const finalScreenshot = await this.playwrightUtils.getBrowserManager().takeScreenshot();
            await testResult.addEvidence('screenshot', finalScreenshot, 'Final page state');
            
            // Get DOM mutations
            const mutations = await this.playwrightUtils.getMutations();
            await testResult.addEvidence('dom', mutations, 'DOM mutations during test');
            
            const executionTime = Date.now() - startTime;
            
            logger.info(`Test execution completed: ${success ? 'SUCCESS' : 'FAILED'} (${executionTime}ms)`);
            
            return {
                success,
                steps: executionResults,
                failedStep,
                executionTime,
                totalSteps: testScript.steps.length,
                completedSteps: currentStepIndex
            };
            
        } catch (error) {
            logger.error('Test execution failed:', error);
            await testResult.addError(error, { step: 'test-execution' });
            
            // Take error screenshot
            try {
                const errorScreenshot = await this.playwrightUtils.getBrowserManager().takeScreenshot();
                await testResult.addEvidence('screenshot', errorScreenshot, 'Error screenshot');
            } catch (screenshotError) {
                logger.error('Failed to take error screenshot:', screenshotError);
            }
            
            const executionTime = Date.now() - startTime;
            
            return {
                success: false,
                steps: executionResults,
                failedStep: `step-${currentStepIndex}`,
                executionTime,
                totalSteps: testScript.steps.length,
                completedSteps: currentStepIndex,
                error: error.message
            };
        } finally {
            // Cleanup
            await this.playwrightUtils.cleanup();
        }
    }
    
    async executeStep(step, testResult, stepIndex = 0) {
        const stepStart = Date.now();
        
        try {
            logger.info(`Executing step ${stepIndex}: ${step.action} - ${step.description}`);
            
            await testResult.addLog('info', `Step ${stepIndex}: ${step.description}`, {
                action: step.action,
                selector: step.selector,
                value: step.value
            });
            
            // Take screenshot before action
            const beforeScreenshot = await this.playwrightUtils.getBrowserManager().takeScreenshot();
            await testResult.addEvidence('screenshot', beforeScreenshot, `Before step ${stepIndex}: ${step.description}`);
            
            let result = null;
            
            // Execute action based on type
            switch (step.action) {
                case 'click':
                    result = await this.executeClick(step);
                    break;
                case 'type':
                    result = await this.executeType(step);
                    break;
                case 'wait':
                    result = await this.executeWait(step);
                    break;
                case 'navigate':
                    result = await this.executeNavigate(step);
                    break;
                case 'scroll':
                    result = await this.executeScroll(step);
                    break;
                case 'hover':
                    result = await this.executeHover(step);
                    break;
                case 'select':
                    result = await this.executeSelect(step);
                    break;
                case 'check':
                    result = await this.executeCheck(step);
                    break;
                case 'uncheck':
                    result = await this.executeUncheck(step);
                    break;
                case 'submit':
                    result = await this.executeSubmit(step);
                    break;
                case 'assert':
                    result = await this.executeAssert(step);
                    break;
                default:
                    throw new Error(`Unknown action: ${step.action}`);
            }
            
            // Take screenshot after action
            const afterScreenshot = await this.playwrightUtils.getBrowserManager().takeScreenshot();
            await testResult.addEvidence('screenshot', afterScreenshot, `After step ${stepIndex}: ${step.description}`);
            
            const stepTime = Date.now() - stepStart;
            
            const stepResult = {
                stepIndex,
                action: step.action,
                selector: step.selector,
                description: step.description,
                success: true,
                result,
                executionTime: stepTime,
                timestamp: new Date()
            };
            
            logger.info(`Step ${stepIndex} completed successfully (${stepTime}ms)`);
            
            return stepResult;
            
        } catch (error) {
            logger.error(`Step ${stepIndex} failed:`, error);
            
            await testResult.addError(error, { 
                step: stepIndex,
                action: step.action,
                selector: step.selector,
                description: step.description
            });
            
            // Take error screenshot
            try {
                const errorScreenshot = await this.playwrightUtils.getBrowserManager().takeScreenshot();
                await testResult.addEvidence('screenshot', errorScreenshot, `Error at step ${stepIndex}: ${step.description}`);
            } catch (screenshotError) {
                logger.error('Failed to take error screenshot:', screenshotError);
            }
            
            const stepTime = Date.now() - stepStart;
            
            return {
                stepIndex,
                action: step.action,
                selector: step.selector,
                description: step.description,
                success: false,
                error: error.message,
                executionTime: stepTime,
                timestamp: new Date()
            };
        }
    }
    
    async executeClick(step) {
        const browserManager = this.playwrightUtils.getBrowserManager();
        
        // Wait for element to be clickable
        await browserManager.waitForSelector(step.selector, {
            timeout: step.timeout || 30000,
            state: 'visible'
        });
        
        // Wait for element to be stable
        await this.playwrightUtils.waitForElementStable(step.selector);
        
        // Highlight element before clicking
        await this.playwrightUtils.highlightElement(step.selector);
        
        // Click the element
        await browserManager.click(step.selector);
        
        // Wait for any potential navigation or loading
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        return { clicked: true };
    }
    
    async executeType(step) {
        const browserManager = this.playwrightUtils.getBrowserManager();
        
        if (!step.value) {
            throw new Error('Type action requires a value');
        }
        
        // Wait for element to be visible
        await browserManager.waitForSelector(step.selector, {
            timeout: step.timeout || 30000,
            state: 'visible'
        });
        
        // Clear existing content first
        await browserManager.click(step.selector);
        await browserManager.getPage().keyboard.down('Control');
        await browserManager.getPage().keyboard.press('KeyA');
        await browserManager.getPage().keyboard.up('Control');
        
        // Type the value
        await browserManager.type(step.selector, step.value);
        
        return { typed: step.value };
    }
    
    async executeWait(step) {
        const waitTime = step.waitTime || 1000;
        
        if (step.selector) {
            // Wait for selector
            await this.playwrightUtils.getBrowserManager().waitForSelector(step.selector, {
                timeout: step.timeout || 30000
            });
        } else {
            // Wait for time
            await new Promise(resolve => setTimeout(resolve, waitTime));
        }
        
        return { waited: waitTime };
    }
    
    async executeNavigate(step) {
        const browserManager = this.playwrightUtils.getBrowserManager();
        
        if (!step.value) {
            throw new Error('Navigate action requires a URL value');
        }
        
        await browserManager.navigateToUrl(step.value);
        
        return { navigated: step.value };
    }
    
    async executeScroll(step) {
        const browserManager = this.playwrightUtils.getBrowserManager();
        
        if (step.selector) {
            // Scroll to element
            await browserManager.getPage().locator(step.selector).scrollIntoViewIfNeeded();
        } else {
            // Scroll by amount
            const scrollY = step.value ? parseInt(step.value) : 500;
            await browserManager.scroll({ y: scrollY });
        }
        
        return { scrolled: true };
    }
    
    async executeHover(step) {
        const browserManager = this.playwrightUtils.getBrowserManager();
        
        await browserManager.waitForSelector(step.selector, {
            timeout: step.timeout || 30000,
            state: 'visible'
        });
        
        await browserManager.hover(step.selector);
        
        return { hovered: true };
    }
    
    async executeSelect(step) {
        const browserManager = this.playwrightUtils.getBrowserManager();
        
        if (!step.value) {
            throw new Error('Select action requires a value');
        }
        
        await browserManager.waitForSelector(step.selector, {
            timeout: step.timeout || 30000,
            state: 'visible'
        });
        
        await browserManager.select(step.selector, step.value);
        
        return { selected: step.value };
    }
    
    async executeCheck(step) {
        const browserManager = this.playwrightUtils.getBrowserManager();
        
        await browserManager.waitForSelector(step.selector, {
            timeout: step.timeout || 30000,
            state: 'visible'
        });
        
        await browserManager.check(step.selector);
        
        return { checked: true };
    }
    
    async executeUncheck(step) {
        const browserManager = this.playwrightUtils.getBrowserManager();
        
        await browserManager.waitForSelector(step.selector, {
            timeout: step.timeout || 30000,
            state: 'visible'
        });
        
        await browserManager.uncheck(step.selector);
        
        return { unchecked: true };
    }
    
    async executeSubmit(step) {
        const browserManager = this.playwrightUtils.getBrowserManager();
        
        await browserManager.waitForSelector(step.selector, {
            timeout: step.timeout || 30000,
            state: 'visible'
        });
        
        // Submit the form
        await browserManager.getPage().evaluate((selector) => {
            const element = document.querySelector(selector);
            if (element.tagName === 'FORM') {
                element.submit();
            } else {
                // Find parent form and submit
                const form = element.closest('form');
                if (form) {
                    form.submit();
                }
            }
        }, step.selector);
        
        // Wait for navigation or response
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        return { submitted: true };
    }
    
    async executeAssert(step) {
        const browserManager = this.playwrightUtils.getBrowserManager();
        
        if (!step.expected) {
            throw new Error('Assert action requires an expected value');
        }
        
        await browserManager.waitForSelector(step.selector, {
            timeout: step.timeout || 30000,
            state: 'visible'
        });
        
        const actualValue = await browserManager.getText(step.selector);
        const expected = step.expected;
        
        if (actualValue.trim() !== expected.trim()) {
            throw new Error(`Assertion failed: expected "${expected}" but got "${actualValue}"`);
        }
        
        return { 
            asserted: true,
            expected,
            actual: actualValue
        };
    }
}

module.exports = new TestExecutor();
