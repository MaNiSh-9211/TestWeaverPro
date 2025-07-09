const { chromium } = require('playwright');
const { v4: uuidv4 } = require('uuid');

class TestAutomationService {
    constructor() {
        this.browser = null;
        this.tests = new Map(); // In-memory storage for tests
    }

    async initializeBrowser() {
        if (!this.browser) {
            this.browser = await chromium.launch({
                headless: true,
                executablePath: '/nix/store/zi4f80l169xlmivz8vja8wlphq74qqk0-chromium-125.0.6422.141/bin/chromium',
                args: [
                    '--no-sandbox', 
                    '--disable-setuid-sandbox',
                    '--disable-dev-shm-usage',
                    '--disable-extensions',
                    '--disable-gpu',
                    '--disable-web-security',
                    '--allow-running-insecure-content',
                    '--disable-features=VizDisplayCompositor'
                ]
            });
            console.log('Browser initialized with system Chromium');
        }
        return this.browser;
    }

    async executeTest(userStory, url) {
        const testId = uuidv4();
        const testResult = {
            testId,
            userStory,
            url,
            status: 'running',
            startTime: new Date(),
            steps: [],
            screenshots: [],
            errors: []
        };

        // Store test in memory
        this.tests.set(testId, testResult);

        try {
            console.log(`Starting test execution for: ${testId}`);
            
            // Initialize browser
            await this.initializeBrowser();
            const context = await this.browser.newContext();
            const page = await context.newPage();

            // Step 1: Navigate to URL
            console.log(`Navigating to: ${url}`);
            await page.goto(url);
            testResult.steps.push({
                action: 'navigate',
                description: `Navigate to ${url}`,
                timestamp: new Date(),
                success: true
            });

            // Take initial screenshot
            const initialScreenshot = await page.screenshot({ fullPage: true });
            testResult.screenshots.push({
                description: 'Initial page load',
                timestamp: new Date(),
                data: initialScreenshot.toString('base64')
            });

            // Step 2: Analyze page content
            const pageTitle = await page.title();
            const pageContent = await page.content();
            
            console.log(`Page title: ${pageTitle}`);
            testResult.steps.push({
                action: 'analyze',
                description: `Analyzed page: ${pageTitle}`,
                timestamp: new Date(),
                success: true
            });

            // Step 3: Generate test steps based on user story
            const testSteps = this.generateTestSteps(userStory, pageContent);
            
            // Step 4: Execute test steps
            for (const step of testSteps) {
                try {
                    await this.executeStep(page, step);
                    testResult.steps.push({
                        ...step,
                        success: true,
                        timestamp: new Date()
                    });
                } catch (error) {
                    console.error(`Step failed: ${step.action}`, error);
                    testResult.steps.push({
                        ...step,
                        success: false,
                        error: error.message,
                        timestamp: new Date()
                    });
                    testResult.errors.push({
                        step: step.action,
                        error: error.message,
                        timestamp: new Date()
                    });
                    break; // Fail-fast execution
                }
            }

            // Take final screenshot
            const finalScreenshot = await page.screenshot({ fullPage: true });
            testResult.screenshots.push({
                description: 'Final page state',
                timestamp: new Date(),
                data: finalScreenshot.toString('base64')
            });

            // Close context
            await context.close();

            // Update test result
            testResult.status = testResult.errors.length === 0 ? 'passed' : 'failed';
            testResult.endTime = new Date();
            testResult.duration = testResult.endTime - testResult.startTime;

            console.log(`Test completed: ${testId} - ${testResult.status}`);
            
        } catch (error) {
            console.error(`Test execution failed for ${testId}:`, error);
            testResult.status = 'failed';
            testResult.endTime = new Date();
            testResult.duration = testResult.endTime - testResult.startTime;
            testResult.errors.push({
                step: 'execution',
                error: error.message,
                timestamp: new Date()
            });
        }

        // Update stored test result
        this.tests.set(testId, testResult);
        return testResult;
    }

