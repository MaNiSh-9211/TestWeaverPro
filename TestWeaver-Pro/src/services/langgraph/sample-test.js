const systemPrompt = `
🧠 SYSTEM ROLE:
You are an expert-level **web automation engineer** specialized in analyzing HTML pages and generating robust selectors to automate end-to-end test flows using **Playwright**.

🎯 OBJECTIVE:
Your goal is to analyze the **CURRENT HTML CONTENT** and the user story, then generate **ONLY the testcases that are possible with the current HTML**. For EACH testcase, you must provide **EXACTLY 3 ALTERNATIVE SELECTORS** (following strict syntax rules). The system will try each selector in order until one succeeds.

📌 CRITICAL REQUIREMENT - GENERATE ONLY POSSIBLE TESTCASES:
- **MUST analyze the CURRENT HTML content** provided to you
- **ONLY generate testcases that are possible with the elements available in the current HTML**
- **DO NOT generate testcases for future pages or elements not present in current HTML**
- **EACH testcase MUST have EXACTLY 3 different selectors** (fallback selectors)
- Each selector should use a DIFFERENT approach (ID, class, attribute, text, xpath, role)
- These are FALLBACK selectors - if one fails, the next will be tried automatically
- All 3 selectors for a testcase should target the SAME element but use different strategies
- After executing testcases, the system will navigate to a new page and provide you with NEW HTML
- You will be called again with the new HTML to generate the next batch of testcases
- This process continues until the entire user story is completed

📌 SELECTOR RULES:
1. ✅ Always generate selectors Playwright can directly use.
2. ✅ Prefer selectors in this order:
    a. ID selectors → "#login"
    b. Class selectors → ".btn-primary"
    c. Attribute selectors → "[data-testid='xyz']"
    d. Text selectors → "text=Submit"
    e. XPath → "xpath=//div[@id='foo']"
    f. Role selectors → "role=button[name='Submit']"
3. ✅ Always prepend XPath with 'xpath='. (e.g., 'xpath=//input[@type="text"]')
4. ❌ Do NOT use jQuery-style, JavaScript APIs, or invalid chaining (e.g., '$('div')'', 'getElementById', 'div >> text=...')
5. ✅ All selectors **must work directly with 'page.locator()'**

📐 FORMAT REQUIREMENTS:
Your response **must return an array of testcase objects**. Each testcase object contains:
- testcaseId: unique identifier
- description: what this testcase does
- selectors: array of EXACTLY 3 selector objects (fallback selectors)

\`\`\`json
[
  {
    "testcaseId": "tc-1",
    "description": "Navigate to login page",
    "selectors": [
      {
        "element": "Login page link",
        "selector": "#login-link",
        "xpath": "xpath=//a[@id='login-link']",
        "confidence": 0.95,
        "reasoning": "Primary selector using ID",
        "interaction_type": "click",
        "shouldContinue": true
      },
      {
        "element": "Login page link",
        "selector": "text=Login",
        "xpath": "xpath=//a[text()='Login']",
        "confidence": 0.85,
        "reasoning": "Fallback selector using text",
        "interaction_type": "click",
        "shouldContinue": true
      },
      {
        "element": "Login page link",
        "selector": "a[href*='login']",
        "xpath": "xpath=//a[contains(@href, 'login')]",
        "confidence": 0.75,
        "reasoning": "Fallback selector using href attribute",
        "interaction_type": "click",
        "shouldContinue": true
      }
    ]
  },
  {
    "testcaseId": "tc-2",
    "description": "Fill username field",
    "selectors": [
      {
        "element": "Username input field",
        "selector": "#username",
        "xpath": "xpath=//input[@id='username']",
        "confidence": 0.95,
        "reasoning": "Primary selector using ID",
        "interaction_type": "type",
        "text": "testuser",
        "shouldContinue": true
      },
      {
        "element": "Username input field",
        "selector": "input[name='username']",
        "xpath": "xpath=//input[@name='username']",
        "confidence": 0.85,
        "reasoning": "Fallback selector using name attribute",
        "interaction_type": "type",
        "text": "testuser",
        "shouldContinue": true
      },
      {
        "element": "Username input field",
        "selector": "input[type='text']:first-of-type",
        "xpath": "xpath=//input[@type='text'][1]",
        "confidence": 0.70,
        "reasoning": "Fallback selector using type and position",
        "interaction_type": "type",
        "text": "testuser",
        "shouldContinue": true
      }
    ]
  }
]
\`\`\`

**IMPORTANT**: Generate ONLY testcases that are possible with the CURRENT HTML. Do NOT generate testcases for elements not present in the current page. After execution, new HTML will be provided for the next batch.

🧠 LOGIC FOR 'shouldContinue':
- If you believe the **next test step can be performed**, set 'shouldContinue: true'.
- If you believe **no actionable interactions** are left, or **the user story is fully completed**, set 'shouldContinue: false' in the **last object** to stop the workflow loop.

🛠️ EXAMPLE OUTPUT (ALL TESTCASES WITH 3 SELECTORS EACH):
See the format above. Generate ALL testcases needed to complete the user story.

👮 VALID SELECTORS PLAYWRIGHT UNDERSTANDS:
- "#login-btn" → ✅
- ".btn-primary" → ✅
- "text=Submit" → ✅
- "xpath=//button[@id='login']" → ✅
- "role=button[name='Submit']" → ✅
- "[data-testid='username']" → ✅
- "input[name='email']" → ✅
- "button:has-text('Login')" → ✅

❌ INVALID SELECTORS (DO NOT USE):
- "//button[@id='login']" → ❌ (missing 'xpath=')
- "$('div')" → ❌ (jQuery syntax)
- "div >> text=Submit" → ❌ (invalid chaining)
- "getElementById()" or "document.querySelector" → ❌
- "*" or "#" or "." alone → ❌ (incomplete)

🏁 OUTPUT POLICY:
- **ONLY analyze the CURRENT HTML** provided in "cleanedHtml"
- **ONLY generate testcases for elements that actually exist in the current HTML**
- **DO NOT predict or generate testcases for future pages** - wait for new HTML to be provided
- All selectors must be **grounded ONLY in the provided "cleanedHtml"**
- **ALWAYS return exactly 3 selectors** for EACH testcase
- Generate testcases in logical execution order based on what's available NOW
- If no actionable elements are found in current HTML, return empty array or minimal testcases
- After testcases are executed, the page will update and NEW HTML will be provided to you
- You will be called again with the updated HTML to generate the next batch of testcases

🔄 FAILED TESTCASE HANDLING:
- If you see "failedTestcasesWithSelectors" in the state, those testcases failed with all their selectors
- Generate COMPLETELY NEW selectors (different from the failed ones) for retry
- Analyze why previous selectors failed and use alternative strategies

`.trim();


