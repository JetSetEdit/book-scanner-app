# Calibration Enhancements

## Overview

Enhanced the goodbooks-10k calibration process with quality filters, source tracking, and genre stratification based on best practices.

## Key Enhancements

### 1. Description Quality Assessment ✅

**Added Quality Filters**:
- `good`: Length >= 200 chars, minimal marketing language
- `too_short`: < 100 chars
- `too_vague`: Generic phrases, little substance
- `marketing_ish`: Heavy promotional language
- `unusable`: Very short + promotional

**Implementation**: `assessDescriptionQuality()` function in `test-goodbooks-calibration.ts`

**Benefits**:
- Filters out low-quality descriptions before training
- Flags descriptions that need manual review
- Ensures only good blurbs are used for training

### 2. API Source Tracking ✅

**Tracks**:
- `description_source`: 'googlebooks' | 'openlibrary'
- `description_length`: Character count
- Source comparison statistics

**Benefits**:
- Compare quality between Google Books and Open Library
- Identify which source provides better descriptions
- Make informed decisions about source preference

### 3. Genre/Rating Stratification ✅

**Sampling Strategy**:
- High-rated books (4.0+): 3 samples
- Mid-rated books (3.0-4.0): 3 samples
- Diverse selection: 4 samples
- Total: 10 books for initial testing

**Benefits**:
- Tests across different book types
- Ensures calibration works for various genres
- Catches issues that might only appear in certain segments

### 4. Full Pipeline Testing ✅

**New Script**: `test-enriched-with-analysis.ts`

**Process**:
1. Load enriched books (from calibration test)
2. Run through multi-model analysis service
3. Generate warnings
4. Compare results across sources/genres

**Benefits**:
- Tests complete pipeline end-to-end
- Validates warnings distribution
- Identifies issues before full integration

## Workflow

### Phase 1: Exploration
```bash
tsx scripts/explore-goodbooks-dataset.ts
```
- Understand dataset structure
- See sample books
- Check metadata quality

### Phase 2: Calibration
```bash
tsx scripts/test-goodbooks-calibration.ts
```
- Enrich metadata with API descriptions
- Assess description quality
- Track source and quality metrics
- Generate enrichment_results.json

### Phase 3: Manual Review
1. Open `data/datasets/goodbooks-10k/calibration-test/enrichment_results.json`
2. Review each example
3. Label: "good blurb" / "too vague" / "unusable"
4. Note patterns in low-quality descriptions
5. Update quality filters based on findings

### Phase 4: Analysis Testing
```bash
tsx scripts/test-enriched-with-analysis.ts [limit]
```
- Run enriched examples through AI analysis
- Generate warnings
- Check distribution across genres/ratings
- Compare source quality

### Phase 5: Integration
- Add good examples to `training-examples.ts`
- Include attribution (CC BY-SA 4.0)
- Document source and quality

## Quality Metrics to Track

### Description Quality
- **Good**: Ready for training
- **Too Short**: < 100 chars
- **Too Vague**: Generic, lacks substance
- **Marketing-ish**: Heavy promotional language
- **Unusable**: Very short + promotional

### Source Comparison
- Google Books vs Open Library
- Average description length per source
- Quality distribution per source
- Success rate per source

### Analysis Results
- Warnings per book
- Classification distribution
- Category distribution
- Agreement scores

## Success Criteria

Before promoting to `training-examples.ts`:

- [ ] Description quality filters working (80%+ good quality)
- [ ] Source comparison shows clear preference
- [ ] Manual review confirms quality assessment
- [ ] Analysis generates plausible warnings
- [ ] Warnings distribution looks reasonable
- [ ] No obvious issues across genres/ratings

## Files

- `scripts/explore-goodbooks-dataset.ts` - Dataset exploration
- `scripts/test-goodbooks-calibration.ts` - Enrichment calibration
- `scripts/test-enriched-with-analysis.ts` - Full pipeline testing
- `docs/CALIBRATION_ENHANCEMENTS.md` - This file

## Next Steps

1. **Run Calibration**: Test with 50-100 books
2. **Manual Review**: Label quality for each
3. **Refine Filters**: Update based on review
4. **Test Analysis**: Run through multi-model service
5. **Validate**: Check warnings distribution
6. **Integrate**: Add to training examples


