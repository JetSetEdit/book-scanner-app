# Testing Guide - Agent Pattern Strategy

## Quick Test Checklist

### ✅ What to Test

1. **Basic Book Scan**
   - Go to `/scan` page
   - Enter ISBN: `9781501110375` (It Ends With Us - Colleen Hoover)
   - Verify it finds the book
   - Check warnings are generated
   - Note the speed (should be ~10-15s)

2. **Popular BookTok Books** (Good test cases)
   - `9781501110375` - It Ends With Us (Colleen Hoover)
   - `9781501139239` - The Seven Husbands of Evelyn Hugo (Taylor Jenkins Reid)
   - `9780593440872` - Book Lovers (Emily Henry)

3. **Verify Warnings Quality**
   - Check that warnings have:
     - ✅ Subcategories (e.g., `emotional_abuse.emotional_abuse`)
     - ✅ Descriptions
     - ✅ Reasoning
     - ✅ Severity levels

4. **Check Performance**
   - Scan should complete in ~10-15 seconds
   - Should feel responsive (not sluggish)
   - Progress updates should appear

### 🔍 What to Look For

**Good Signs:**
- ✅ Fast scan times (~10-15s)
- ✅ Warnings found for books that should have them
- ✅ Quality warnings with subcategories
- ✅ No errors in console
- ✅ Smooth user experience

**Potential Issues:**
- ⚠️ Slow scans (>20s) - might indicate rate limiting
- ⚠️ No warnings for books that should have them
- ⚠️ Errors in browser console
- ⚠️ Timeout errors

### 📊 Current Configuration

- **Production**: Uses `multi-model-analysis.ts` (fast, reliable)
- **Agent Pattern**: Old pattern (`run()` API) is default if agents are used
- **Branch**: `feature/agent-pattern-strategy`

### 🧪 Testing Commands

If you want to test the agent patterns directly:

```bash
# Compare both patterns
npx tsx scripts/compare-agent-patterns.ts 9781501110375

# Test quality
npx tsx scripts/analyze-warning-quality.ts

# Test BookTok titles
npx tsx scripts/test-booktok-titles.ts
```

### 🐛 Debugging

If something doesn't work:
1. Check browser console for errors
2. Check server logs (if running locally)
3. Verify environment variables are set
4. Check network tab for API call failures

---

## Expected Behavior

The app should:
- ✅ Use the fast, reliable production path
- ✅ Generate quality warnings
- ✅ Complete scans in reasonable time
- ✅ Handle errors gracefully

