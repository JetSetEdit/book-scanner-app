# Iterative Refinement Process

## Overview

This document outlines the process for iteratively improving dataset conversion quality using the 30-example gold set.

## Gold Set

**Location**: `data/datasets/real-dataset-test/conversions.json`
**Size**: 30 examples (20 toxic, 10 non-toxic)
**Purpose**: Fixed test set to measure improvement after each refinement

## Process

### 1. Make Refinements

Edit pattern mapping in `lib/utils/pattern-mapping.ts`:
- Add new patterns
- Adjust severity mappings
- Improve keyword detection
- Add fallback logic

### 2. Re-run Test

```bash
npx tsx scripts/test-real-dataset.ts
```

### 3. Compare Results

Check key metrics:
- **Examples with Issues**: Should decrease
- **Avg Warnings per Toxic**: Should be ~1.0-1.5
- **Category Distribution**: Should be balanced
- **Specific Examples**: Check that known edge cases (e.g., Epstein) are handled

### 4. Review Sample Conversions

Look at first 5 toxic examples:
- Are they correctly categorized?
- Is severity appropriate?
- Are descriptions book-like?

### 5. Update Keep/Toss/Tune Status

For each example, determine:
- **KEEP**: Correctly mapped, ready to use
- **TUNE**: Pattern exists but needs adjustment
- **TOSS**: Too context-specific, doesn't generalize

### 6. Set Quality Threshold

**Target**: 80-90% of reviewed examples should be KEEP or TUNE (not TOSS)

Once reached:
- Promote KEEP examples to `training-examples.ts`
- Document TUNE examples for future refinement
- Document TOSS examples to avoid similar patterns

## Current Status

### Pattern Matching Improvements

✅ **Working**:
- Sexual abuse detection (Epstein example → `sexual_content.sexual_violence`)
- Threat detection
- Profanity detection

⚠️ **Needs Work**:
- Some toxic examples still produce 0 warnings
- Need better fallback for edge cases
- More patterns needed (insults, dehumanization)

### Metrics to Track

1. **Issue Rate**: Examples with issues / Total examples
   - Target: < 10%

2. **Coverage**: Examples with warnings / Toxic examples
   - Target: 100% (all toxic should have at least 1 warning)

3. **Category Balance**: Distribution across categories
   - Target: Not dominated by single category

4. **Severity Distribution**: mild / moderate / severe
   - Target: Appropriate distribution based on content

## Example Refinement Cycle

### Cycle 1: Initial Pattern Mapping
- Added basic patterns
- Result: Epstein example correctly mapped ✅
- Issue: Some examples produce 0 warnings ❌

### Cycle 2: Improved Fallbacks
- Added insult patterns
- Added better fallback logic
- Expected: Fewer 0-warning examples

### Cycle 3: (Future)
- Add more specific patterns based on findings
- Refine severity heuristics
- Add context awareness

## Quality Checklist

Before promoting examples to `training-examples.ts`:

- [ ] Example correctly categorized
- [ ] Severity appropriate for content
- [ ] Description feels like a book, not social media
- [ ] Pattern is generalizable (not too context-specific)
- [ ] Matches Publications Guidelines methodology
- [ ] Would be useful as training example

## Next Steps

1. **Current**: Fix 0-warning issue for toxic examples
2. **Next**: Add more pattern categories (discrimination, abuse)
3. **Then**: Refine severity heuristics
4. **Finally**: Test with larger sample (100-200 examples)


