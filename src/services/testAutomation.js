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
                args: ['--no-sandbox', '--disable-setuid-sandbox']
            });
            console.log('Browser initialized');
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
        // Simple test step generation based on user story keywords
        const steps = [];
        
        // Convert user story to lowercase for easier matching
        const story = userStory.toLowerCase();
        
        // Basic step generation based on common user story patterns
        if (story.includes('click') || story.includes('button')) {
            steps.push({
                action: 'click',
                description: 'Click on interactive element',
                selector: 'button, input[type="button"], input[type="submit"], a'
            });
        }
        
        if (story.includes('fill') || story.includes('enter') || story.includes('type')) {
            steps.push({
                action: 'fill',
                description: 'Fill form field',
                selector: 'input[type="text"], input[type="email"], textarea',
                value: 'test@example.com'
            });
        }
        
        if (story.includes('search')) {
            steps.push({
                action: 'search',
                description: 'Perform search',
                selector: 'input[type="search"], input[name*="search"], input[placeholder*="search"]',
                value: 'test search query'
            });
        }
        
        if (story.includes('login') || story.includes('sign in')) {
            steps.push({
                action: 'login',
                description: 'Login process',
                selector: 'input[type="email"], input[type="text"]',
                value: 'test@example.com'
            });
        }
        
        // Always add a scroll step to test page interaction
        steps.push({
            action: 'scroll',
            description: 'Scroll page to test responsiveness'
        });
        
        // Add wait step for dynamic content
        steps.push({
            action: 'wait',
            description: 'Wait for page to load completely',
            duration: 2000
        });
        
        return steps;
    }

    async executeStep(page, step) {
        switch (step.action) {
            case 'click':
                const clickElement = await page.locator(step.selector).first();
                if (await clickElement.isVisible()) {
                    await clickElement.click();
                    console.log(`Clicked element: ${step.selector}`);
                } else {
                    throw new Error(`Element not found or not visible: ${step.selector}`);
                }
                break;
                
            case 'fill':
            case 'search':
            case 'login':
                const fillElement = await page.locator(step.selector).first();
                if (await fillElement.isVisible()) {
                    await fillElement.fill(step.value);
                    console.log(`Filled element: ${step.selector} with: ${step.value}`);
                } else {
                    throw new Error(`Element not found or not visible: ${step.selector}`);
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