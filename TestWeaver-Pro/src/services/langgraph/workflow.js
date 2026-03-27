const BrowserManager = require('../playwright/browser');
const HtmlProcessor = require('../htmlProcessor');
const groqConfig = require('../../config/groq');
const { StateFactory } = require('./states');
const { generateSelectors } = require('./sample-test');
const logger = require('../../utils/logger');
const { z } = require('zod');
const SelectorSchema = require('../../schemas/testSchemas').SelectorSchema;

class TestAutomationWorkflow {
    constructor() {
        this.browserManager = new BrowserManager();
        this.htmlProcessor = HtmlProcessor;
        this.isInitialized = false;
    }
    
    async initialize() {
        if (this.isInitialized) {
            logger.info('Browser already initialized');
            return;
        }
        
        try {
            logger.info('🚀 Starting browser initialization...');
            
            await this.browserManager.initialize({
                headless: false, // Set to false to see the browser
                timeout: 60000
            });
            
            // Verify browser is actually initialized
            const page = this.browserManager.getPage();
            if (!page) {
                throw new Error('Browser page is null after initialization');
            }
            
            this.isInitialized = true;
            logger.info('✅ Browser initialized successfully for workflow');
            console.log('✅ Browser opened and ready!');
        } catch (error) {
            logger.error('❌ Failed to initialize browser:', error);
            console.error('❌ Browser initialization failed:', error.message);
            console.error('Full error:', error);
            throw error;
        }
    }
    
    async runWorkflow(initialState) {
        try {
            await this.initialize();
            
            let state = initialState;
            
            // Navigate to initial URL
            state = await this.navigateToUrl(state, state.baseUrl);
            
            // Iterative workflow: Generate testcases -> Execute -> Get new HTML -> Repeat
            let iterationCount = 0;
            const maxIterations = 20; // Safety limit
            
            while (iterationCount < maxIterations) {
                iterationCount++;
                logger.info(`\n🔄 Workflow Iteration ${iterationCount}`);
                
                // Before generating new testcases, ensure recent execution results are formatted
                // (This was done after last execution, but verify it's ready)
                if (iterationCount > 1 && state.recentExecutionResults.length === 0) {
                    // If somehow recent results are empty, prepare them from last batch
                    state = StateFactory.prepareRecentExecutionResultsForLLM(state);
                }
                
                if (state.recentExecutionResults.length > 0) {
                    logger.info(`📝 Passing last executed batch to LLM: ${state.recentExecutionResults.length} results (out of ${state.executionResults.length} total stored)`);
                }
                
                // Generate testcases for current HTML
                const newTestcases = await this.generateTestcasesForCurrentHTML(state);
                
                if (newTestcases.length === 0) {
                    logger.info('No more testcases possible with current HTML. User story may be complete or page needs navigation.');
                    // Check if last execution had shouldContinue: false
                    const lastResult = state.executionResults[state.executionResults.length - 1];
                    if (lastResult && lastResult.shouldContinue === false) {
                        logger.info('Last testcase indicated workflow should stop (shouldContinue: false)');
                        break;
                    }
                    // Wait a bit and check if page changed
                    await new Promise(resolve => setTimeout(resolve, 2000));
                    const html = await this.browserManager.getPageContent();
                    const cleanedHtml = await this.htmlProcessor.cleanHtml(html);
                    if (cleanedHtml === state.cleanedHtml) {
                        logger.info('Page HTML unchanged. Stopping workflow.');
                        break;
                    }
                    // HTML changed, continue
                    state = StateFactory.updateState(state, {
                        currentHtml: html,
                        cleanedHtml: cleanedHtml
                    });
                    continue;
                }
                
                // Add new testcases to state
                state = StateFactory.updateState(state, {
                    testcases: [...state.testcases, ...newTestcases],
                    currentTestcaseIndex: state.testcases.length
                });
                
                // Mark start of new execution batch
                state = StateFactory.startExecutionBatch(state);
                
                // Execute the newly generated testcases
                state = await this.executeTestcasesWithFallback(state);
                
                // After execution, format recent execution results for next LLM call
                // Passed testcases: Only successful selector
                // Failed testcases: All 3 selectors that were tried
                state = StateFactory.prepareRecentExecutionResultsForLLM(state);
                
                logger.info(`📊 Execution complete. Total results: ${state.executionResults.length}, Last batch (for LLM): ${state.recentExecutionResults.length} results`);
                
                // Check if last testcase indicated we should stop
                const lastExecution = state.executionResults[state.executionResults.length - 1];
                if (lastExecution && lastExecution.shouldContinue === false) {
                    logger.info('Last testcase indicated workflow should stop (shouldContinue: false)');
                    break;
                }
                
                // Get updated HTML after execution (page may have navigated)
                await new Promise(resolve => setTimeout(resolve, 1000)); // Wait for page to settle
                const html = await this.browserManager.getPageContent();
                const cleanedHtml = await this.htmlProcessor.cleanHtml(html);
                
                // Update state with new HTML
                state = StateFactory.updateState(state, {
                    currentHtml: html,
                    cleanedHtml: cleanedHtml
                });
                
                logger.info(`✅ Iteration ${iterationCount} complete. HTML updated. Ready for next batch.`);
            }
            
            // Retry failed testcases with new selectors
            state = await this.retryFailedTestcases(state);
            
            // Finalize workflow
            state = this.finalizeWorkflow(state);
            
            return state;
            
        } catch (error) {
            logger.error('Workflow execution failed:', error);
            return {
                ...initialState,
                status: 'failed',
                testSuccess: false,
                errors: [...initialState.errors, error.message],
                endTime: new Date()
            };
        } finally {
            // Don't cleanup browser - keep it for potential retries
        }
    }
    
