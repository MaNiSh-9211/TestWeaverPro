# Execution Results Format for LLM

## How Execution Results Are Passed to LLM

### Key Principle:
- **Only LAST EXECUTED BATCH** is passed to LLM (not all results)
- **Passed testcases:** Only the **successful selector** is included
- **Failed testcases:** **ALL 3 selectors** that were tried are included

## Format Details

### For PASSED Testcases:
```json
{
  "testcaseId": "tc-1",
  "success": true,
  "selector": "#login-btn",  // ✅ ONLY the selector that worked
  "selectorIndex": 1,
  "shouldContinue": true,
  "timestamp": "2024-01-01T10:00:00Z"
}
```

### For FAILED Testcases:
```json
{
  "testcaseId": "tc-2",
  "success": false,
  "error": "Selector not found",
  "selectors": [  // ✅ ALL 3 selectors that were tried
    "#submit-btn",
    "button[type='submit']",
    "text=Submit"
  ],
  "message": "This testcase failed with the following selectors: #submit-btn, button[type='submit'], text=Submit. Please generate COMPLETELY DIFFERENT selectors.",
  "timestamp": "2024-01-01T10:01:00Z"
}
```

## Example Flow

### Iteration 1:
```
Execute: tc-1, tc-2, tc-3

Results stored:
- tc-1: ✅ Passed with selector "#login" (selector 1 of 3 worked)
- tc-2: ❌ Failed - all 3 selectors tried: ["#submit", "button", "text=Submit"]
- tc-3: ✅ Passed with selector "input[name='email']" (selector 2 of 3 worked)

Passed to LLM (recentExecutionResults):
[
  {
    "testcaseId": "tc-1",
    "success": true,
    "selector": "#login"  // ✅ Only successful one
  },
  {
    "testcaseId": "tc-2",
    "success": false,
    "selectors": ["#submit", "button", "text=Submit"]  // ✅ All 3 that failed
  },
  {
    "testcaseId": "tc-3",
    "success": true,
    "selector": "input[name='email']"  // ✅ Only successful one
  }
]
```

### Iteration 2:
```
Execute: tc-4, tc-5

Results stored:
- tc-4: ✅ Passed
- tc-5: ❌ Failed

Passed to LLM (recentExecutionResults):
[
  {
    "testcaseId": "tc-4",
    "success": true,
    "selector": "..."  // ✅ Only successful selector
  },
  {
    "testcaseId": "tc-5",
    "success": false,
    "selectors": ["sel1", "sel2", "sel3"]  // ✅ All 3 that failed
  }
]

Note: tc-1, tc-2, tc-3 from iteration 1 are NOT included
```

## Benefits

1. **Prevents Input Growth:** Only last batch passed to LLM
2. **Clear Success Info:** For passed testcases, LLM knows which selector worked
3. **Clear Failure Info:** For failed testcases, LLM knows all selectors that failed
4. **Better Regeneration:** LLM can generate completely different selectors for failures
5. **Complete History:** All results still stored in `executionResults` for final summary

## State Structure

```javascript
state = {
  // ALL execution results (for final summary)
  executionResults: [
    { testcaseId: 'tc-1', success: true, selector: '#login', ... },
    { testcaseId: 'tc-2', success: false, selectors: [...], ... },
    // ... all results
  ],
  
  // Only last executed batch (for LLM)
  recentExecutionResults: [
    // Only results from last iteration
    // Passed: only successful selector
    // Failed: all 3 selectors
  ],
  
  // Tracking
  lastExecutionBatchStartIndex: 3,  // Where last batch started
  lastExecutionBatchEndIndex: 5     // Where last batch ended
}
```

