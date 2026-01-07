# Data Sourcing Policy

## Overview

This document outlines our data sourcing policy to ensure legal compliance and avoid Terms of Service violations.

## Current Data Sources

### ✅ Safe Sources (Currently Used)

**Implementation**: `lib/book-api.ts`

1. **Google Books API** ✅
   - Public API with clear terms
   - Allows commercial use
   - No scraping required
   - Used for: Book metadata, descriptions, covers
   - Status: ✅ Safe for production
   - Source tracking: `source: 'googlebooks'` in database

2. **Open Library API** ✅
   - Open data, CC0/public domain
   - Explicitly allows reuse
   - No ToS restrictions
   - Used for: Book metadata, descriptions, covers
   - Status: ✅ Safe for production
   - Source tracking: `source: 'openlibrary'` in database

**No Goodreads Integration**: We do not currently use Goodreads data, which is compliant with this policy.

### ⚠️ Sources to Avoid

1. **Goodreads (Scraped Data)**
   - **ToS Prohibition**: Goodreads Terms of Service explicitly prohibit:
     - Data mining
     - Robots/crawlers
     - Large-scale data extraction
     - Redistribution of service content
   - **Risk Level**: ⚠️ High - Violates ToS
   - **Action**: Do not use scraped Goodreads data in production

2. **Goodreads Datasets (Community)**
   - Many community datasets were created via scraping
   - May not align with current Goodreads ToS
   - **Risk Level**: ⚠️ Medium-High
   - **Action**: Avoid for production use

## Dataset Licensing Guide

### ✅ Safe Datasets (CC-Licensed)

**goodbooks-10k (original)** ✅ APPROVED FOR USE
- License: **CC BY-SA 4.0** (Creative Commons Attribution-ShareAlike 4.0)
- Status: ✅ **Safe for commercial use**
- Requirements: 
  - Provide attribution to the dataset
  - Share derivative datasets under the same license (CC BY-SA 4.0)
- Source: https://www.kaggle.com/zygmunt/goodbooks-10k
- Alternative: https://github.com/zygmuntz/goodbooks-10k

**What's Included**:
- Book ratings (10,000 books)
- Basic metadata (title, author, ISBN, etc.)
- User ratings data
- **Note**: Does NOT include descriptions (those would be from Goodreads, which is risky)

**Use Cases**:
- ✅ Book metadata (titles, authors, ISBNs)
- ✅ Ratings data for recommendations
- ✅ Book discovery
- ✅ Training examples (with proper attribution)
- ❌ Descriptions (not included in original dataset anyway)

### ⚠️ Risky Datasets

**goodbooks-10k-extended**
- Contains scraped Goodreads descriptions
- Inherits ToS risk from Goodreads
- Status: ⚠️ Avoid for production
- Source: https://github.com/malcolmosh/goodbooks-10k-extended

**Other Goodreads-based datasets**
- Often created via scraping
- May violate current ToS
- Status: ⚠️ Avoid unless clearly CC-licensed metadata only

## Policy for Dataset Integration

### ✅ Safe Practices

1. **Use Open APIs**
   - Google Books API
   - Open Library API
   - Other public APIs with clear terms

2. **Use CC-Licensed Data**
   - CC BY-SA 4.0 datasets (with attribution)
   - CC0/public domain datasets
   - Clearly licensed metadata

3. **Publisher-Sourced Data**
   - Publisher-provided descriptions
   - Author-provided content
   - Official book metadata

### ❌ Avoid

1. **Scraped Content**
   - Any data scraped from services with restrictive ToS
   - Goodreads descriptions/reviews
   - Amazon product descriptions (if scraped)

2. **Unclear Licensing**
   - Datasets without clear licenses
   - "Use at your own risk" datasets
   - Datasets that advise checking ToS first

3. **ToS-Violating Sources**
   - Any source that explicitly prohibits data mining
   - Services that require API keys but don't allow bulk use

## Implementation Checklist

Before adding a new data source:

- [ ] Check source's Terms of Service
- [ ] Verify licensing (CC, public domain, etc.)
- [ ] Confirm no scraping required
- [ ] Document source and license
- [ ] Add to this policy document
- [ ] Get legal review for commercial use (if needed)

## Current Implementation Status

### ✅ Compliant Implementation

**Book Metadata Fetching** (`lib/book-api.ts`):
- ✅ Google Books API - Public API, ToS compliant
- ✅ Open Library API - Open data, CC0, ToS compliant
- ✅ Source tracking implemented (`source` field in database)
- ✅ No Goodreads integration
- ✅ No scraping of restricted services

**Data Storage**:
- We store book metadata from these APIs in our database
- Source is tracked for compliance
- No redistribution of API data (used only for our service)

### Dataset Integration (Current & Future)

**goodbooks-10k (CC BY-SA 4.0)** ✅ APPROVED
- Can be used for training examples
- Process: Combine metadata with API-fetched descriptions
- See `scripts/test-goodbooks-calibration.ts` for testing
- Attribution required (see GOODBOOKS_10K_USAGE.md)

**Moderation Datasets** (Testing)
- Surge AI Toxicity - Testing pattern mapping
- See `scripts/test-real-dataset.ts` for calibration

**General Process for Any Dataset**:

1. **Verify License**: Must be CC-licensed or public domain
2. **Check ToS Compliance**: No scraped content from restricted services
3. **Test Calibration**: Run dry-run tests before integration
4. **Document Source**: Include attribution and license info
5. **Legal Review**: For commercial use, get legal advice

## Recommendations

### For Production Use

**Stick to**:
- Google Books API (descriptions, metadata)
- Open Library API (descriptions, metadata)
- CC-licensed datasets (metadata only, not scraped descriptions)
- Publisher/author-provided content

**Avoid**:
- Scraped Goodreads data
- Goodreads-based datasets with descriptions
- Any dataset that requires ToS review

### For Training Examples

**Safe Sources**:
- Our own analyzed books (user-submitted)
- **goodbooks-10k (original)** - CC BY-SA 4.0 metadata ✅
- CC-licensed book metadata
- Public domain book descriptions
- Publisher-provided content

**Avoid**:
- Goodreads scraped descriptions
- goodbooks-10k-extended (contains scraped Goodreads descriptions)
- Amazon scraped content
- Any ToS-restricted source

## Legal Disclaimer

This policy is for guidance only. For production or commercial use:
- Consult legal counsel
- Review all Terms of Service
- Ensure compliance with applicable laws
- Document all data sources and licenses

## References

- [Goodreads Terms of Service](https://www.goodreads.com/about/terms)
- [goodbooks-10k (CC BY-SA 4.0)](https://www.kaggle.com/zygmunt/goodbooks-10k) ✅ **APPROVED FOR USE**
- [CC BY-SA 4.0 License](https://creativecommons.org/licenses/by-sa/4.0/)
- [Open Library Data](https://openlibrary.org/developers/api)
- [Google Books API Terms](https://developers.google.com/books/terms)
- See [GOODBOOKS_10K_USAGE.md](./GOODBOOKS_10K_USAGE.md) for detailed usage guidelines

