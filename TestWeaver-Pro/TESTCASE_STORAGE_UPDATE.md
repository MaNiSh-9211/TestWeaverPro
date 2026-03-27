# Updated Testcase Storage Logic

## Changes Made

### Problem Solved:
- **Before:** All execution results were passed to LLM, causing input to grow indefinitely
- **After:** Only recent execution results (last 5) are passed to LLM, while ALL testcases remain stored for final summary

## Implementation Details

### 1. State Structure (Updated)

```javascript
state = {
  // ALL testcases from all iterations (for final summary)
  testcases: [tc-1, tc-2, tc-3, tc-4, ...],  // ✅ ALL STORED
  
  // ALL execution results (for final summary)
  executionResults: [result1, result2, result3, ...],  // ✅ ALL STORED
  
  // Only recent execution results (for LLM input)
  recentExecutionResults: [resultN-4, resultN-3, resultN-2, resultN-1, resultN],  // ✅ ONLY LAST 5
  
  // Other tracking arrays remain the same
  passedTestcases: [...],
  failedTestcases: [...],
  failedTestcasesWithSelectors: [...]
}
```

### 2. New State Factory Methods

#### `clearRecentExecutionResults(state, keepLastN = 3)`
- Keeps only the last N execution results in `recentExecutionResults`
- All results remain in `executionResults` for final summary
- Called after each batch execution

#### `resetRecentExecutionResults(state)`
- Resets recent execution results for new iteration
- Can be used if needed for specific scenarios

### 3. Workflow Changes

#### After Each Batch Execution:
```javascript
// After executing testcases
state = await this.executeTestcasesWithFallback(state);

// Keep only last 5 results for next LLM call
state = StateFactory.clearRecentExecutionResults(state, 5);
```

#### Before Next LLM Call:
```javascript
// Prepare recent execution results for LLM
if (iterationCount > 1) {
    state = StateFactory.clearRecentExecutionResults(state, 5);
    logger.info(`📝 Prepared recent execution results: ${state.recentExecutionResults.length} results`);
}
```

### 4. LLM Prompt Update

**Before:**
```javascript
🧪 PREVIOUSLY EXECUTED TEST RESULTS:
${JSON.stringify(state.executionResults || [], null, 2)}  // ❌ ALL RESULTS
```

**After:**
```javascript
🧪 RECENTLY EXECUTED TEST RESULTS (Last executed batch only - ${recentResults.length} results):
${JSON.stringify(recentResults, null, 2)}  // ✅ ONLY LAST 5

⚠️ NOTE: Only the most recent execution results are shown above to keep context focused.
All ${totalResults} testcases are tracked in the system for final summary.
```

## Flow Example

```
Iteration 1:
├── Generate: [tc-1, tc-2, tc-3]
├── Execute: tc-1, tc-2, tc-3
├── executionResults = [r1, r2, r3]  ← ALL STORED
├── recentExecutionResults = [r1, r2, r3]  ← ALL (first iteration)
└── After execution: recentExecutionResults = [r1, r2, r3]  ← Still all (first batch)

Iteration 2:
├── Before LLM: recentExecutionResults = [r1, r2, r3]  ← Last batch
├── Generate: [tc-4, tc-5] (using only recent results)
├── Execute: tc-4, tc-5
├── executionResults = [r1, r2, r3, r4, r5]  ← ALL STORED
├── recentExecutionResults = [r1, r2, r3, r4, r5]  ← After execution
└── After execution: recentExecutionResults = [r1, r2, r3, r4, r5]  ← Last 5

Iteration 3:
├── Before LLM: recentExecutionResults = [r1, r2, r3, r4, r5]  ← Last 5
├── Generate: [tc-6] (using only last 5 results)
├── Execute: tc-6
├── executionResults = [r1, r2, r3, r4, r5, r6]  ← ALL STORED
├── recentExecutionResults = [r1, r2, r3, r4, r5, r6]  ← After execution
└── After execution: recentExecutionResults = [r2, r3, r4, r5, r6]  ← Last 5 only

Final Summary:
├── Shows ALL testcases: [tc-1, tc-2, tc-3, tc-4, tc-5, tc-6]  ✅
├── Shows ALL execution results: [r1, r2, r3, r4, r5, r6]  ✅
└── Complete history preserved  ✅
```

## Benefits

1. **Prevents LLM Input Growth:** Only last 5 execution results passed to LLM
2. **Complete History:** All testcases and results still stored for final summary
3. **Context Maintained:** Recent results provide enough context for next batch
4. **Memory Efficient:** LLM input size stays manageable
5. **Full Audit Trail:** Final summary shows complete execution history

## Key Points

✅ **ALL testcases stored** in `state.testcases` (for final summary)
✅ **ALL execution results stored** in `state.executionResults` (for final summary)
✅ **Only recent results** in `state.recentExecutionResults` (for LLM input)
✅ **Final summary unchanged** - still shows all testcases and results
✅ **LLM input optimized** - prevents token limit issues

