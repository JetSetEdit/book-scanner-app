## 1. Enhance search API endpoint

- [x] 1.1 Update `/api/search` route to check if database search returns results
- [x] 1.2 If no results or query length >= 3, call Google Books API with title/author search
- [x] 1.3 Extract ISBN, title, author, cover from Google Books results
- [x] 1.4 Filter external results to exclude books already in database (by ISBN)
- [x] 1.5 Handle rate limiting gracefully (log warning, return database results only)
- [x] 1.6 Extend response type to include `externalResults` array with source indicator
- [x] 1.7 Limit external results to top 5-10 most relevant matches
- [x] 1.8 Add error handling for API failures (don't break search if external API fails)

## 2. Update search component UI

- [x] 2.1 Extend `SearchResult` interface to include `source: 'database' | 'external_api'` and optional `isbn` for external results
- [x] 2.2 Update `SearchResponse` interface to include `externalResults` array
- [x] 2.3 Display database results first (existing behavior)
- [x] 2.4 Add visual separator between database and external results
- [x] 2.5 For external results, show "Scan this book" button instead of direct link
- [x] 2.6 Style external results differently (e.g., muted background, different icon)
- [x] 2.7 Handle click on "Scan this book" - navigate to `/scan?isbn={isbn}` with pre-filled ISBN
- [x] 2.8 Show loading indicator when fetching external results
- [x] 2.9 Add attribution text for Google Books data (if required by TOS)

## 3. Testing and validation

- [ ] 3.1 Test search with books that exist in database (should show database results only)
- [ ] 3.2 Test search with books not in database (should show external API results)
- [ ] 3.3 Test search with partial matches (should show both database and external results)
- [ ] 3.4 Test rate limiting handling (should gracefully degrade to database-only)
- [ ] 3.5 Test ISBN search that doesn't exist (should show external API result if found)
- [ ] 3.6 Test title/author search that finds multiple external results
- [ ] 3.7 Verify "Scan this book" button navigates correctly with ISBN pre-filled
- [ ] 3.8 Test mobile responsiveness of search results with external API results

## 4. Documentation

- [x] 4.1 Update search API documentation if needed
- [x] 4.2 Add comments explaining external API fallback logic
- [x] 4.3 Document rate limiting behavior and graceful degradation
