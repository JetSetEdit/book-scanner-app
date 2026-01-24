# Change: Add external API search to search bar

## Why

Currently, the search bar only searches the local database (books that have already been scanned). Users cannot discover books that haven't been scanned yet, even though the system has access to Google Books API and Open Library APIs. This limits discoverability and forces users to manually enter ISBNs to scan new books.

With the Google Books API now properly configured with an API key, we can enhance the search experience to:
1. Search external APIs when database search returns no results or limited results
2. Show books from external APIs with a clear "Scan this book" prompt
3. Allow users to discover and scan books they're looking for without knowing the exact ISBN

## What Changes

- **Enhanced search API** - Modify `/api/search` to:
  - First search the local database (existing behavior)
  - If no results or limited results, also query Google Books API by title/author
  - Return both database results and external API results with a flag indicating source
  - Handle rate limiting gracefully (fallback to database-only if API unavailable)
- **Updated search component** - Modify `components/search.tsx` to:
  - Display external API results separately from database results (with visual distinction)
  - Show "Scan this book" button for external API results instead of direct navigation
  - Navigate to scan page with pre-filled ISBN when user clicks "Scan this book"
  - Handle loading states for external API searches
- **Search result types** - Extend search response to include:
  - Source indicator (`database` vs `external_api`)
  - Metadata for external results (title, author, ISBN, cover, description preview)
  - Clear distinction between scanned books (with warnings) and unscanned books (scan prompt)

## Impact

- **Affected specs**: New capability `search` (search functionality)
- **Affected code**:
  - `app/api/search/route.ts` - Add external API search fallback
  - `components/search.tsx` - Handle external API results and scan prompts
  - `lib/book-api.ts` - Reuse existing `fetchByTitleAuthor` function (already implemented)
  - Response types - Extend `SearchResponse` interface to include external results