    async navigateToUrl(state, url) {
        try {
            // Verify browser is initialized
            if (!this.isInitialized) {
                await this.initialize();
            }
            
            const page = this.browserManager.getPage();
            if (!page) {
                throw new Error('Browser page is not available. Browser may not be initialized.');
            }
            
            logger.info(`🌐 Navigating to: ${url}`);
            console.log(`🌐 Opening browser and navigating to: ${url}`);
            
            await this.browserManager.navigateToUrl(url, {
                waitForLoadState: 'networkidle'
            });
            
            logger.info('✅ Navigation successful');
            console.log('✅ Page loaded successfully');
            
            // Get current HTML
            const html = await this.browserManager.getPageContent();
            const cleanedHtml = await this.htmlProcessor.cleanHtml(html);
            
            logger.info(`📄 HTML content retrieved: ${html.length} characters`);
            
            return StateFactory.updateState(state, {
                currentUrl: url,
                currentHtml: html,
                cleanedHtml: cleanedHtml
            });
        } catch (error) {
            logger.error(`❌ Failed to navigate to ${url}:`, error);
            console.error(`❌ Navigation failed:`, error.message);
            throw error;
        }
    }
    
    async generateTestcasesForCurrentHTML(state) {
        try {
            const magenta = '\x1b[35m';
            const reset = '\x1b[0m';
            const bold = '\x1b[1m';
            
            console.log(`\n${magenta}${bold}╔════════════════════════════════════════════════════════════════╗${reset}`);
            console.log(`${magenta}${bold}║     📋 GENERATING TESTCASES FOR CURRENT HTML PAGE              ║${reset}`);
            console.log(`${magenta}${bold}╚════════════════════════════════════════════════════════════════╝${reset}\n`);
            
            logger.info('Generating testcases for current HTML using LLM');
            
            // Get current HTML for LLM (should already be in state, but refresh to be sure)
            const html = await this.browserManager.getPageContent();
            const cleanedHtml = await this.htmlProcessor.cleanHtml(html);
            
            // Update state with current HTML
            state = StateFactory.updateState(state, {
                currentHtml: html,
                cleanedHtml: cleanedHtml
            });
            
            // Handle API rate limits
            if (StateFactory.shouldWaitForRateLimit(state)) {
                const waitTime = StateFactory.getWaitTime(state);
                logger.info(`Waiting ${waitTime}ms for API rate limit...`);
                await new Promise(resolve => setTimeout(resolve, waitTime));
            }
            
            // Generate testcases using LLM (only for current HTML)
            const llmTestcases = await generateSelectors(
                state.userStory,
                cleanedHtml,
                state,
                null // No specific testcase - generate for current HTML
            );
            
            // Update API call time
            state = StateFactory.updateApiCallTime(state);
            
            // Convert LLM format to internal format
            const testcases = llmTestcases.map((tc, index) => ({
                id: tc.testcaseId || `tc-${state.testcases.length + index + 1}`,
                description: tc.description || `Testcase ${state.testcases.length + index + 1}`,
                steps: [],
                selectors: tc.selectors || []
            }));
            
            console.log(`${magenta}✅ Generated ${testcases.length} testcase(s) for current HTML:${reset}`);
            testcases.forEach((tc, index) => {
                console.log(`   ${magenta}${index + 1}.${reset} ${tc.id} - ${tc.description}`);
                console.log(`      Selectors: ${tc.selectors?.length || 0} (3 fallback selectors each)`);
            });
            console.log('');
            
            return testcases;
        } catch (error) {
            logger.error('Failed to generate testcases for current HTML:', error);
            return []; // Return empty array on error
        }
    }
    
