# Agent Pattern Decision Summary

## Quick Reference

**Production (User-Facing)**: Use `lib/content-warning-agent.ts` (old `run()` API)
- ✅ 22-39% faster
- ✅ More consistent
- ✅ Proven reliability

**Debugging/Staging**: Use `lib/content-warning-agent-v2.ts` (new `Runner + withTrace()` API)
- ✅ Better observability
- ✅ Detailed traces
- ⚠️ 22-39% slower

## Files

- `lib/content-warning-agent.ts` - **Production default** (old pattern)
- `lib/content-warning-agent-v2.ts` - **Debugging/staging** (new pattern)
- `docs/AGENT_PATTERN_STRATEGY.md` - Full strategy document
- `docs/SPEED_COMPARISON.md` - Detailed speed analysis
- `scripts/compare-agent-patterns.ts` - Comparison testing tool
- `scripts/analyze-warning-quality.ts` - Quality analysis tool

## Testing

```bash
# Compare both patterns
npx tsx scripts/compare-agent-patterns.ts [ISBN]

# Test quality
npx tsx scripts/analyze-warning-quality.ts

# Test BookTok titles
npx tsx scripts/test-booktok-titles.ts
```

## Decision Rationale

See `docs/AGENT_PATTERN_STRATEGY.md` for full analysis.

**TL;DR**: Speed matters for UX. Old pattern is faster and more consistent. New pattern is valuable for debugging but not worth the speed trade-off for production users.

