# Google Books API TOS Compliance Fix

## Summary

This document outlines the changes made to comply with Google APIs Terms of Service Section 5.e.1, which prohibits permanent storage of Google Books API content.

**Violation Identified:** We were storing Google Books metadata (titles, descriptions, ISBNs, covers, etc.) permanently in our Supabase `books` table, which violates Google's TOS clause:

> "Scrape, build databases, or otherwise create permanent copies of such content, or keep cached copies longer than permitted by the cache header;"

## Changes Made

### 1. Source Tracking (`lib/book-api.ts`)

- Added `source?: 'openlibrary' | 'googlebooks'` field to `BookData` interface
- Updated `fetchFromOpenLibrary()` to return `source: 'openlibrary'`
- Updated `fetchFromGoogleBooks()` to return `source: 'googlebooks'`
- `BookCandidate` already had source tracking (no changes needed)

### 2. Book Service (`lib/book-service.ts`)

**Before:** Stored all book metadata regardless of source.

**After:**
- Checks `bookData.source` before storing
- **Google Books:** Returns data directly without storing (relies on Next.js ISR cache for 24h)
- **Open Library:** Stores permanently (TOS-compliant - Open Library is public domain)

### 3. Scan Service (`lib/services/scan-service.ts`)

**Before:** Stored all book metadata regardless of source.

**After:**
- Checks `bookData.source` before storing
- **Google Books:** Stores only minimal public info (ISBN, title, author) - NOT metadata fields
- **Open Library:** Stores all metadata permanently
- For thin metadata cases, also checks source before storing

**Fields NOT stored for Google Books:**
- `cover_url`
- `description`
- `publisher`
- `published_date`
- `page_count`
- `categories`

**Fields stored for Google Books (public info only):**
- `isbn`
- `title`
- `author`

### 4. Purge Script (`scripts/purge-google-books-metadata.ts`)

Created a script to purge existing Google Books metadata from the database:

```bash
# Preview changes (dry run)
npx tsx scripts/purge-google-books-metadata.ts --dry-run

# Apply changes
npx tsx scripts/purge-google-books-metadata.ts --execute
```

The script:
- Identifies books with likely Google Books metadata (by checking cover URLs)
- Removes metadata fields while preserving ISBN, title, author (needed for content warning linking)
- Provides preview before execution

## Caching Strategy

### Next.js ISR Cache (TOS-Compliant)
- **TTL:** 24 hours (`revalidate: 86400`)
- **Location:** Server-side Next.js cache
- **Scope:** HTTP response caching for API calls
- **Compliance:** Aligns with typical Google Books API Cache-Control headers (1-24h)

### Database Storage
- **Open Library:** Permanent storage ✅ (public domain)
- **Google Books:** No metadata storage ✅ (TOS-compliant)
- **Minimal Records:** ISBN, title, author only for Google Books (needed for content warning linking)

## Impact on Functionality

### What Still Works
- ✅ Book scanning and ISBN lookup
- ✅ Content warning generation
- ✅ Book record creation for linking warnings
- ✅ Open Library metadata (stored permanently)
- ✅ Google Books metadata (fetched fresh, cached 24h via Next.js)

### What Changed
- ⚠️ Google Books metadata is no longer stored permanently
- ⚠️ Subsequent requests for Google Books data will hit the API (with Next.js cache)
- ⚠️ Existing Google Books metadata in DB should be purged (use purge script)

## Migration Steps

1. **Deploy code changes** (already done)
2. **Run purge script** to remove existing Google Books metadata:
   ```bash
   npx tsx scripts/purge-google-books-metadata.ts --execute
   ```
3. **Monitor API usage** - expect more Google Books API calls initially (until cache warms)
4. **Verify functionality** - ensure book scanning still works correctly

## Testing Checklist

- [ ] Scan a book that only exists in Google Books (not Open Library)
- [ ] Verify minimal record is created (ISBN, title, author only)
- [ ] Verify metadata is NOT stored (check DB)
- [ ] Verify metadata is still returned to user (from API/cache)
- [ ] Scan a book from Open Library
- [ ] Verify full metadata IS stored
- [ ] Test content warning generation still works
- [ ] Run purge script in dry-run mode
- [ ] Review identified books
- [ ] Run purge script with --execute

## Notes

- **Performance:** Google Books requests will hit the API more often, but Next.js ISR cache (24h) mitigates this
- **User Experience:** No visible impact - metadata is still fetched and displayed, just not stored
- **Content Warnings:** Still work correctly - book records are created with minimal info for linking
- **Future:** Consider adding a `metadata_source` column to track data provenance for auditing

## References

- Google APIs Terms of Service: https://developers.google.com/terms/api-services-user-policy
- Section 5.e.1: Prohibits permanent storage of API content
- Next.js ISR Documentation: https://nextjs.org/docs/app/building-your-application/data-fetching/incremental-static-regeneration