    parseUserStoryToTestcases(userStory) {
        // Parse user story into logical testcases
        // This is a simple parser - can be enhanced with LLM
        const lines = userStory.split('\n').map(l => l.trim()).filter(l => l);
        const testcases = [];
        
        let currentTestcase = null;
        
        for (const line of lines) {
            const lowerLine = line.toLowerCase();
            
            // Detect testcase boundaries
            if (lowerLine.includes('step') || lowerLine.includes('visit') || lowerLine.includes('go to')) {
                if (currentTestcase) {
                    testcases.push(currentTestcase);
                }
                currentTestcase = {
                    id: `tc-${testcases.length + 1}`,
                    description: line,
                    steps: []
                };
            } else if (currentTestcase && (lowerLine.includes('click') || lowerLine.includes('fill') || lowerLine.includes('type') || lowerLine.includes('select'))) {
                currentTestcase.steps.push(line);
            }
        }
        
        if (currentTestcase) {
            testcases.push(currentTestcase);
        }
        
        // Ensure at least 3 testcases
        if (testcases.length === 0) {
            // Create default testcases from user story
            testcases.push(
                { id: 'tc-1', description: 'Initial navigation and setup', steps: [] },
                { id: 'tc-2', description: 'Main interaction flow', steps: [] },
                { id: 'tc-3', description: 'Verification and completion', steps: [] }
            );
        } else if (testcases.length < 3) {
            // Split into 3 testcases if less than 3
            const allSteps = testcases.flatMap(tc => tc.steps);
            const stepsPerTc = Math.ceil(allSteps.length / 3);
            
            testcases.length = 0;
            for (let i = 0; i < 3; i++) {
                testcases.push({
                    id: `tc-${i + 1}`,
                    description: `Testcase ${i + 1}`,
                    steps: allSteps.slice(i * stepsPerTc, (i + 1) * stepsPerTc)
                });
            }
        }
        
        return testcases.slice(0, 3); // Ensure exactly 3 testcases
    }
    
