# How Testcases Are Stored in State - Current Implementation

## Current Behavior: **ALL TESTCASES ARE STORED**

### How It Works:

#### 1. **Testcases Array (`state.testcases`)**
- **Contains:** ALL testcases from ALL iterations
- **Storage Method:** Accumulative (adds new testcases to existing ones)
- **Code Location:** `workflow.js` line 94

```javascript
// Line 94: New testcases are ADDED to existing ones
testcases: [...state.testcases, ...newTestcases]
```

**Example Flow:**
- **Iteration 1:** Generates [tc-1, tc-2, tc-3] → `state.testcases = [tc-1, tc-2, tc-3]`
- **Iteration 2:** Generates [tc-4, tc-5] → `state.testcases = [tc-1, tc-2, tc-3, tc-4, tc-5]`
- **Iteration 3:** Generates [tc-6] → `state.testcases = [tc-1, tc-2, tc-3, tc-4, tc-5, tc-6]`

#### 2. **Execution Results Array (`state.executionResults`)**
- **Contains:** ALL execution results from ALL testcases
- **Storage Method:** Accumulative (adds new results to existing ones)
- **Code Location:** `states.js` line 65

```javascript
// Each execution result is added to the array
executionResults: [...state.executionResults, result]
```

**Example:**
- Each testcase execution creates a result object
- All results are stored: `[{tc-1 result}, {tc-2 result}, {tc-3 result}, ...]`

#### 3. **Current Testcase Index (`state.currentTestcaseIndex`)**
- **Purpose:** Tracks which testcase to execute next
- **Updated:** After each testcase execution (line 382)
- **Usage:** Used to determine which testcases to execute in each iteration

```javascript
// Line 305-306: Executes only NEW testcases
const startIndex = state.currentTestcaseIndex;  // e.g., 3 (after iteration 1)
const endIndex = state.testcases.length;        // e.g., 5 (after iteration 2)
// Executes testcases from index 3 to 5 (tc-4, tc-5)
```

### Complete State Structure:

```javascript
state = {
  // ALL testcases from all iterations
  testcases: [
    { id: 'tc-1', description: '...', selectors: [...] },  // Iteration 1
    { id: 'tc-2', description: '...', selectors: [...] },  // Iteration 1
    { id: 'tc-3', description: '...', selectors: [...] },  // Iteration 1
    { id: 'tc-4', description: '...', selectors: [...] },  // Iteration 2
    { id: 'tc-5', description: '...', selectors: [...] },  // Iteration 2
    // ... more from subsequent iterations
  ],
  
  // Index of next testcase to execute
  currentTestcaseIndex: 5,  // Will execute from tc-6 onwards
  
  // ALL execution results from all testcases
  executionResults: [
    { testcaseId: 'tc-1', success: true, ... },
    { testcaseId: 'tc-2', success: true, ... },
    { testcaseId: 'tc-3', success: false, ... },
    // ... all results
  ],
  
  // Tracking arrays
  passedTestcases: ['tc-1', 'tc-2', 'tc-4'],
  failedTestcases: ['tc-3'],
  failedTestcasesWithSelectors: [
    { testcaseId: 'tc-3', selectors: [...], error: '...' }
  ]
}
```

### Workflow Iteration Process:

```
Iteration 1:
├── Generate testcases: [tc-1, tc-2, tc-3]
├── Add to state: testcases = [tc-1, tc-2, tc-3]
├── currentTestcaseIndex = 0
├── Execute: tc-1, tc-2, tc-3
├── Update: currentTestcaseIndex = 3
└── executionResults = [result1, result2, result3]

Iteration 2:
├── Generate testcases: [tc-4, tc-5]
├── Add to state: testcases = [tc-1, tc-2, tc-3, tc-4, tc-5]  ← ALL STORED
├── currentTestcaseIndex = 3 (from previous)
├── Execute: tc-4, tc-5 (only new ones)
├── Update: currentTestcaseIndex = 5
└── executionResults = [result1, result2, result3, result4, result5]  ← ALL STORED
```

### Key Points:

✅ **ALL testcases are stored** - from all iterations
✅ **ALL execution results are stored** - complete history
✅ **Only NEW testcases are executed** in each iteration (using currentTestcaseIndex)
✅ **State persists** across iterations - nothing is lost
✅ **Final summary shows ALL testcases** (line 724: `state.testcases.forEach`)

### Benefits of Current Approach:

1. **Complete History:** All testcases and results are available for reporting
2. **Retry Capability:** Failed testcases can be retried with their original selectors
3. **Full Audit Trail:** Complete record of all test executions
4. **Final Summary:** Can show all testcases with their status at the end

### Potential Considerations:

- **Memory Usage:** If many iterations, state can grow large
- **Performance:** Large arrays might slow down state updates
- **Clarity:** All testcases mixed together (but can be filtered by iteration if needed)

---

## Summary:

**Answer:** ALL testcases are stored in `state.testcases` - not just the latest ones. The array accumulates testcases from all iterations throughout the entire workflow execution. Similarly, `state.executionResults` contains ALL execution results from all testcases.

