# Agent Pattern Comparison: Old vs New API

## Overview

This document explains the comparison between two agent API patterns:

1. **Old Pattern**: `run(agent, inputText, {})` - Current implementation
2. **New Pattern**: `Runner` + `withTrace()` - Modern API with better observability

## Running the Comparison

```bash
# Test with default ISBN (Book Lovers by Emily Henry)
npx tsx scripts/compare-agent-patterns.ts

# Test with specific ISBN
npx tsx scripts/compare-agent-patterns.ts 9780593440872
```

## What Gets Compared

### Metrics
- **Execution Time**: How long each pattern takes
- **Success Rate**: Whether each pattern completes successfully
- **Warning Count**: Number of content warnings generated
- **Error Handling**: How each pattern handles errors

### Features
- **Trace/Observability**: New pattern provides detailed execution traces
- **Conversation Management**: New pattern has better history management
- **Model Settings**: New pattern supports `reasoning` and `store` options

## Results Interpretation

The script outputs:
1. **Comparison Table**: Side-by-side results for each pattern
2. **Performance Metrics**: Time differences and success rates
3. **Recommendation**: Whether to migrate based on results

### Example Output

```
HYBRID MODE:
────────────────────────────────────────────────────────────────────────────────
Pattern          │ Status   │ Warnings │ Time (ms) │ Has Trace │ Error
────────────────────────────────────────────────────────────────────────────────
Old Pattern      │ success  │        5 │      3456 │ false     │ None
New Pattern      │ success  │        5 │      3210 │ true      │ None

⏱️  Time Difference: -246ms (-7.1%)
📊 Warning Count Difference: 0
✅ New pattern provides trace/observability (old pattern does not)
```

## Key Differences

### Old Pattern (`run()`)
```typescript
const agent = new Agent({ ... });
const result = await run(agent, inputText, {});
```
- ✅ Simple, straightforward
- ✅ Currently working in production
- ❌ No built-in tracing
- ❌ Limited conversation management

### New Pattern (`Runner` + `withTrace()`)
```typescript
const agent = new Agent({ 
  modelSettings: {
    reasoning: { effort: "low", summary: "auto" },
    store: true
  }
});

const result = await withTrace("workflow", async () => {
  const runner = new Runner({ traceMetadata: { ... } });
  return await runner.run(agent, conversationHistory);
});
```
- ✅ Built-in tracing and observability
- ✅ Better conversation history management
- ✅ Modern API (what Agent Builder exports)
- ✅ Model settings support (reasoning, store)
- ⚠️ Slightly more complex setup

## Migration Path

1. **Test Both Patterns**: Run the comparison script
2. **Complete V2 Implementation**: Finish `lib/content-warning-agent-v2.ts`
3. **Side-by-Side Testing**: Run both in production (feature flag)
4. **Monitor Results**: Compare performance and reliability
5. **Full Migration**: Switch to new pattern if it proves better

## Current Status

- ✅ Comparison script created: `scripts/compare-agent-patterns.ts`
- ✅ V2 skeleton created: `lib/content-warning-agent-v2.ts`
- ⏳ V2 needs completion (web search tool, full instructions)
- ⏳ Testing needed

## Next Steps

1. Complete the V2 implementation with full functionality
2. Run comparison tests on multiple books
3. Analyze results and decide on migration
4. If migrating, update production code gradually