    async executeTestcasesWithFallback(state) {
        const startIndex = state.currentTestcaseIndex;
        const endIndex = state.testcases.length;
        
        for (let i = startIndex; i < endIndex; i++) {
            const testcase = state.testcases[i];
            
            // Check if already passed
            if (state.passedTestcases.includes(testcase.id)) {
                continue;
            }
            
            // Generate 3 selectors for this testcase
            state = await this.generateSelectorsForTestcase(state, testcase);
            
            // Try each selector until one succeeds
            let testcasePassed = false;
            let lastError = null;
            const allSelectorsTried = []; // Track all selectors tried for this testcase
            
            for (let selectorIndex = 0; selectorIndex < state.currentSelectors.length; selectorIndex++) {
                const selector = state.currentSelectors[selectorIndex];
                const attemptNumber = selectorIndex + 1; // Actual selector number (1, 2, or 3)
                
                // Track this selector as tried
                allSelectorsTried.push({
                    selector: selector.selector,
                    selectorIndex: attemptNumber,
                    success: false
                });
                
                try {
                    const result = await this.executeSelector(state, selector, testcase);
                    
                    if (result.success) {
                        // Update last tried selector to success
                        allSelectorsTried[allSelectorsTried.length - 1].success = true;
                        
                        state = StateFactory.markTestcasePassed(state, testcase.id);
                        state = StateFactory.addExecutionResult(state, {
                            testcaseId: testcase.id,
                            selectorIndex: selectorIndex,
                            selector: selector.selector, // Only the successful selector
                            allSelectorsTried: allSelectorsTried, // Track all that were tried
                            success: true,
                            shouldContinue: selector.shouldContinue !== false, // Track shouldContinue flag
                            timestamp: new Date()
                        });
                        testcasePassed = true;
                        
                        // Log testcase completion (PASSED) in real-time
                        logger.logTestcaseStatus(i + 1, state.testcases.length, testcase.id, 'passed', selector.selector);
                        break;
                    } else {
                        lastError = result.error;
                        // Log failed selector attempt (shows attempt number correctly)
                        logger.logSelectorExecution(selector, testcase.id, attemptNumber, false, result.error);
                    }
                } catch (error) {
                    lastError = error;
                    // Log error execution (shows attempt number correctly)
                    logger.logSelectorExecution(selector, testcase.id, attemptNumber, false, error);
                }
            }
            
            // If all selectors failed, mark testcase as failed
            if (!testcasePassed) {
                const allSelectorStrings = state.currentSelectors.map(s => s.selector);
                state = StateFactory.markTestcaseFailed(
                    state, 
                    testcase.id, 
                    allSelectorStrings, // All 3 selectors that failed
                    lastError
                );
                state = StateFactory.addExecutionResult(state, {
                    testcaseId: testcase.id,
                    success: false,
                    error: lastError?.message || lastError,
                    allSelectorsTried: allSelectorsTried, // All selectors that were tried
                    selectors: allSelectorStrings, // All 3 selectors for LLM
                    timestamp: new Date()
                });
                
                // Log testcase completion (FAILED) in real-time
                logger.logTestcaseStatus(i + 1, state.testcases.length, testcase.id, 'failed', null, lastError?.message || lastError);
            }
            
            // Update current testcase index
            state = StateFactory.updateState(state, {
                currentTestcaseIndex: i + 1
            });
        }
        
        return state;
    }
    
