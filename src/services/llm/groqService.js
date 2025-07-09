const groqConfig = require('../../config/groq');
const { validateSelectors, validateTestScript } = require('../../schemas/testSchemas');
const logger = require('../../utils/logger');

class GroqService {
    constructor() {
        this.config = groqConfig;
    }
    
    async generateSelectors(userStory, cleanedHtml) {
        try {
            logger.info('Generating selectors with Groq LLM');
            
            const systemPrompt = `You are an expert web automation engineer. Your task is to analyze HTML content and generate CSS selectors for elements that would be needed to test the given user story.

Rules:
1. Generate precise CSS selectors that target specific elements
2. Prefer ID selectors when available, then class selectors, then attribute selectors
3. Avoid overly specific selectors that might break easily
4. Include XPath alternatives for complex selections
5. Provide confidence scores (0-1) for each selector
6. Include reasoning for each selector choice

Return your response as a JSON array of objects with this structure:
[
  {
    "element": "description of the element",
    "selector": "CSS selector",
    "xpath": "XPath selector (optional)",
    "confidence": 0.9,
    "reasoning": "why this selector was chosen"
  }
]`;
            
            const userPrompt = `User Story: ${userStory}

HTML Content:
${cleanedHtml}

Please analyze the HTML and generate appropriate selectors for testing this user story.`;
            
            const response = await this.config.makeRequest([
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt }
            ]);
            
            // Parse and validate the response
            const selectors = this.parseJsonResponse(response);
            const validatedSelectors = validateSelectors(selectors);
            
            logger.info(`Generated ${validatedSelectors.length} selectors`);
            return validatedSelectors;
            
        } catch (error) {
            logger.error('Failed to generate selectors:', error);
            throw new Error(`Selector generation failed: ${error.message}`);
        }
    }
    
    async generateTestScript(userStory, selectors, cleanedHtml) {
        try {
            logger.info('Generating test script with Groq LLM');
            
            const systemPrompt = `You are an expert test automation engineer. Your task is to generate a comprehensive test script based on the user story, available selectors, and HTML content.

Rules:
1. Create a logical sequence of test steps
2. Use only the provided selectors
3. Include proper waits and assertions
4. Handle potential errors gracefully
5. Add meaningful descriptions for each step
6. Use appropriate timeouts
7. Include setup and teardown steps if needed

Available Actions:
- click: Click on an element
- type: Type text into an input field
- wait: Wait for a specific time or condition
- navigate: Navigate to a URL
- scroll: Scroll the page
- hover: Hover over an element
- select: Select an option from a dropdown
- check: Check a checkbox
- uncheck: Uncheck a checkbox
- submit: Submit a form
- assert: Assert element state or content

Return your response as a JSON object with this structure:
{
  "title": "Test title",
  "description": "Test description",
  "url": "starting URL",
  "steps": [
    {
      "action": "click",
      "selector": "CSS selector",
      "description": "Human readable description",
      "timeout": 30000,
      "value": "text to type (for type action)",
      "expected": "expected result (for assert action)"
    }
  ],
  "assertions": [
    {
      "action": "assert",
      "selector": "CSS selector",
      "description": "What to assert",
      "expected": "expected value"
    }
  ]
}`;
            
            const selectorsText = selectors.map(s => 
                `Element: ${s.element}\nSelector: ${s.selector}\nReasoning: ${s.reasoning}`
            ).join('\n\n');
            
            const userPrompt = `User Story: ${userStory}

Available Selectors:
${selectorsText}

HTML Content:
${cleanedHtml}

Please generate a comprehensive test script for this user story.`;
            
            const response = await this.config.makeRequest([
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt }
            ]);
            
            // Parse and validate the response
            const testScript = this.parseJsonResponse(response);
            const validatedScript = validateTestScript(testScript);
            
            logger.info(`Generated test script with ${validatedScript.steps.length} steps`);
            return validatedScript;
            
        } catch (error) {
            logger.error('Failed to generate test script:', error);
            throw new Error(`Test script generation failed: ${error.message}`);
        }
    }
    
    async enhanceSelectors(selectors, domState) {
        try {
            logger.info('Enhancing selectors with DOM state');
            
            const systemPrompt = `You are an expert web automation engineer. Your task is to enhance existing selectors based on current DOM state and make them more robust.

Rules:
1. Improve selector specificity if needed
2. Add fallback selectors
3. Optimize for better performance
4. Handle dynamic content
5. Maintain selector reliability

Return enhanced selectors in the same format as input.`;
            
            const userPrompt = `Current Selectors:
${JSON.stringify(selectors, null, 2)}

Current DOM State:
${JSON.stringify(domState, null, 2)}

Please enhance these selectors for better reliability.`;
            
            const response = await this.config.makeRequest([
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt }
            ]);
            
            const enhancedSelectors = this.parseJsonResponse(response);
            return validateSelectors(enhancedSelectors);
            
        } catch (error) {
            logger.error('Failed to enhance selectors:', error);
            return selectors; // Return original selectors if enhancement fails
        }
    }
    
    async generateAssertions(userStory, executionResults) {
        try {
            logger.info('Generating assertions based on execution results');
            
            const systemPrompt = `You are an expert test automation engineer. Your task is to generate meaningful assertions based on the user story and test execution results.

Rules:
1. Generate assertions that validate the user story requirements
2. Include both positive and negative test cases
3. Check for element states, text content, and visibility
4. Validate user flow completion
5. Include error handling assertions

Return assertions in the same format as test steps.`;
            
            const userPrompt = `User Story: ${userStory}

Execution Results:
${JSON.stringify(executionResults, null, 2)}

Please generate appropriate assertions for this test.`;
            
            const response = await this.config.makeRequest([
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt }
            ]);
            
            const assertions = this.parseJsonResponse(response);
            return assertions;
            
        } catch (error) {
            logger.error('Failed to generate assertions:', error);
            return [];
        }
    }
    
    async analyzeTestFailure(testScript, executionResults, error) {
        try {
            logger.info('Analyzing test failure with Groq LLM');
            
            const systemPrompt = `You are an expert test automation engineer. Your task is to analyze test failures and provide insights for improvement.

Analyze the test failure and provide:
1. Root cause analysis
2. Potential fixes
3. Improved selectors or steps
4. Recommendations for test stability

Return your analysis as a JSON object with:
{
  "rootCause": "explanation of the root cause",
  "suggestedFixes": ["fix1", "fix2"],
  "improvedSelectors": [],
  "recommendations": ["recommendation1", "recommendation2"]
}`;
            
            const userPrompt = `Test Script:
${JSON.stringify(testScript, null, 2)}

Execution Results:
${JSON.stringify(executionResults, null, 2)}

Error:
${error}

Please analyze this test failure and provide recommendations.`;
            
            const response = await this.config.makeRequest([
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt }
            ]);
            
            return this.parseJsonResponse(response);
            
        } catch (error) {
            logger.error('Failed to analyze test failure:', error);
            return {
                rootCause: 'Unable to analyze failure',
                suggestedFixes: [],
                improvedSelectors: [],
                recommendations: []
            };
        }
    }
    
    parseJsonResponse(response) {
        try {
            // Remove markdown code blocks if present
            const cleanResponse = response.replace(/```json\n?/, '').replace(/```\n?$/, '');
            
            // Parse JSON
            const parsed = JSON.parse(cleanResponse);
            return parsed;
            
        } catch (error) {
            logger.error('Failed to parse JSON response:', error);
            logger.error('Response content:', response);
            throw new Error(`Invalid JSON response: ${error.message}`);
        }
    }
    
    async testConnection() {
        try {
            logger.info('Testing Groq API connection');
            
            const response = await this.config.makeRequest([
                { role: 'user', content: 'Hello, can you confirm the connection is working?' }
            ]);
            
            logger.info('Groq API connection test successful');
            return true;
        } catch (error) {
            logger.error('Groq API connection test failed:', error);
            return false;
        }
    }
    
    async estimateTokens(text) {
        // Rough estimation: 1 token ≈ 4 characters
        return Math.ceil(text.length / 4);
    }
    
    async optimizePrompt(prompt, maxTokens = 8000) {
        try {
            const currentTokens = await this.estimateTokens(prompt);
            
            if (currentTokens <= maxTokens) {
                return prompt;
            }
            
            // Truncate prompt if too long
            const targetLength = maxTokens * 4 * 0.8; // 80% of max to be safe
            const truncatedPrompt = prompt.substring(0, targetLength);
            
            logger.warn(`Prompt truncated from ${prompt.length} to ${truncatedPrompt.length} characters`);
            return truncatedPrompt;
            
        } catch (error) {
            logger.error('Failed to optimize prompt:', error);
            return prompt;
        }
    }
}

module.exports = new GroqService();
