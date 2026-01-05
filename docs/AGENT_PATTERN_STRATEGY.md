# Agent Pattern Strategy

## Executive Summary

After comprehensive testing comparing the old `run()` pattern vs new `Runner + withTrace()` pattern, we've determined:

- **Old Pattern**: Faster (22-39% on average), more consistent, proven reliability
- **New Pattern**: Better observability, modern API, but slower and more variable

**Decision**: Keep old pattern as **production default** for all user-facing flows. Use new pattern for debugging, staging, and internal tooling.

---

## Performance Analysis

### Speed Comparison

| Test | Old Pattern | New Pattern | Difference |
|------|------------|------------|------------|
| BookTok Average | 13.9s | 17.0s | +22% slower |
| "Book Lovers" | 10.3s | 14.4s | +39% slower |
| Best Case | 13.2s | 15.1s | +14% slower |
| Worst Case | 13.2s | 18.9s | +43% slower |

### Quality Comparison

| Metric | Old Pattern | New Pattern |
|--------|------------|------------|
| Subcategory Usage | 100% | 100% |
| Source URLs | 100% | 100% |
| Reasoning Detail | 127-178 chars | 167-246 chars (longer) |
| Description Detail | 85-154 chars | 49-85 chars (shorter) |
| Overall Quality | 87.9-107.5 | 92.0-96.5 |

**Quality Verdict**: Both patterns produce high-quality warnings. New pattern has more detailed reasoning but shorter descriptions.

---

## Why 22-39% Slower Matters

For Subtext's value proposition of **fast, lightweight "check before you read"**:

- **User Experience**: Adding 4-5s to a 10-15s flow is very noticeable
- **User Trust**: Variability (sometimes +4%, sometimes +43%) creates "randomly slow" experiences that erode trust more than a stable baseline
- **Core Value**: Speed is a competitive advantage; regression is not trivial

---

## Strategic Approach

### Production (Default)
- **Use**: Old pattern (`run()` API)
- **Why**: Fastest, most consistent, proven reliability
- **For**: All user-facing book scans

### Staging/Debugging
- **Use**: New pattern (`Runner + withTrace()`)
- **Why**: Better observability, traces for debugging
- **For**: 
  - Staging environments
  - Preview deployments
  - Debug sessions
  - Internal tooling

### Feature Flag (Optional)
- **Use**: New pattern for small % of production traffic
- **Why**: Gather real-world performance data
- **For**: A/B testing, gradual rollout

---

## Implementation

### Current State
- ✅ Old pattern: `lib/content-warning-agent.ts` (production)
- ✅ New pattern: `lib/content-warning-agent-v2.ts` (available)
- ✅ Comparison tools: `scripts/compare-agent-patterns.ts`
- ✅ Quality analysis: `scripts/analyze-warning-quality.ts`

### Configuration

The old pattern is used by default in:
- `lib/services/scan-service.ts` → calls `findBookAndGenerateWarnings()`

To use new pattern, update the import:
```typescript
// Old (default)
import { findBookAndGenerateWarnings } from '../lib/content-warning-agent'

// New (for debugging)
import { findBookAndGenerateWarningsV2 } from '../lib/content-warning-agent-v2'
```

### Feature Flag (Future Enhancement)

Could add environment variable:
```typescript
const useNewPattern = process.env.USE_NEW_AGENT_PATTERN === 'true' || 
                      process.env.NODE_ENV === 'development'

const result = useNewPattern 
  ? await findBookAndGenerateWarningsV2(isbn, model, mode)
  : await findBookAndGenerateWarnings(isbn, model, mode)
```

---

## Optimizations for New Pattern (Future Work)

If we want to make the new pattern viable for production:

1. **Reduce trace granularity**: Only trace main run, not every internal step
2. **Minimize tool calls**: Collapse smaller tools, move non-critical work off critical path
3. **Parallelize aggressively**: Ensure all parallelizable work actually runs in parallel
4. **Background work**: Push post-processing (logging, enrichment) to background tasks

**Target**: Get within ~10% of old pattern speed before considering production use.

---

## When to Revisit

Revisit using new pattern as default if:

1. **Speed parity**: New pattern gets within ~10% of old pattern
2. **Mission-critical tracing**: We introduce flows where deep tracing is essential
3. **SDK deprecation**: OpenAI deprecates the old `run()` API
4. **New features**: Runner API provides features we need that aren't available in old API

---

## Testing & Monitoring

### Regular Testing
- Run `scripts/compare-agent-patterns.ts` periodically to track performance
- Run `scripts/analyze-warning-quality.ts` to ensure quality doesn't degrade
- Test with new BookTok titles: `scripts/test-booktok-titles.ts`

### Metrics to Track
- Average execution time (both patterns)
- P95/P99 latency (both patterns)
- Warning quality scores
- User-facing latency (production only uses old pattern)

---

## Conclusion

**Current Strategy**: 
- ✅ Old pattern = Production default (fast, reliable)
- ✅ New pattern = Debugging/staging tool (observable, modern)

**Future Strategy**:
- Optimize new pattern to within 10% of old pattern
- Consider feature flag for gradual rollout
- Monitor for SDK changes that might change the equation

This gives us the best of both worlds: speed for users, observability for developers.

