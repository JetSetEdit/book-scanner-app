# API Response Test Results

## Test Date
Tested the multi-model analysis API response for "Gone Girl" (ISBN: 9780307588371)

## Key Findings

### ✅ Severity Logic is Working
- **Kidnapping was detected** as `violence.kidnapping_confinement` with severity **"moderate"** (NOT "mild")
- This confirms the severity floor logic is working correctly - severe topics are not being labeled as "mild"

### ⚠️ Verification Step is Too Aggressive
- **Raw OpenAI warnings**: 5 warnings detected
- **After verification**: Only 1 warning kept, 4 dropped
- **Kidnapping warning was dropped** during verification for "no_evidence"
- The verification step is being too strict and removing valid warnings

**Raw Warnings (Before Verification)**:
1. `emotional_abuse_or_toxic_relationships.gaslighting` - [severe] ✅ Kept
2. `emotional_abuse_or_toxic_relationships.manipulation` - [severe] ✅ Kept  
3. `violence.kidnapping_confinement` - [moderate] ❌ **DROPPED** (no_evidence)
4. `violence.domestic_violence` - [moderate] ❌ Dropped
5. `death_or_grief.character_death` - [moderate] ❌ Dropped

**Final Warnings (After Verification)**:
1. `emotional_abuse_or_toxic_relationships.manipulation` - [severe] ✅

### 🐛 Gemini API Error
- **Error**: `models/gemini-1.5-flash is not found for API version v1beta`
- **Status**: Gemini analysis is failing, falling back to OpenAI only
- **Impact**: No Gemini warnings, reducing agreement score
- **Action Needed**: Check correct Gemini model name or API version

### ✅ Description Quality
- No obvious verbatim quotes detected
- Descriptions are clinical/advisory (e.g., "Depictions of gaslighting" not "Amy wrote in her diary...")
- No duplicate descriptions found

## API Response Structure

```json
{
  "warnings": [...],
  "analysis": {
    "agreement_score": 0.0,
    "unique_to_openai": [...],
    "unique_to_gemini": [],
    "verification_metrics": {
      "unique_before": 5,
      "kept": 1,
      "dropped": 4,
      "dropped_reasons": {
        "no_evidence": 2,
        "misclassified": 0,
        "duplicate": 0,
        "other": 0
      },
      "adjusted": 0
    }
  },
  "model_results": {
    "openai": [...],
    "gemini": []
  }
}
```

## Recommendations

1. **Review Verification Logic**: The verification step is dropping valid warnings. Consider:
   - Lowering the evidence threshold
   - Being less strict for warnings that both models agree on
   - Reviewing why "kidnapping" was dropped when it has evidence

2. **Fix Gemini API**: 
   - Check Google AI documentation for correct model name
   - May need to use `gemini-1.5-flash-latest` or different API version
   - Or update to use v1 API instead of v1beta

3. **Monitor Severity**: 
   - ✅ Confirmed: Kidnapping is "moderate" not "mild" (severity floor working)
   - Consider: Should kidnapping be "severe" when on-page? Current logic keeps it at "moderate" unless other signals push it higher

## Test Command

```bash
npx tsx --env-file=.env.local scripts/test-api-response.ts
```


