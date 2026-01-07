# Metadata Sources & Licensing

This document outlines the metadata sources used by Subtext and their licensing posture.

## Core "Safe" Public Metadata Sources

### Google Books API
- **License**: Free API with quotas (requires API key)
- **Source Type**: Open API-first, not retailer scraping
- **What Subtext Uses**:
  - Book descriptions/blurbs
  - Author information
  - Page count
  - Categories/subjects
  - Cover images
  - Publication metadata
- **Safe to Store**: ✅ Yes - API data can be cached and stored
- **Attribution**: Not required, but good practice to mention "Data sourced via Google Books"
- **Reference**: [Google Books API Documentation](https://developers.google.com/books/docs/v1/using)

### Open Library (Internet Archive)
- **License**: Free, public Web APIs + monthly bulk data dumps
- **Source Type**: Open library metadata, CC0/public domain intent
- **What Subtext Uses**:
  - Book descriptions/excerpts
  - Author information
  - Subjects/categories
  - Cover images
  - Publication metadata
- **Safe to Store**: ✅ Yes - Open Library metadata is intended for open, non-infringing use
- **Attribution**: Recommended to mention "Data sourced via Open Library" or similar
- **Endpoints Used**:
  - `/api/books?bibkeys=ISBN:{isbn}&format=json&jscmd=data` - Edition metadata
  - `/b/isbn/{isbn}-L.jpg` - Cover images
- **Reference**: [Open Library API Documentation](https://openlibrary.org/developers/api)

### OAPEN Library (Open Access Books)
- **License**: CC0 1.0 for metadata feeds
- **Source Type**: Open-access scholarly books metadata
- **What Subtext Uses**: Not currently integrated (primarily for academic/non-fiction)
- **Safe to Store**: ✅ Yes - CC0 licensed metadata
- **Use Case**: Potential future integration for academic/non-fiction titles
- **Reference**: [OAPEN Metadata](https://www.oapen.org/article/metadata)

## Licensing Posture Summary

| Source | License | Safe to Store | Safe to Display | Attribution Required |
|--------|---------|---------------|-----------------|---------------------|
| Google Books API | Free API (TOS) | ✅ Yes | ✅ Yes | Recommended |
| Open Library | Public/CC0 intent | ✅ Yes | ✅ Yes | Recommended |
| OAPEN | CC0 1.0 | ✅ Yes | ✅ Yes | Recommended |

## What Subtext Does

1. **Fetches metadata** from Google Books and Open Library APIs
2. **Stores metadata** in our database (descriptions, authors, covers, etc.)
3. **Uses metadata** as input for AI content warning analysis
4. **Displays metadata** to users with source attribution
5. **Caches responses** to reduce API calls and improve performance

## What Subtext Does NOT Do

- ❌ Scrape retailer websites (Amazon, QBD, Booktopia, Barnes & Noble, etc.)
- ❌ Use or quote retailer product descriptions (violates TOS)
- ❌ Store copyrighted book content (full text, chapters, etc.)
- ❌ Redistribute book content
- ❌ Use retailer descriptions without proper licensing

## Web Search & TOS Compliance

When using web search (via OpenAI) to enhance minimal descriptions, we explicitly instruct the AI to:
- **AVOID** retailer websites and their descriptions
- **ONLY** use open, publicly available sources:
  - Open Library
  - Google Books (via API)
  - Library catalogs
  - Publisher websites
  - Author websites
  - Public review sites (Goodreads, LibraryThing)
  - Wikipedia and open encyclopedias
  - Academic databases with open access

This ensures we do not violate retailer Terms of Service by scraping or reproducing their product descriptions.

## Current Implementation

- **Primary Sources**: Google Books API + Open Library API
- **Fallback Strategy**: Try both APIs, prefer the one with better/longer descriptions
- **Description Enhancement**: When descriptions are minimal, we use web search (via OpenAI) to find additional context, but we prioritize open API sources

## Future Enhancements

- [ ] Enhanced Open Library integration (use work API for better descriptions)
- [ ] OAPEN Library integration for academic titles
- [ ] Better description aggregation from multiple open sources
- [ ] Explicit source attribution in UI

## References

- [Open Library Developers](https://openlibrary.org/developers)
- [Google Books API](https://developers.google.com/books/docs/v1/using)
- [OAPEN Metadata](https://www.oapen.org/article/metadata)

