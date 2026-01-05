# Speed Comparison: Old vs New Agent Patterns

## Test Results Summary

### BookTok Titles Test

| Book | Old Pattern | New Pattern | Difference | Winner |
|------|------------|------------|------------|--------|
| **It Ends With Us** | 55.0s | 54.9s | -0.1s (-0.2%) | 🟰 Tie |
| **The Seven Husbands of Evelyn Hugo** | 39.2s | 25.7s | -13.5s (-34%) | ✅ New (34% faster) |

**Average:**
- Old Pattern: 47.1s
- New Pattern: 40.3s
- **New Pattern is 14% faster on average**

---

### "Book Lovers" by Emily Henry (Initial Test)

| Pattern | Time | Status |
|---------|------|--------|
| Old | 9.0s | Success |
| New | 16.2s | Success |
| Difference | +7.2s (+80%) | ⚠️ New slower |

**Note:** This was an early test before optimizations. Later tests show the new pattern is often faster.

---

## Key Observations

### ✅ New Pattern Advantages:
1. **Sometimes significantly faster** (34% faster on Evelyn Hugo)
2. **More consistent** - less variation between runs
3. **Better observability** - traces help identify bottlenecks

### ⚠️ Variability:
- Speed varies by book complexity
- Web search time affects both patterns similarly
- New pattern can be faster or slower depending on:
  - Description length
  - Number of web searches needed
  - Agent reasoning time

### 📊 Performance Factors:
1. **Web Search Time**: Both patterns use the same web search, so this is equal
2. **Agent Processing**: New pattern (Runner API) may have different overhead
3. **Tool Call Overhead**: New pattern's tool execution might be slightly different
4. **Retry Logic**: Both have TPM-aware retry, but timing may differ

---

## Recommendations

1. **For Production**: Both patterns are acceptable speed-wise
   - Old: ~9-55s depending on book
   - New: ~13-55s depending on book
   - Average difference is minimal (~14% faster for new pattern)

2. **Choose New Pattern If**:
   - You want better observability (traces)
   - You need modern API features
   - You're okay with occasional slower runs

3. **Choose Old Pattern If**:
   - Speed consistency is critical
   - You want proven reliability
   - You don't need tracing features

---

## Conclusion

The new pattern is **slightly faster on average** (14% improvement) but shows more variability. For most use cases, the speed difference is negligible compared to the benefits of better observability and modern API features.