    generateTestSteps(userStory, pageContent) {
        const steps = [];
        const story = userStory.toLowerCase();
        
        // Extract credentials from user story
        const credentials = this.extractCredentials(userStory);
        
        // Login flow with extracted credentials
        if (story.includes('login') || story.includes('sign in') || story.includes('enter the user name and password')) {
            if (credentials.username) {
                steps.push({
                    action: 'fill',
                    description: `Fill username field with: ${credentials.username}`,
                    selector: 'input[type="text"], input[name*="user"], input[id*="user"], input[placeholder*="user"]',
                    value: credentials.username
                });
            }
            
            if (credentials.password) {
                steps.push({
                    action: 'fill',
                    description: `Fill password field with: ${credentials.password}`,
                    selector: 'input[type="password"], input[name*="pass"], input[id*="pass"]',
                    value: credentials.password
                });
            }
            
            steps.push({
                action: 'click',
                description: 'Click login button',
                selector: 'button[type="submit"], input[type="submit"], button:has-text("login"), button:has-text("Login"), button:has-text("Sign in")'
            });
            
            // Add wait for page load after login
            steps.push({
                action: 'wait',
                description: 'Wait for page to load after login',
                duration: 5000
            });
        }
        
        // Delete functionality
        if (story.includes('delete') && story.includes('question')) {
            steps.push({
                action: 'click',
                description: 'Click delete question button',
                selector: 'button:has-text("delete"), button:has-text("Delete"), button:has-text("delete question"), button:has-text("Delete Question")'
            });
        }
        
        // General fill actions (non-login)
        if ((story.includes('fill') || story.includes('enter') || story.includes('type')) && !story.includes('password')) {
            steps.push({
                action: 'fill',
                description: 'Fill form field',
                selector: 'input[type="text"], input[type="email"], textarea',
                value: 'test@example.com'
            });
        }
        
        // General click actions (non-login)
        if (story.includes('click') && !story.includes('login')) {
            steps.push({
                action: 'click',
                description: 'Click on interactive element',
                selector: 'button, input[type="button"], input[type="submit"], a'
            });
        }
        
        // Add wait steps for slow loading
        if (story.includes('slowly') || story.includes('take some time')) {
            steps.push({
                action: 'wait',
                description: 'Wait for slow loading content',
                duration: 3000
            });
        }
        
        return steps;
    }
    
    extractCredentials(userStory) {
        const credentials = {};
        
        // Extract username - look for patterns like "username is : manish-9211"
        const usernameMatches = [
            /username.*?is\s*:?\s*([^\s\n]+)/i,
            /user.*?name.*?:?\s*([^\s\n]+)/i,
            /username.*?:?\s*([^\s\n]+)/i
        ];
        
        for (const pattern of usernameMatches) {
            const match = userStory.match(pattern);
            if (match) {
                credentials.username = match[1].trim();
                break;
            }
        }
        
        // Extract password - look for patterns like "password is kaku"
        const passwordMatches = [
            /password.*?is\s*:?\s*([^\s\n]+)/i,
            /password.*?:?\s*([^\s\n]+)/i,
            /pass.*?:?\s*([^\s\n]+)/i
        ];
        
        for (const pattern of passwordMatches) {
            const match = userStory.match(pattern);
            if (match) {
                credentials.password = match[1].trim();
                break;
            }
        }
        
        return credentials;
    }

