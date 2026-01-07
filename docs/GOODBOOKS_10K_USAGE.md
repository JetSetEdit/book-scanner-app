# Using goodbooks-10k Dataset

## License: CC BY-SA 4.0 ✅

The **goodbooks-10k (original)** dataset is distributed under **CC BY-SA 4.0** and is safe to use for commercial purposes.

## License Requirements

When using this dataset, you must:

1. **Provide Attribution**
   - Credit the dataset creator: Zygmunt Zając
   - Link to the original dataset: https://www.kaggle.com/zygmunt/goodbooks-10k
   - Include license notice: "CC BY-SA 4.0"

2. **Share Derivatives Under Same License**
   - If you create derivative datasets, they must be shared under CC BY-SA 4.0
   - This applies to datasets, not to your application/service itself
   - Your application code and service are NOT required to be CC BY-SA 4.0

## What's in the Dataset

- **10,000 books** with metadata
- **Ratings data** (user ratings for books)
- **Basic metadata**: title, author, ISBN, etc.
- **NO descriptions** (descriptions would come from Goodreads, which is risky)

## Safe Use Cases

✅ **Approved Uses**:
- Book metadata (titles, authors, ISBNs)
- Ratings data for recommendations
- Book discovery features
- Training examples (with attribution)
- Populating book database with metadata

❌ **Not Included**:
- Book descriptions (not in original dataset)
- Reviews (not in original dataset)

## Implementation

### Attribution Example

If we use this dataset, we should include attribution like:

```
Book metadata sourced from goodbooks-10k dataset by Zygmunt Zając
(https://www.kaggle.com/zygmunt/goodbooks-10k), licensed under CC BY-SA 4.0
```

### Where to Add Attribution

- README.md
- About page (if we have one)
- Dataset documentation
- Any exported data files

## Downloading the Dataset

**Kaggle**: https://www.kaggle.com/zygmunt/goodbooks-10k
**GitHub**: https://github.com/zygmuntz/goodbooks-10k

## Integration Plan

### Step 1: Download & Explore

```bash
# Download from Kaggle
# Extract books.csv to: data/datasets/goodbooks-10k/books.csv

# Explore the dataset
tsx scripts/explore-goodbooks-dataset.ts
```

### Step 2: Test Calibration

```bash
# Test enrichment process (combines metadata with API descriptions)
tsx scripts/test-goodbooks-calibration.ts
```

This will:
- Load goodbooks-10k metadata
- **Stratify sample** by rating/author diversity
- Fetch descriptions from Google Books/Open Library APIs
- **Assess description quality** (good/too_short/too_vague/marketing_ish/unusable)
- **Track API source** (googlebooks vs openlibrary) for comparison
- Create training example format with quality flags
- Show success rate, quality breakdown, and source comparison

### Step 3: Review & Tune

1. **Manual Review**: Review `data/datasets/goodbooks-10k/calibration-test/enrichment_results.json`
   - Label each as: "good blurb" / "too vague" / "unusable"
   - Note patterns in low-quality descriptions
   - Update quality filters based on findings

2. **Test with Analysis**: Run enriched examples through multi-model analysis
   ```bash
   tsx scripts/test-enriched-with-analysis.ts [limit]
   ```
   - Tests full pipeline: metadata → enrichment → analysis → warnings
   - Shows warnings distribution across genres/ratings
   - Compares source quality (Google Books vs Open Library)

3. **Refine Filters**: Based on manual review and analysis results
   - Adjust minimum description length
   - Refine marketing language detection
   - Update quality assessment heuristics

4. **Add to Training**: Once quality is validated
   - Add good examples to `training-examples.ts`
   - Include attribution (CC BY-SA 4.0)
   - Document source and quality metrics

### Step 4: Integration

1. **Download** the dataset
2. **Review** the structure and fields
3. **Test calibration** (see Step 2)
4. **Enrich** with API descriptions
5. **Generate warnings** via AI analysis
6. **Add to training examples** (with attribution)
7. **Document** in DATA_SOURCING_POLICY.md

## Notes

- The original dataset does NOT include descriptions, so there's no ToS risk
- We can use the metadata safely
- If we create training examples from this data, we need to attribute it
- Our application/service code remains proprietary (CC BY-SA only applies to datasets)

## References

- [CC BY-SA 4.0 License](https://creativecommons.org/licenses/by-sa/4.0/)
- [Dataset on Kaggle](https://www.kaggle.com/zygmunt/goodbooks-10k)
- [Dataset on GitHub](https://github.com/zygmuntz/goodbooks-10k)

