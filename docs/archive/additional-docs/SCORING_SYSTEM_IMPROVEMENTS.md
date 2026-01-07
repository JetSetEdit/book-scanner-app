# Scoring System Improvements

## Issues Identified

### 1. The "Cliff Problem" ✅ FIXED
**Problem:** Hard discontinuity between 0.80 (moderate → 50pts) and 0.81 (severe → 100pts) causes 50-point swing for 0.01 difference.

**Fix:** Linear mapping - `PrimaryScore = HighestWarningScore * 100`
- 0.80 → 80 points
- 0.81 → 81 points
- Smooth, continuous transition

### 2. The "One Bad Apple" ✅ FIXED
**Problem:** One severe warning forces 100 points, making weighted sum irrelevant. Book with 1 sentence of violence = book with 500 pages of violence.

**Fix:** Outlier detection + volume consideration
- Detect if one warning is >30% higher than others
- If outlier, use weighted average of top 2 warnings
- Logarithmic curve for multiple warnings (diminishing returns)

### 3. The "Ceiling Effect" ✅ FIXED
**Problem:** Hitting 1.0 cap too quickly. Can't distinguish "Standard Severe" from "Extreme Severe".

**Fix:** 
- Use actual numeric scores (0.0-1.0) instead of discrete buckets
- Allow scores to reflect detail level and presence
- Logarithmic normalization prevents hard caps

### 4. Normalization Ambiguity ✅ FIXED
**Problem:** Hard clamp at 50 loses distinction between "heavy" and "unbearably heavy".

**Fix:** Logarithmic curve `log(1 + x) / log(1 + max) * 50`
- Allows growth but with diminishing returns
- Soft cap instead of hard wall
- Distinguishes between 10 and 50 warnings

### 5. Category Weight Bias ✅ ADDRESSED
**Problem:** Hard-coded moral judgments (sexual_content = 1.5x, violence = 1.2x).

**Fix:** 
- Made weights configurable via `categoryWeights` parameter
- Default weights can be overridden
- Future: User-adjustable preferences

## Implementation

See `lib/utils/severity-scoring-v2.ts` for the improved implementation.

### Key Changes:

```typescript
// OLD: Hard buckets
if (summary.severe > 0) primaryScore = 100
else if (summary.moderate > 0) primaryScore = 50

// NEW: Linear mapping
const maxScore = Math.max(...warningScores.map(ws => ws.score))
const primaryScore = maxScore * 100  // Smooth!

// OLD: Hard clamp
const normalizedWeightedSum = Math.min(weightedSum * 2, 50)

// NEW: Logarithmic curve
const logNormalized = Math.log(1 + weightedSum) / Math.log(1 + maxPossibleSum) * 50
```

## Migration Path

1. **Phase 1:** Keep both systems, use v2 for new features
2. **Phase 2:** A/B test both systems
3. **Phase 3:** Migrate to v2 if metrics show improvement
4. **Phase 4:** Remove old system

## Example Comparisons

### Example 1: The Cliff
**Book A:** Warning at 0.80 (moderate)
- OLD: 50 points → "moderate"
- NEW: 80 points → "moderate" (but closer to severe threshold)

**Book B:** Warning at 0.81 (severe)  
- OLD: 100 points → "severe" (50 point jump!)
- NEW: 81 points → "moderate" (smooth transition)

### Example 2: One Bad Apple
**Book A:** 1 severe warning (0.90), 5 mild warnings (0.45 each)
- OLD: 100 points (dominated by severe)
- NEW: ~90 points (outlier detection may reduce impact)

**Book B:** 10 severe warnings (0.90 each)
- OLD: 100 points (same as Book A!)
- NEW: ~120 points (logarithmic growth shows volume)

### Example 3: The Ceiling
**Book A:** Graphic sexual violence (0.85 base + 0.2 graphic = 1.0)
- OLD: Capped at 1.0
- NEW: Can reflect additional context (presence, frequency)

**Book B:** Extreme case (graphic + on-page + repeated + children)
- OLD: Still 1.0 (can't distinguish)
- NEW: Higher effective score through context adjustments