    async executeStep(page, step) {
        switch (step.action) {
            case 'click':
                let clickElement;
                try {
                    // Handle :has-text() selector
                    if (step.selector.includes(':has-text(')) {
                        const textMatch = step.selector.match(/:has-text\("([^"]+)"\)/);
                        if (textMatch) {
                            const buttonText = textMatch[1];
                            clickElement = page.locator(`button:has-text("${buttonText}"), input[type="submit"][value*="${buttonText}"]`);
                        } else {
                            clickElement = page.locator(step.selector);
                        }
                    } else {
                        clickElement = page.locator(step.selector);
                    }
                    
                    await clickElement.first().click({ timeout: 10000 });
                    console.log(`Clicked element: ${step.selector}`);
                } catch (error) {
                    // Try alternative selectors for login buttons
                    if (step.description.includes('login')) {
                        const loginButtons = [
                            'button[type="submit"]',
                            'input[type="submit"]',
                            'button:has-text("Login")',
                            'button:has-text("Sign in")',
                            'button:has-text("Submit")',
                            '.login-btn',
                            '#login-btn'
                        ];
                        
                        for (const selector of loginButtons) {
                            try {
                                await page.locator(selector).first().click({ timeout: 5000 });
                                console.log(`Clicked login button with selector: ${selector}`);
                                return;
                            } catch (e) {
                                continue;
                            }
                        }
                    }
                    
                    // Try alternative selectors for delete buttons
                    if (step.description.includes('delete')) {
                        const deleteButtons = [
                            'button:has-text("Delete")',
                            'button:has-text("delete")',
                            'button[class*="delete"]',
                            'button[id*="delete"]',
                            '.delete-btn',
                            '.btn-delete'
                        ];
                        
                        for (const selector of deleteButtons) {
                            try {
                                await page.locator(selector).first().click({ timeout: 5000 });
                                console.log(`Clicked delete button with selector: ${selector}`);
                                return;
                            } catch (e) {
                                continue;
                            }
                        }
                    }
                    
                    throw new Error(`Element not found or not clickable: ${step.selector}`);
                }
                break;
                
            case 'fill':
            case 'search':
            case 'login':
                try {
                    const fillElement = page.locator(step.selector).first();
                    await fillElement.fill(step.value, { timeout: 10000 });
                    console.log(`Filled element: ${step.selector} with: ${step.value}`);
                } catch (error) {
                    // Try alternative selectors based on step description
                    if (step.description.includes('username')) {
                        const usernameSelectors = [
                            'input[name="username"]',
                            'input[name="user"]',
                            'input[id="username"]',
                            'input[id="user"]',
                            'input[placeholder*="username"]',
                            'input[placeholder*="user"]',
                            'input[type="text"]'
                        ];
                        
                        for (const selector of usernameSelectors) {
                            try {
                                await page.locator(selector).first().fill(step.value, { timeout: 5000 });
                                console.log(`Filled username field with selector: ${selector}`);
                                return;
                            } catch (e) {
                                continue;
                            }
                        }
                    }
                    
                    if (step.description.includes('password')) {
                        const passwordSelectors = [
                            'input[name="password"]',
                            'input[name="pass"]',
                            'input[id="password"]',
                            'input[id="pass"]',
                            'input[type="password"]'
                        ];
                        
                        for (const selector of passwordSelectors) {
                            try {
                                await page.locator(selector).first().fill(step.value, { timeout: 5000 });
                                console.log(`Filled password field with selector: ${selector}`);
                                return;
                            } catch (e) {
                                continue;
                            }
                        }
                    }
                    
                    throw new Error(`Element not found or not fillable: ${step.selector}`);
                }
                break;
                
            case 'scroll':
                await page.evaluate(() => {
                    window.scrollTo(0, document.body.scrollHeight / 2);
                });
                console.log('Scrolled page');
                break;
                
            case 'wait':
                await page.waitForTimeout(step.duration);
                console.log(`Waited ${step.duration}ms`);
                break;
                
            default:
                throw new Error(`Unknown step action: ${step.action}`);
        }
    }

    getTestResult(testId) {
        return this.tests.get(testId);
    }

    getAllTests() {
        return Array.from(this.tests.values());
    }

    async generateReport(testId) {
        const testResult = this.tests.get(testId);
        if (!testResult) {
            throw new Error(`Test not found: ${testId}`);
        }

        const report = {
            testId: testResult.testId,
            userStory: testResult.userStory,
            url: testResult.url,
            status: testResult.status,
            startTime: testResult.startTime,
            endTime: testResult.endTime,
            duration: testResult.duration,
            totalSteps: testResult.steps.length,
            successfulSteps: testResult.steps.filter(s => s.success).length,
            failedSteps: testResult.steps.filter(s => !s.success).length,
            screenshots: testResult.screenshots.length,
            errors: testResult.errors.length,
            steps: testResult.steps,
            screenshotData: testResult.screenshots
        };

        return report;
    }

    async cleanup() {
        if (this.browser) {
            await this.browser.close();
            this.browser = null;
            console.log('Browser closed');
        }
    }
}

module.exports = new TestAutomationService();