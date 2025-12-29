# Token Cost Analysis

## Overview
This document estimates the token costs for content warning generation using different models.

## Pricing (as of Dec 2024)

### GPT-4o
- **Input**: $2.50 per 1M tokens
- **Output**: $10.00 per 1M tokens

### Gemini 2.5 Flash
- **Free Tier**: 60 requests/minute, 1,500 requests/day
- **Paid**: $0.075 per 1M input tokens, $0.30 per 1M output tokens (after free tier)

## Token Usage Estimation

### GPT-4o (Single Model)

**Input Tokens:**
- System instructions: ~2,000 tokens (taxonomy, instructions)
- Book metadata: ~500-1,500 tokens (title, author, description)
- Web search results: ~2,000-5,000 tokens (if web search is used)
- **Total Input**: ~4,500-8,500 tokens per scan

**Output Tokens:**
- Content warnings JSON: ~500-2,000 tokens (depends on number of warnings)
- Reasoning: ~200-500 tokens
- **Total Output**: ~700-2,500 tokens per scan

**Cost per Scan:**
- Input: (6,500 / 1,000,000) × $2.50 = **$0.016**
- Output: (1,500 / 1,000,000) × $10.00 = **$0.015**
- **Total: ~$0.031 per scan**

### Gemini 2.5 Flash (Single Model)

**Input Tokens:**
- Instructions: ~2,000 tokens
- Book metadata: ~500-1,500 tokens
- **Total Input**: ~2,500-3,500 tokens per scan

**Output Tokens:**
- Content warnings JSON: ~500-2,000 tokens
- Reasoning: ~200-500 tokens
- **Total Output**: ~700-2,500 tokens per scan

**Cost per Scan (if paid):**
- Input: (3,000 / 1,000,000) × $0.075 = **$0.0002**
- Output: (1,500 / 1,000,000) × $0.30 = **$0.0005**
- **Total: ~$0.0007 per scan** (or FREE if within free tier)

### Multi-Model (GPT-4o + Gemini)

**Cost per Scan:**
- GPT-4o: $0.031
- Gemini: $0.0007 (or FREE)
- **Total: ~$0.032 per scan** (or $0.031 if Gemini is free)

## Cost Comparison

| Model | Cost per Scan | Monthly (1000 scans) | Notes |
|-------|---------------|---------------------|-------|
| GPT-4o only | $0.031 | $31 | Current production |
| Gemini only | $0.0007 | $0.70 | Free tier: 1,500/day |
| Multi-model | $0.032 | $32 | Best coverage |

## Free Tier Limits

### Gemini Free Tier
- **60 requests/minute**
- **1,500 requests/day**
- After limits: Pay-per-use pricing applies

**Daily Capacity:**
- Single model (Gemini): 1,500 scans/day = FREE
- Multi-model: 1,500 scans/day = $0.031 × 1,500 = $46.50/day (if Gemini free tier exceeded)

## Recommendations

### For Development/Testing
- Use Gemini free tier for testing (1,500 scans/day)
- Use GPT-4o for production-critical scans

### For Production
1. **Option 1: Single Model (GPT-4o)**
   - Cost: $0.031/scan
   - Reliable, proven quality
   - Current production setup

2. **Option 2: Multi-Model (GPT-4o + Gemini)**
   - Cost: $0.032/scan (if Gemini free tier available)
   - Better coverage, catches more warnings
   - 2x the API calls

3. **Option 3: Hybrid Approach**
   - Use GPT-4o for most scans
   - Use multi-model for books with thin metadata or user-requested deep analysis
   - Cost: ~$0.031-0.032/scan average

## Token Usage Breakdown (Example: "Ugly Love")

### GPT-4o
- **Input**: ~6,500 tokens
  - Instructions: 2,000
  - Book metadata: 1,200
  - Web search results: 3,300
- **Output**: ~1,800 tokens
  - Warnings JSON: 1,200
  - Reasoning: 600
- **Cost**: $0.016 + $0.018 = **$0.034**

### Gemini
- **Input**: ~3,200 tokens
  - Instructions: 2,000
  - Book metadata: 1,200
- **Output**: ~2,100 tokens
  - Warnings JSON: 1,500
  - Reasoning: 600
- **Cost**: $0.0002 + $0.0006 = **$0.0008** (or FREE)

### Multi-Model Total
- **Cost**: $0.034 + $0.0008 = **$0.035** (or $0.034 if Gemini free)

## Optimization Tips

1. **Cache Results**: Don't regenerate warnings for existing books
2. **Use Free Tier**: Leverage Gemini free tier when possible
3. **Selective Multi-Model**: Only use multi-model when needed (thin metadata, user request)
4. **Batch Processing**: Process multiple books in parallel to maximize throughput

## Monthly Cost Estimates

### Scenario 1: 1,000 scans/month
- GPT-4o only: $31/month
- Gemini only: FREE (within free tier)
- Multi-model: $32/month (or $31 if Gemini free)

### Scenario 2: 10,000 scans/month
- GPT-4o only: $310/month
- Gemini only: $7/month (after free tier: 1,500/day = 45,000/month free)
- Multi-model: $320/month (or $310 if Gemini free tier covers it)

### Scenario 3: 50,000 scans/month
- GPT-4o only: $1,550/month
- Gemini only: $35/month (after free tier)
- Multi-model: $1,585/month

## Conclusion

Multi-model analysis adds minimal cost (~$0.001 per scan) but provides:
- Better coverage (catches warnings one model might miss)
- Higher confidence (agreement between models)
- Transparency (shows what each model found)

**Recommendation**: Use multi-model for production if:
- You want maximum coverage
- Cost increase is acceptable (~3% more expensive)
- You can leverage Gemini free tier (1,500 scans/day)