async function generateSelectors(userStory, cleanedHtml, state, testcase = null) {
    const groqConfig = require('../../config/groq');
    const logger = require('../../utils/logger');
    
    const testcaseInfo = testcase ? `\n\n🎯 CURRENT TESTCASE:\nID: ${testcase.id}\nDescription: ${testcase.description}\nSteps: ${JSON.stringify(testcase.steps, null, 2)}` : '';
    
    // Use recent execution results only (last executed batch)
    const recentResults = state.recentExecutionResults || [];
    const totalResults = state.executionResults?.length || 0;
    
    // Log what's being passed to LLM
    logger.info(`📤 Passing to LLM: ${recentResults.length} results from last executed batch (out of ${totalResults} total stored)`);
    if (totalResults > recentResults.length) {
        logger.info(`   ℹ️  ${totalResults - recentResults.length} older results not included to keep LLM input manageable`);
    }
    
    // Build execution results info for prompt
    let executionResultsInfo = '';
    if (recentResults.length > 0) {
        executionResultsInfo = `\n\n🧪 LAST EXECUTED BATCH RESULTS:\n${JSON.stringify(recentResults, null, 2)}\n\n📌 IMPORTANT NOTES:\n`;
        executionResultsInfo += `- ✅ PASSED testcases show only the SELECTOR THAT WORKED (not all 3)\n`;
        executionResultsInfo += `- ❌ FAILED testcases show ALL 3 SELECTORS that were tried (so you can generate different ones)\n`;
        executionResultsInfo += `- For failed testcases, generate COMPLETELY DIFFERENT selectors than the ones shown\n`;
    } else {
        executionResultsInfo = `\n\n🧪 LAST EXECUTED BATCH RESULTS:\nNo previous execution results. This is the first batch.\n`;
    }
    
    const userPrompt = `
📖 USER STORY:
${userStory}
${testcaseInfo}

🧾 CURRENT HTML SNAPSHOT:
${cleanedHtml}
${executionResultsInfo}

⚠️ NOTE: Only the last executed batch (${recentResults.length} results) is shown above. All ${totalResults} testcases are tracked in the system for final summary.

🧭 INSTRUCTION:
You are executing a test automation scenario. Analyze the **CURRENT HTML** and generate **ONLY testcases that are possible with the current page**.

**CRITICAL: Generate ONLY testcases possible with CURRENT HTML, NOT all testcases upfront**

1. Analyze the **CURRENT HTML** provided in "cleanedHtml" - this is the actual page content right now
2. Compare with the user story to identify which parts of the user story can be executed NOW
3. Generate **ONLY testcases for elements that exist in the current HTML**
4. For EACH testcase, generate **EXACTLY 3 DIFFERENT SELECTORS** (using different strategies: ID, class, text, xpath, attribute, role)
5. Return an **array of testcase objects**, where each testcase contains:
   - testcaseId: unique identifier (e.g., "tc-1", "tc-2", "tc-3")
   - description: what this testcase does
   - selectors: array of exactly 3 selector objects (fallback selectors)

⚠️ CRITICAL REQUIREMENTS:
- **ONLY generate testcases for elements that ACTUALLY EXIST in the current HTML**
- **DO NOT generate testcases for future pages or elements not present in current HTML**
- **EACH testcase MUST have exactly 3 selectors** - these are fallback selectors
- Each selector should use a DIFFERENT approach (don't repeat the same strategy)
- All 3 selectors for a testcase should target the SAME element but with different selector strategies
- Generate testcases in logical execution order based on what's available NOW
- If this is a retry for failed testcases, use COMPLETELY DIFFERENT selectors than the failed ones
- All selectors MUST be based on elements visible in the current HTML

🔁 WORKFLOW PROCESS:
1. You analyze current HTML and generate testcases possible NOW
2. Test runner executes these testcases (trying each of 3 selectors per testcase)
3. After execution, the page navigates/updates and NEW HTML is captured
4. The NEW HTML is provided to you again
5. You analyze the NEW HTML and generate the NEXT batch of testcases
6. This continues until the entire user story is completed

⚙️ REMEMBER:
- Only generate testcases for CURRENT HTML - don't predict future pages
- Each testcase must have exactly 3 selectors
- Maintain correct structure, strict selector validity, and proper ordering
- You will be called multiple times as the page updates - generate only what's possible NOW
`.trim();
    
    try {
        const messages = [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
        ];
        
        // Log the full prompt being sent to LLM
        const fullPrompt = `SYSTEM PROMPT:\n${systemPrompt}\n\nUSER PROMPT:\n${userPrompt}`;
        const startTime = Date.now();
        
        logger.logLLMRequest(fullPrompt, {
            testcaseId: testcase?.id,
            model: groqConfig.model,
            htmlLength: cleanedHtml.length,
            userStoryLength: userStory.length
        });
        
        logger.info('Calling LLM to generate selectors...');
        const response = await groqConfig.makeRequest(messages);
        
        const responseTime = Date.now() - startTime;
        
        // Log the raw response from LLM
        logger.logLLMResponse(response, {
            testcaseId: testcase?.id,
            responseTime: responseTime,
            responseLength: response.length
        });
        
        // Parse JSON response - expecting array of testcases
        let testcases = [];
        try {
            // Try to extract JSON from markdown code blocks
            const jsonMatch = response.match(/```(?:json)?\s*(\[[\s\S]*?\])\s*```/);
            if (jsonMatch) {
                logger.info('📦 Extracted JSON from markdown code block');
                testcases = JSON.parse(jsonMatch[1]);
            } else {
                // Try parsing the entire response as JSON
                logger.info('📦 Parsing entire response as JSON');
                testcases = JSON.parse(response);
            }
            
            logger.info(`✅ Successfully parsed ${testcases.length} testcase(s) from LLM response`);
            
            // Validate and ensure each testcase has 3 selectors
            testcases = testcases.map((tc, index) => {
                if (!tc.testcaseId) {
                    tc.testcaseId = `tc-${index + 1}`;
                }
                if (!tc.selectors || !Array.isArray(tc.selectors)) {
                    logger.warn(`⚠️ Testcase ${tc.testcaseId} has no selectors array, creating empty array`);
                    tc.selectors = [];
                }
                
                // Ensure exactly 3 selectors per testcase
                while (tc.selectors.length < 3) {
                    logger.warn(`⚠️ Testcase ${tc.testcaseId} has only ${tc.selectors.length} selectors, generating fallback`);
                    const lastSelector = tc.selectors.length > 0 ? tc.selectors[tc.selectors.length - 1] : {
                        element: `Fallback element for ${tc.testcaseId}`,
                        selector: `*:nth-child(${tc.selectors.length + 1})`,
                        interaction_type: 'click'
                    };
                    const newSelector = {
                        ...lastSelector,
                        selector: `${lastSelector.selector}_fallback_${tc.selectors.length + 1}`,
                        reasoning: `Fallback selector ${tc.selectors.length + 1}`
                    };
                    tc.selectors.push(newSelector);
                }
                
                // Take only first 3
                tc.selectors = tc.selectors.slice(0, 3);
                
                return tc;
            });
            
            logger.info(`✅ Processed ${testcases.length} testcases, each with 3 selectors`);
            
        } catch (parseError) {
            logger.error('❌ Failed to parse LLM response as JSON:', parseError);
            logger.error('Raw response:', response);
            throw new Error(`Invalid JSON response from LLM: ${parseError.message}`);
        }
        
        // Return all testcases (new format)
        return testcases;
        
    } catch (error) {
        logger.error('❌ Failed to generate selectors:', error);
        throw error;
    }
}

module.exports = { generateSelectors, systemPrompt };