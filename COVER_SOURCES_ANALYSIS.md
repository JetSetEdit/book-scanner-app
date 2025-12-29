# Cover Sources Analysis

## Current Cover Sources (in order)

1. **Google Books API** (`fetch-book-cover.ts`)
   - Validates: > 5KB, not 15,567 bytes (placeholder)
   - Returns high-quality version if available

2. **Open Library** (`fetch-book-cover.ts`)
   - URL: `https://covers.openlibrary.org/b/isbn/{isbn}-L.jpg`
   - Validates: Response OK, > 1KB if size available, not 15,567 bytes
   - Note: Doesn't always return content-type header

3. **Amazon** (`fetch-book-cover.ts`)
   - URL: `https://images-na.ssl-images-amazon.com/images/P/{isbn}.01.LZZZZZZZ.jpg`
   - Validates: > 5KB, not 15,567 bytes
   - May fail due to CORS

4. **ISBN DB** (`fetch-book-cover.ts`)
   - URL: `https://isbndb.com/book-image/{isbn}`
   - Validates: > 5KB, not 15,567 bytes

## AI Agent Cover Finding

The AI agent (`findBookAndGenerateWarnings`) **DOES** find covers when it searches:
- Searches Google Books, Apple Books, Goodreads, etc.
- Returns `book_cover_url` in the result
- Uses `findBestCover()` to validate covers from Google Books

**Current Usage:**
- AI agent is called when:
  1. Metadata is thin (no description or < 150 chars, no cover)
  2. Book not found in external APIs
  3. Generating content warnings for existing books (uses web search)

**Cover Update Logic:**
- If AI finds a cover (`foundCoverUrl`) and current book has no cover, it updates:
  ```typescript
  if (foundCoverUrl && !currentBook.cover_url && foundCoverUrl !== "No cover available") {
    updates.cover_url = foundCoverUrl;
  }
  ```

## Recommendation

### Option 1: Add AI Agent Fallback for Covers (Recommended)
When all 4 sources fail, call AI agent specifically to find cover:
- Pros: More comprehensive search, can find covers from sources we don't directly query
- Cons: Adds latency and API costs
- Implementation: Add a dedicated cover-finding agent call after all sources fail

### Option 2: Enhance Existing Flow
The AI agent is already called for thin metadata, but we could:
- Always call AI agent if no cover found (even if metadata is good)
- Make cover-finding a separate, faster agent call (just for cover, not full analysis)

### Option 3: Add More Direct Sources
Add more direct API sources before AI:
- Goodreads API (if available)
- LibraryThing
- WorldCat
- Book Depository

## Current Flow

```
1. Check database (existing book)
2. Fetch from Google Books API
3. Fetch from Open Library API
4. If no cover found AND metadata is thin:
   → Call AI agent (findBookAndGenerateWarnings)
   → AI agent searches multiple sources
   → Returns book_cover_url if found
5. If AI finds cover, update database
```

## Proposed Enhanced Flow

```
1. Check database (existing book)
2. Fetch from Google Books API
3. Fetch from Open Library API
4. Fetch from Amazon
5. Fetch from ISBN DB
6. If no cover found:
   → Call lightweight AI agent specifically for cover finding
   → Agent searches: Google Books, Apple Books, Goodreads, publisher sites
   → Returns cover URL if found
7. Update database with cover
```







