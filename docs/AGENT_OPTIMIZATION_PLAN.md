# Agent Optimization Plan

**Date:** January 3, 2026  
**Test Book:** "Book Lovers" by Emily Henry (ISBN: 9780593440872)

---

## Test Results Summary

### Current Performance

| Configuration | Time | Warnings | Status | Issues |
|--------------|------|----------|--------|--------|
| Current System | 4.12s | 0 | ✅ Success | Fast, reliable |
| Old Agent | 18.82s | 0 | ✅ Success | Slow, but works |
| New Agent | 36.58s | 0 | ⚠️ Rate Limit | Too many tokens |
| Hybrid Agent | 36.96s | 0 | ⚠️ Rate Limit | Too many tokens |

### Key Issues Identified

1. **Description Not Being Passed**: Test shows 0 chars description length
   - Need to verify `fetchCandidatesByISBN` returns description
   - May need to fetch description separately if missing

2. **Rate Limits**: New and Hybrid agents hit token limits
   - Agents use too many tokens with web searches
   - Need to optimize prompts and reduce token usage

3. **Web Search Efficiency**: Old agent did 2 web searches (4.2s + 5.1s)
   - Could be optimized to single search
   - Need to limit number of searches

---

## Optimizations Applied

### 1. Improved Missing Description Handling ✅

**Changes:**
- Added explicit instructions when description is missing
- Made web search mandatory when no description provided
- Added search strategy guidance (ISBN → Title+Author → Content warnings)

**Code:**
```typescript
${!workflow.book_description || workflow.book_description.length === 0 ? 
  '**MANDATORY FIRST STEP**: Since no description was provided, you MUST use web search to find the book information before proceeding with analysis.' 
  : ...
}
```

### 2. Enhanced Web Search Tool Description ✅

**Changes:**
- Clarified when to use web search (missing/insufficient description)
- Added search strategy guidance in tool description
- Emphasized ISBN-first approach

### 3. Better Error Messages ✅

**Changes:**
- Added timeout handling (60s max)
- Improved error messages for rate limits
- Better handling when submit tool not called

---

## Next Steps for Testing

### Phase 1: Verify Description Fetching

1. **Check if description is actually being fetched:**
   ```bash
   # Test the book API directly
   npx tsx -e "
   import { fetchCandidatesByISBN } from './lib/book-api.ts';
   const candidates = await fetchCandidatesByISBN('9780593440872');
   console.log('Description length:', candidates[0]?.description?.length || 0);
   console.log('Description preview:', candidates[0]?.description?.substring(0, 200));
   "
   ```

2. **If description is missing:**
   - Check Google Books API response
   - May need to fetch from different source
   - Consider using `fetchBookByISBN` instead of `fetchCandidatesByISBN`

### Phase 2: Optimize Token Usage

1. **Reduce prompt size:**
   - Shorten instruction text
   - Remove redundant examples
   - Focus on essential instructions only

2. **Limit web searches:**
   - Add search counter (max 2-3 searches)
   - Prioritize ISBN search (most efficient)
   - Cache search results

3. **Optimize web search results:**
   - Truncate long descriptions from search results
   - Focus on relevant information only
   - Remove redundant data

### Phase 3: Test Optimized Agents

1. **Re-run test with optimizations:**
   ```bash
   npx tsx scripts/test-all-agent-configs.ts
   ```

2. **Compare results:**
   - Time improvements
   - Token usage reduction
   - Warning accuracy
   - Rate limit avoidance

---

## Expected Improvements

### Token Usage Reduction

**Current:**
- Old Agent: ~30-40k tokens (hits rate limits)
- New Agent: ~30-40k tokens (hits rate limits)

**Target:**
- Optimized: <20k tokens per run
- Should avoid rate limits with 30k TPM limit

### Speed Improvements

**Current:**
- Old Agent: 18.82s
- New/Hybrid: 36-37s (with rate limit errors)

**Target:**
- Optimized: <25s for all agents
- Reduce web search calls
- Optimize parallel processing

### Accuracy Improvements

**Current:**
- All agents return 0 warnings (may be correct for "Book Lovers")
- Need to verify if warnings should exist

**Target:**
- Accurate warnings when description is available
- Proper handling when description is missing
- Better web search results utilization

---

## Testing Checklist

- [ ] Verify description is being fetched from book API
- [ ] Test with description present
- [ ] Test with description missing (triggers web search)
- [ ] Measure token usage for each agent
- [ ] Verify rate limits are avoided
- [ ] Compare warning accuracy across agents
- [ ] Test timeout handling (60s limit)
- [ ] Verify submit tool is always called

---

## Recommendations

### For Production Use

1. **Use Current System** (`multi-model-analysis.ts`):
   - Fastest (4-5s)
   - Most reliable
   - No rate limit issues
   - Best for production

2. **Use Old Agent** for:
   - Books with missing descriptions
   - When web search is needed
   - Comprehensive coverage priority

3. **Use Hybrid Agent** (once optimized):
   - Best of both worlds
   - Evidence-first with inference fallback
   - Clear confidence levels

### For Further Optimization

1. **Add description caching:**
   - Cache descriptions from web searches
   - Avoid redundant searches

2. **Implement search limits:**
   - Max 2-3 web searches per run
   - Prioritize most efficient searches

3. **Optimize prompt size:**
   - Remove redundant instructions
   - Focus on essential guidance
   - Use shorter examples

4. **Add retry logic:**
   - Handle rate limits gracefully
   - Retry with backoff
   - Fallback to simpler approach

---

## Conclusion

The agents need optimization to:
1. ✅ Handle missing descriptions better (DONE)
2. ⏳ Reduce token usage (IN PROGRESS)
3. ⏳ Avoid rate limits (IN PROGRESS)
4. ⏳ Improve speed (IN PROGRESS)

The current system remains the best choice for production, but optimized agents could be useful for edge cases (missing descriptions, web search needed).


