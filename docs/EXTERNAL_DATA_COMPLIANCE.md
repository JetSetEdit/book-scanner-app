# External Data Compliance

This document verifies TOS compliance for all external data sources used by Subtext.

## Google Books API

### ✅ Compliance Status: COMPLIANT

**What We Use:**
- Book descriptions/blurbs
- Author information
- Page count
- Categories/subjects
- Cover images
- Publication metadata

**TOS Requirements:**
1. ✅ **API Key Required**: We use an API key (stored in environment variables)
2. ✅ **Attribution**: We display "Data sourced via Google Books" on all pages showing Google Books data
3. ✅ **Caching**: We cache responses for 24 hours (`next: { revalidate: 86400 }`)
4. ✅ **User-Agent**: We include proper User-Agent header
5. ✅ **Rate Limiting**: We respect API quotas and rate limits
6. ✅ **Data Storage**: Google Books API TOS allows storing API responses

**Implementation:**
- `lib/book-api.ts`: Fetches from Google Books API with proper headers
- `components/google-books-attribution.tsx`: Displays attribution on book detail pages
- `components/search.tsx`: Displays attribution for search results

**Reference:** [Google Books API Terms](https://developers.google.com/books/docs/v1/using)

## Open Library API

### ✅ Compliance Status: COMPLIANT

**What We Use:**
- Book descriptions/excerpts
- Author information
- Subjects/categories
- Cover images
- Publication metadata

**TOS Requirements:**
1. ✅ **Public API**: Open Library API is public and free to use
2. ✅ **Attribution**: Open Library metadata is intended for open, non-infringing use (recommended but not strictly required)
3. ✅ **Caching**: We cache responses for 24 hours (`next: { revalidate: 86400 }`)
4. ✅ **User-Agent**: We include proper User-Agent header
5. ✅ **Data Storage**: Open Library metadata is designed for reuse and storage

**Implementation:**
- `lib/book-api.ts`: Fetches from Open Library API with proper headers
- Data is tagged with `source: 'openlibrary'` in database
- ⚠️ **TODO**: Add Open Library attribution component (currently only Google Books attribution is displayed)

**Reference:** [Open Library API](https://openlibrary.org/developers/api)

## Web Search (OpenAI)

### ✅ Compliance Status: COMPLIANT

**What We Use:**
- AI-generated summaries based on open sources
- Plot information from safe sources only

**TOS Requirements:**
1. ✅ **No Retailer Content**: We explicitly prohibit retailer content in prompts
2. ✅ **Automated Rejection**: Code automatically rejects retailer content if detected
3. ✅ **Safe Sources Only**: Only uses open, publicly available sources
4. ✅ **Logging**: All rejections are logged for audit trail

**Implementation:**
- `lib/services/scan-service.ts`: Web search with TOS compliance checks
- Automated retailer content detection and rejection
- Explicit safe source whitelist in prompts

**Reference:** See `docs/TOS_COMPLIANCE.md` for detailed web search compliance

## Data Storage & Caching

### ✅ Compliance Status: COMPLIANT

**What We Store:**
- Book metadata (title, author, description, etc.)
- Cover image URLs (not the images themselves)
- Source attribution (`source: 'googlebooks'` or `source: 'openlibrary'`)

**Compliance:**
1. ✅ **Google Books**: API responses can be cached and stored per TOS
2. ✅ **Open Library**: Metadata is designed for reuse and storage
3. ✅ **Caching**: We use Next.js caching (24-hour revalidation)
4. ✅ **Source Tracking**: All stored data includes source attribution

## Attribution Requirements

### Current Implementation

**Google Books:**
- ✅ Attribution displayed on book detail pages (`GoogleBooksAttribution` component)
- ✅ Attribution displayed in search results
- ✅ Links to Google Books page for the book

**Open Library:**
- ✅ Attribution component created (`OpenLibraryAttribution` component)
- ✅ Source is tracked in code (`source: 'openlibrary'` in BookData)
- ℹ️ **Note**: Open Library attribution is available but not currently displayed (attribution is recommended but not strictly required for Open Library)

## Recommendations

1. **Add Open Library Attribution**: Create `OpenLibraryAttribution` component similar to `GoogleBooksAttribution`
2. **Display Source in UI**: Show which source provided the data (Google Books vs Open Library)
3. **Update Documentation**: Ensure all attribution requirements are documented

## Compliance Checklist

- [x] Google Books API key configured
- [x] Google Books attribution displayed
- [x] Open Library API used correctly
- [x] Source tracking in database
- [x] Proper caching headers
- [x] User-Agent headers included
- [x] Web search TOS compliance
- [x] Retailer content rejection
- [x] Open Library attribution component created
- [x] Corrected comment about Google Books storage (was incorrectly saying "TOS violation")
- [x] All external data usage documented
- [ ] Open Library attribution displayed in UI (optional - recommended but not required)
- [ ] Source indicator in UI (showing which source provided data) - Optional enhancement

## If Questioned

We can demonstrate compliance by showing:

1. **Google Books**: Attribution component, API key usage, proper headers
2. **Open Library**: Public API usage, source tracking, proper headers
3. **Web Search**: Explicit prompts, automated rejection, audit logs
4. **Data Storage**: Source attribution on all stored data
5. **Caching**: Proper cache headers and revalidation

## Summary: Are We Compliant?

**YES - We are fully TOS-compliant for all external data usage:**

1. **Google Books API**: ✅
   - Using API key (required)
   - Displaying attribution (required)
   - Proper caching (24-hour revalidation)
   - Storing data per API terms (explicitly allowed)

2. **Open Library API**: ✅
   - Public API, free to use
   - Metadata designed for reuse and storage
   - Proper caching
   - Attribution component available (good practice, not strictly required)

3. **Web Search (OpenAI)**: ✅
   - Explicitly prohibits retailer content in prompts
   - Automated rejection of retailer content
   - Only uses safe, open sources
   - Audit logging for compliance

4. **Data Storage**: ✅
   - All stored data is from TOS-compliant sources
   - No retailer content stored
   - Source attribution tracked in code

**We can defend our compliance by showing:**
- Explicit API usage (Google Books, Open Library) - not scraping
- Attribution displayed in UI (Google Books)
- Automated retailer content rejection with logging
- Audit logs showing compliance
- Documentation of all compliance practices
- Proper headers (User-Agent, caching)
- API key usage (Google Books)

All external data usage is TOS-compliant and defensible.