    async generateSelectorsForTestcase(state, testcase) {
        try {
            // If testcase already has selectors (from initial generation), use them
            if (testcase.selectors && testcase.selectors.length >= 3) {
                logger.info(`Using pre-generated selectors for testcase: ${testcase.id}`);
                
                // Validate selectors
                let validatedSelectors = [];
                let validationErrors = [];
                
                testcase.selectors.forEach((s, index) => {
                    try {
                        const validated = SelectorSchema.parse(s);
                        validatedSelectors.push(validated);
                    } catch (e) {
                        validationErrors.push({ index: index + 1, error: e.message, selector: s });
                        logger.warn(`❌ Invalid selector schema at index ${index + 1}: ${e.message}`);
                    }
                });
                
                // Ensure we have 3 valid selectors
                while (validatedSelectors.length < 3) {
                    logger.warn(`⚠️ Generating fallback selector ${validatedSelectors.length + 1}/3`);
                    const fallbackSelector = this.generateFallbackSelector(testcase, validatedSelectors.length);
                    validatedSelectors.push(fallbackSelector);
                }
                
                validatedSelectors = validatedSelectors.slice(0, 3);
                
                // Log testcase validation with colored output
                const isValid = validatedSelectors.length >= 3 && validationErrors.length === 0;
                logger.logTestcaseValidation(testcase, validatedSelectors, isValid);
                
                if (validationErrors.length > 0) {
                    logger.warn(`⚠️ ${validationErrors.length} selector(s) failed validation, using fallback selectors`);
                }
                
                // Set current selectors
                state = StateFactory.setCurrentSelectors(state, validatedSelectors);
                
                logger.info(`✅ Using ${validatedSelectors.length} pre-generated selectors for testcase ${testcase.id}`);
                
                return state;
            }
            
            // If no selectors, generate them (for retry scenarios)
            // Handle API rate limits
            if (StateFactory.shouldWaitForRateLimit(state)) {
                const waitTime = StateFactory.getWaitTime(state);
                logger.info(`Waiting ${waitTime}ms for API rate limit...`);
                await new Promise(resolve => setTimeout(resolve, waitTime));
            }
            
            logger.info(`Generating 3 selectors for testcase: ${testcase.id}`);
            
            // Get current HTML
            const html = await this.browserManager.getPageContent();
            const cleanedHtml = await this.htmlProcessor.cleanHtml(html);
            
            // Update state with current HTML
            state = StateFactory.updateState(state, {
                currentHtml: html,
                cleanedHtml: cleanedHtml
            });
            
            // Generate selectors using LLM
            const llmResult = await generateSelectors(
                state.userStory,
                cleanedHtml,
                state,
                testcase
            );
            
            // Handle new format (array of testcases) or old format (array of selectors)
            let selectors = [];
            if (Array.isArray(llmResult) && llmResult.length > 0) {
                if (llmResult[0].testcaseId && llmResult[0].selectors) {
                    // New format: array of testcases
                    const matchingTc = llmResult.find(tc => tc.testcaseId === testcase.id);
                    selectors = matchingTc ? matchingTc.selectors : (llmResult[0].selectors || []);
                } else {
                    // Old format: array of selectors
                    selectors = llmResult;
                }
            }
            
            // Validate and ensure we have 3 selectors
            let validatedSelectors = [];
            let validationErrors = [];
            
            if (Array.isArray(selectors)) {
                selectors.forEach((s, index) => {
                    try {
                        const validated = SelectorSchema.parse(s);
                        validatedSelectors.push(validated);
                    } catch (e) {
                        validationErrors.push({ index: index + 1, error: e.message, selector: s });
                        logger.warn(`❌ Invalid selector schema at index ${index + 1}: ${e.message}`);
                    }
                });
                
                validatedSelectors = validatedSelectors.slice(0, 3); // Take first 3 valid selectors
            }
            
            // If we don't have 3 selectors, generate fallback selectors
            while (validatedSelectors.length < 3) {
                logger.warn(`⚠️ Generating fallback selector ${validatedSelectors.length + 1}/3`);
                const fallbackSelector = this.generateFallbackSelector(testcase, validatedSelectors.length);
                validatedSelectors.push(fallbackSelector);
            }
            
            // Log testcase validation with colored output
            const isValid = validatedSelectors.length >= 3 && validationErrors.length === 0;
            logger.logTestcaseValidation(testcase, validatedSelectors, isValid);
            
            if (validationErrors.length > 0) {
                logger.warn(`⚠️ ${validationErrors.length} selector(s) failed validation, using fallback selectors`);
            }
            
            // Update API call time
            state = StateFactory.updateApiCallTime(state);
            
            // Set current selectors
            state = StateFactory.setCurrentSelectors(state, validatedSelectors);
            
            logger.info(`✅ Generated and validated ${validatedSelectors.length} selectors for testcase ${testcase.id}`);
            
            return state;
            
        } catch (error) {
            logger.error(`Failed to generate selectors for testcase ${testcase.id}:`, error);
            
            // Generate fallback selectors on error
            const fallbackSelectors = [
                this.generateFallbackSelector(testcase, 0),
                this.generateFallbackSelector(testcase, 1),
                this.generateFallbackSelector(testcase, 2)
            ];
            
            return StateFactory.setCurrentSelectors(state, fallbackSelectors);
        }
    }
    
    generateFallbackSelector(testcase, index) {
        // Generate basic fallback selectors based on testcase description
        const desc = testcase.description.toLowerCase();
        
        if (desc.includes('login') || desc.includes('button')) {
            return {
                element: `Fallback button selector ${index + 1}`,
                selector: index === 0 ? 'button[type="submit"]' : index === 1 ? 'button:has-text("Login")' : 'button:first-of-type',
                interaction_type: 'click',
                shouldContinue: true
            };
        } else if (desc.includes('input') || desc.includes('fill') || desc.includes('type')) {
            return {
                element: `Fallback input selector ${index + 1}`,
                selector: index === 0 ? 'input[type="text"]' : index === 1 ? 'input:first-of-type' : 'input',
                interaction_type: 'type',
                text: 'test',
                shouldContinue: true
            };
        } else {
            return {
                element: `Fallback selector ${index + 1}`,
                selector: `*:nth-child(${index + 1})`,
                interaction_type: 'click',
                shouldContinue: true
            };
        }
    }
    
