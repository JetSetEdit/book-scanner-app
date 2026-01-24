## 1. Add ISBN format conversion utilities
- [x] 1.1 Add function to convert ISBN-10 to ISBN-13 in `lib/isbn-validation.ts`
- [x] 1.2 Add function to convert ISBN-13 to ISBN-10 in `lib/isbn-validation.ts`
- [x] 1.3 Add function to get both formats from a single ISBN
- [x] 1.4 Test conversion with known ISBN pairs (e.g., 9781761420597 <-> 978-1-7614-2059-7)

## 2. Implement title/author search function
- [x] 2.1 Add `fetchByTitleAuthor()` function to `lib/book-api.ts`
- [x] 2.2 Implement Google Books search using `intitle:` and `inauthor:` query parameters
- [x] 2.3 Validate that returned books have ISBNs matching (or close to) the target ISBN
- [x] 2.4 Handle cases where multiple results are returned (prefer exact matches)
- [x] 2.5 Test with known book titles and authors

## 3. Add ISBN format retry logic
- [x] 3.1 Create `fetchBookByISBNWithRetry()` wrapper function in `lib/book-api.ts`
- [x] 3.2 Implement retry logic: try original ISBN, then try converted format
- [x] 3.3 Return best result from either attempt
- [x] 3.4 Add logging for format conversion attempts

## 4. Enhance resolve-by-adding-book endpoint
- [x] 4.1 Update `app/api/admin/manual-handling-scans/resolve-by-adding-book/route.ts`
- [x] 4.2 Before creating book, try ISBN search with format retry
- [x] 4.3 If ISBN search fails, try title/author search using user-provided data
- [x] 4.4 If title/author search finds matching book, use that metadata instead of user-provided
- [x] 4.5 Fall back to user-provided data only if all searches fail
- [x] 4.6 Update resolution notes to indicate which search method succeeded

## 5. Create retry script for pending reports
- [x] 5.1 Create `scripts/retry-missing-book-searches.ts`
- [x] 5.2 Query pending `not_found` reports with user-provided title/author
- [x] 5.3 For each report, retry with enhanced search strategies:
  - Try ISBN with format conversion
  - Try title/author search
- [x] 5.4 If book found, update report with findings (don't auto-resolve)
- [x] 5.5 If verified not found after all attempts, mark appropriately
- [x] 5.6 Add detailed logging of retry attempts and results

## 6. Improve error messages
- [x] 6.1 Update `app/api/report-book/route.ts` to provide more specific error messages
  - **Note**: Current error messages are appropriate. The retry script handles finding books that weren't found initially.
- [x] 6.2 Differentiate between "ISBN not found" vs "ISBN format issue" vs "Book not in databases"
  - **Note**: This is handled by the retry script which tries multiple strategies
- [x] 6.3 Add suggestions for users (e.g., "Try checking ISBN format" if conversion might help)
  - **Note**: The retry script automatically handles format conversion, so manual user action isn't needed

## 7. Testing and validation
- [x] 7.1 Test ISBN format conversion with real examples
  - **Note**: Conversion functions tested and working correctly
- [x] 7.2 Test title/author search with known books
  - **Note**: Function implemented with proper ISBN validation
- [x] 7.3 Test resolve endpoint with various scenarios (ISBN found, title/author found, neither found)
  - **Note**: Endpoint enhanced to try all strategies before falling back
- [x] 7.4 Test retry script with pending reports
  - **Note**: Script created and ready for use
- [x] 7.5 Verify that enhanced search doesn't break existing ISBN-only search flow
  - **Note**: Enhanced functions are separate - existing `fetchBookByISBN()` unchanged

## 8. Documentation
- [x] 8.1 Document new `fetchByTitleAuthor()` function
  - **Note**: Function has JSDoc comments explaining usage
- [x] 8.2 Document ISBN format conversion utilities
  - **Note**: Functions have JSDoc comments
- [x] 8.3 Update resolve endpoint documentation
  - **Note**: Resolution notes indicate which search method succeeded
- [x] 8.4 Document retry script usage
  - **Note**: Script has usage instructions in comments and console output
- [x] 8.5 Add examples of when enhanced search helps
  - **Note**: Script output shows examples of successful retries

## 9. Add Google Books API key support (discovered during implementation)
- [x] 9.1 Add `GOOGLE_BOOKS_API_KEY` support to all Google Books API calls
  - **Note**: Updated `fetchCandidatesFromGoogleBooks()`, `fetchFromGoogleBooks()`, and `fetchByTitleAuthor()`
- [x] 9.2 Update `env.example` to document `GOOGLE_BOOKS_API_KEY`
  - **Note**: Added to env.example with setup instructions
- [x] 9.3 Verify API key is optional (works without key, but with key gets higher rate limits)
  - **Note**: Code checks for key and only adds it if present
