# Multi-Model Implementation

## Overview

The multi-model service runs both **GPT-4o** and **Gemini 2.5 Flash** in parallel, then combines and analyzes their outputs to provide more comprehensive content warnings.

## How It Works

### 1. Parallel Execution
Both models analyze the same book simultaneously:
- **GPT-4o**: Uses existing hybrid instruction mode
- **Gemini 2.5 Flash**: Uses equivalent hybrid instructions

### 2. Warning Combination
- **Same Category**: If both models find the same category, scores are averaged
- **Unique Categories**: If only one model finds a category, it's included as-is
- **More Detailed**: Uses the longer/more detailed description when combining

### 3. Analysis
The system analyzes:
- **Agreement Score**: How much the models agree (0-100%)
- **Unique Findings**: What each model found that the other didn't
- **Severity Differences**: Where models disagree on severity scores
- **Reasoning Insights**: Summary of why models differ

## Why Models Differ

### GPT-4o Characteristics
- More conservative with severity scores
- Focuses on explicit evidence from descriptions
- Less likely to infer from genre/author patterns
- Typically finds fewer warnings but with higher confidence

### Gemini Characteristics
- More comprehensive in finding categories
- Higher severity scores (more cautious)
- More likely to infer from genre patterns
- Typically finds more warnings

### Example: "Ugly Love" by Colleen Hoover
- **GPT-4o**: Found 4 warnings (M rating)
  - Focused on explicit content: emotional abuse, mental health, sexual content, substance use
  - Moderate severity scores (0.40-0.70)
  
- **Gemini**: Found 5 warnings (MA15+ rating)
  - Added: death_or_grief, language
  - Higher severity scores (0.70-0.85)
  - More restrictive classification

## Usage

### API Endpoint
```typescript
POST /api/scan-multi-model
{
  "isbn": "9780349433883"
}
```

### Response Format
```typescript
{
  success: true,
  book: { ... },
  combined_warnings: [...], // Merged warnings from both models
  classification_rating: "M", // More restrictive of the two
  confidence: "high", // Lower of the two
  model_results: [
    {
      model: "gpt-4o",
      content_warnings: [...],
      timing: 21365
    },
    {
      model: "gemini-2.5-flash",
      content_warnings: [...],
      timing: 14396
    }
  ],
  analysis: {
    agreement_score: 0.6, // 60% agreement
    unique_to_gpt4o: ["substance_use_or_alcohol"],
    unique_to_gemini: ["death_or_grief", "language"],
    severity_differences: [
      {
        category: "sexual_content",
        gpt4o_score: 0.55,
        gemini_score: 0.85,
        difference: 0.30
      }
    ],
    reasoning_insights: "Moderate agreement (60%) - some differences..."
  }
}
```

### Test Script
```bash
npx tsx scripts/test-multi-model.ts <ISBN>
```

## Benefits

1. **Comprehensive Coverage**: Catches warnings one model might miss
2. **Balanced Severity**: Averages scores to avoid extremes
3. **Transparency**: Shows what each model found and why they differ
4. **Quality Assurance**: Agreement score indicates confidence

## Integration Options

### Option 1: Replace Single Model
Use multi-model as the default instead of single model.

### Option 2: User Choice
Add a toggle in the UI to choose:
- Single model (GPT-4o) - faster, cheaper
- Multi-model (GPT-4o + Gemini) - more comprehensive

### Option 3: Dev-Only
Keep multi-model as a dev/testing tool for quality assurance.

## Performance

- **GPT-4o**: ~20-25 seconds
- **Gemini**: ~14-22 seconds
- **Combined**: ~20-25 seconds (runs in parallel)

## Cost Considerations

- **GPT-4o**: ~$0.01-0.02 per scan
- **Gemini**: Free tier (60 req/min, 1500/day) or pay-per-use
- **Total**: ~2x cost of single model, but better coverage

## Next Steps

1. ✅ Multi-model service created
2. ✅ API endpoint created
3. ✅ Test script created
4. ⏳ Add UI toggle (optional)
5. ⏳ Integrate into main scan flow (optional)
6. ⏳ Add to dev comparison tool

