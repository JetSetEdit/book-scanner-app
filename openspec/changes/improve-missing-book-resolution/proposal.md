# Change: Improve missing book resolution with enhanced search strategies

## Why

Currently, when users report missing books, the system:
1. Only searches by ISBN in external APIs (Google Books, Open Library)
2. If ISBN search fails, the book is marked as "not found" even if it exists with a different ISBN format or can be found by title/author
3. The resolve endpoint creates books with minimal metadata (just title/author from user input)
4. No retry mechanism or alternative search strategies when initial ISBN lookup fails

This results in:
- Books that exist but aren't found due to ISBN format mismatches (ISBN-10 vs ISBN-13)
- Books that could be found by title/author search but aren't because we only search by ISBN
- User-reported books with incomplete metadata (no description, limited cover images)
- Manual intervention required even when automated solutions could work

## What Changes

- **Enhanced book search by title/author** - Add `fetchByTitleAuthor()` function to search Google Books using `intitle:` and `inauthor:` queries when ISBN search fails
- **ISBN format retry logic** - When ISBN search fails, automatically try converting between ISBN-10 and ISBN-13 formats and retry
- **Improved resolve endpoint** - Enhance `resolve-by-adding-book` to:
  - First attempt title/author search to find better metadata before creating minimal book
  - Use found metadata (description, cover, publisher) if available
  - Fall back to user-provided data only if search fails
- **Automatic retry for pending reports** - Add optional background job or manual trigger to retry failed ISBN searches with alternative strategies
- **Better error messages** - Provide more specific feedback about why books weren't found (ISBN format issue, not in databases, etc.)

## Impact

- **Affected specs**: `book-api` (new capability), `manual-handling` (enhanced resolution)
- **Affected code**:
  - `lib/book-api.ts` - Add `fetchByTitleAuthor()` function
  - `lib/isbn-validation.ts` - Add ISBN-10/ISBN-13 conversion utilities
  - `app/api/admin/manual-handling-scans/resolve-by-adding-book/route.ts` - Enhanced to use title/author search
  - `app/api/report-book/route.ts` - Optional: retry with title/author before creating report
  - `scripts/view-missing-book-reports.ts` - Add retry suggestions
  - New script: `scripts/retry-missing-book-searches.ts` - Batch retry pending reports