    async executeSelector(state, selector, testcase) {
        try {
            const page = this.browserManager.getPage();
            const selectorStr = selector.selector || selector.xpath || selector;
            
            logger.info(`Executing selector: ${selectorStr}, interaction: ${selector.interaction_type}`);
            
            // Wait for selector to be available
            await page.waitForSelector(selectorStr, { timeout: 10000 }).catch(() => {
                throw new Error(`Selector not found: ${selectorStr}`);
            });
            
            // Execute interaction based on type
            switch (selector.interaction_type) {
                case 'click':
                    await page.click(selectorStr);
                    break;
                case 'type':
                    await page.fill(selectorStr, selector.text || '');
                    break;
                case 'hover':
                    await page.hover(selectorStr);
                    break;
                case 'select':
                    await page.selectOption(selectorStr, selector.text || '');
                    break;
                case 'check':
                    await page.check(selectorStr);
                    break;
                case 'uncheck':
                    await page.uncheck(selectorStr);
                    break;
                case 'scroll':
                    await page.evaluate((sel) => {
                        const el = document.querySelector(sel);
                        if (el) el.scrollIntoView();
                    }, selectorStr);
                    break;
                default:
                    await page.click(selectorStr);
            }
            
            // Wait a bit for page to update
            await page.waitForTimeout(1000);
            
            // Update HTML after interaction
            const html = await this.browserManager.getPageContent();
            const cleanedHtml = await this.htmlProcessor.cleanHtml(html);
            
            state = StateFactory.updateState(state, {
                currentHtml: html,
                cleanedHtml: cleanedHtml
            });
            
            return { success: true, state };
            
        } catch (error) {
            logger.error(`Selector execution failed: ${error.message}`);
            return { success: false, error };
        }
    }
    
    async retryFailedTestcases(state) {
        if (state.failedTestcases.length === 0) {
            logger.info('No failed testcases to retry');
            return state;
        }
        
        logger.info(`Retrying ${state.failedTestcases.length} failed testcases with new selectors`);
        
        // Reset retry count if needed
        if (state.retryCount >= state.maxRetries) {
            logger.warn('Max retries reached, skipping retry');
            return state;
        }
        
        state = StateFactory.incrementRetryCount(state);
        
        // For each failed testcase, regenerate selectors and retry
        for (const failedEntry of state.failedTestcasesWithSelectors) {
            const testcase = state.testcases.find(tc => tc.id === failedEntry.testcaseId);
            if (!testcase) continue;
            
            logger.info(`Retrying testcase ${failedEntry.testcaseId} with new selectors`);
            
            // Generate new selectors (excluding previously failed ones)
            state = await this.generateSelectorsForTestcase(state, testcase);
            
            // Try new selectors
            let retryPassed = false;
            
            for (let selectorIndex = 0; selectorIndex < state.currentSelectors.length; selectorIndex++) {
                const selector = state.currentSelectors[selectorIndex];
                
                // Skip if this selector was already tried
                if (failedEntry.selectors.includes(selector.selector)) {
                    continue;
                }
                
                logger.info(`Retrying with new selector ${selectorIndex + 1}/3: ${selector.selector}`);
                
                try {
                    const result = await this.executeSelector(state, selector, testcase);
                    
                    if (result.success) {
                        logger.info(`✅ Retry succeeded for testcase ${failedEntry.testcaseId}`);
                        state = StateFactory.markTestcasePassed(state, testcase.id);
                        state = StateFactory.addExecutionResult(state, {
                            testcaseId: testcase.id,
                            selectorIndex: selectorIndex,
                            selector: selector.selector,
                            success: true,
                            retry: true,
                            timestamp: new Date()
                        });
                        retryPassed = true;
                        break;
                    }
                } catch (error) {
                    logger.error(`Retry selector failed: ${error.message}`);
                }
            }
            
            if (!retryPassed) {
                logger.warn(`Retry failed for testcase ${failedEntry.testcaseId}, will be marked as failed`);
                // Update failed entry with new selectors tried
                state = StateFactory.markTestcaseFailed(
                    state,
                    testcase.id,
                    state.currentSelectors.map(s => s.selector),
                    'All retry selectors failed'
                );
            }
        }
        
        return state;
    }
    
    finalizeWorkflow(state) {
        const allPassed = state.failedTestcases.length === 0;
        const green = '\x1b[32m';
        const red = '\x1b[31m';
        const yellow = '\x1b[33m';
        const cyan = '\x1b[36m';
        const reset = '\x1b[0m';
        const bold = '\x1b[1m';
        const statusColor = allPassed ? green : red;
        const statusIcon = allPassed ? '✅' : '❌';
        
        console.log(`\n${statusColor}${bold}╔════════════════════════════════════════════════════════════════╗${reset}`);
        console.log(`${statusColor}${bold}║           🏁 WORKFLOW FINALIZATION - EXECUTION SUMMARY         ║${reset}`);
        console.log(`${statusColor}${bold}╚════════════════════════════════════════════════════════════════╝${reset}\n`);
        
        console.log(`${statusColor}${statusIcon} FINAL STATUS: ${allPassed ? 'ALL TESTCASES PASSED' : 'SOME TESTCASES FAILED'}${reset}`);
        console.log(`\n${cyan}📊 EXECUTION SUMMARY:${reset}`);
        console.log(`   ${yellow}Total Testcases:${reset} ${state.testcases.length}`);
        console.log(`   ${green}✅ Passed:${reset} ${state.passedTestcases.length}`);
        console.log(`   ${red}❌ Failed:${reset} ${state.failedTestcases.length}`);
        console.log(`   ${cyan}📝 Total Execution Results:${reset} ${state.executionResults.length}`);
        
        // Show PASSED testcases first
        if (state.passedTestcases.length > 0) {
            console.log(`\n${green}${bold}✅ PASSED TESTCASES:${reset}`);
            console.log(`${green}─────────────────────────────────────────────────────────${reset}`);
            state.testcases.forEach((tc, index) => {
                if (state.passedTestcases.includes(tc.id)) {
                    const result = state.executionResults.find(r => r.testcaseId === tc.id && r.success);
                    const selector = result ? result.selector : 'N/A';
                    console.log(`   ${green}✅ ${index + 1}. ${tc.id} - ${tc.description}${reset}`);
                    console.log(`      Successful Selector: ${selector}`);
                }
            });
            console.log(`${green}─────────────────────────────────────────────────────────${reset}`);
        }
        
        // Show FAILED testcases together at the end
        if (state.failedTestcases.length > 0) {
            console.log(`\n${red}${bold}❌ FAILED TESTCASES:${reset}`);
            console.log(`${red}─────────────────────────────────────────────────────────${reset}`);
            state.testcases.forEach((tc, index) => {
                if (state.failedTestcases.includes(tc.id)) {
                    const failedEntry = state.failedTestcasesWithSelectors.find(f => f.testcaseId === tc.id);
                    console.log(`   ${red}❌ ${index + 1}. ${tc.id} - ${tc.description}${reset}`);
                    if (failedEntry) {
                        console.log(`      ${red}Error:${reset} ${failedEntry.error}`);
                        console.log(`      ${red}Tried Selectors (${failedEntry.selectors.length}):${reset}`);
                        failedEntry.selectors.forEach((sel, idx) => {
                            console.log(`         ${idx + 1}. ${sel}`);
                        });
                    }
                }
            });
            console.log(`${red}─────────────────────────────────────────────────────────${reset}`);
        }
        
        const duration = state.endTime ? 
            Math.round((state.endTime - state.startTime) / 1000) : 
            Math.round((new Date() - state.startTime) / 1000);
        console.log(`\n${cyan}⏱️  Total Duration:${reset} ${duration}s`);
        console.log(`${cyan}─────────────────────────────────────────────────────────${reset}\n`);
        
        return StateFactory.updateState(state, {
            status: allPassed ? 'completed' : 'completed_with_failures',
            testSuccess: allPassed,
            shouldContinue: false,
            endTime: new Date()
        });
    }
}

module.exports = TestAutomationWorkflow;

