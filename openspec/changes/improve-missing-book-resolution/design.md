# Design: Improve missing book resolution

## Context

The current book search flow:
1. User scans ISBN
2. System searches `books` table by ISBN
3. If not found, searches external APIs (Google Books, Open Library) by ISBN only
4. If still not found, creates `not_found` report in `manual_handling_scans`
5. Admin resolves by creating minimal book entry with user-provided title/author

Problems:
- ISBN format mismatches (9781761420597 vs 978-1-7614-2059-7) can cause failures
- Books exist in databases but aren't found because we only search by ISBN
- User-provided title/author isn't used for search before giving up
- Resolved books have minimal metadata (no description, basic covers)

## Goals

1. Find books that exist but weren't found due to ISBN format issues
2. Use title/author search as fallback when ISBN search fails
3. Enrich resolved books with full metadata when available
4. Reduce manual intervention by automating retry strategies

## Non-Goals

- Changing the primary ISBN search flow (keep it as-is for performance)
- Real-time title/author search during initial scan (only use for resolution/retry)
- Web scraping or non-API sources
- Automatic resolution without admin approval (keep manual trigger)

## Decisions

### Decision: Add title/author search as fallback, not primary

**What**: Implement `fetchByTitleAuthor()` that searches Google Books using `intitle:` and `inauthor:` queries, but only use it:
- In the resolve endpoint when creating books from user reports
- In a retry script for pending reports
- Not in the primary scan flow (to maintain performance)

**Why**:
- Title/author search is slower and less reliable than ISBN search
- We want to keep the fast path (ISBN-only) for normal scans
- Title/author search is most valuable when we have user-provided data and ISBN search already failed

**Alternatives considered**:
- Always search by title/author: Rejected - too slow for normal scans
- **Chosen**: Fallback only for resolution/retry scenarios

### Decision: ISBN format conversion and retry

**What**: When ISBN search fails, automatically:
1. Convert ISBN-10 to ISBN-13 (or vice versa)
2. Retry search with converted ISBN
3. Only if both fail, proceed to title/author search

**Why**:
- Many books exist in databases with different ISBN formats
- Conversion is fast and reliable
- Can catch many "not found" cases without slower title/author search

**Alternatives considered**:
- Always search both formats: Rejected - adds latency to every search
- **Chosen**: Retry with converted format only after initial failure

### Decision: Enhance resolve endpoint to search before creating

**What**: When resolving a user report:
1. First try ISBN search (with format conversion retry)
2. If that fails, try title/author search
3. If title/author search finds a match with matching ISBN, use that metadata
4. If no match found, create book with user-provided data (current behavior)

**Why**:
- User-provided title/author is valuable for search
- Better to have full metadata than minimal entry
- Still works if search fails (falls back to current behavior)

**Alternatives considered**:
- Always use user-provided data: Rejected - misses opportunity for better metadata
- **Chosen**: Search first, fallback to user data

### Decision: Batch retry script, not automatic background job

**What**: Create a script `scripts/retry-missing-book-searches.ts` that:
- Finds pending `not_found` reports with user-provided title/author
- Retries search with enhanced strategies (ISBN format conversion, title/author)
- Updates reports with findings or marks as "verified not found"

**Why**:
- Allows manual control over when to retry
- Can be run on-demand or scheduled
- Doesn't add background job complexity
- Can provide detailed logging of retry attempts

**Alternatives considered**:
- Automatic background job: Rejected - adds complexity, may retry too frequently
- **Chosen**: Manual script that can be scheduled or run on-demand

## Risks / Trade-offs

- **Risk**: Title/author search may return wrong books
  - **Mitigation**: Validate that returned ISBN matches (or is close to) the reported ISBN
  - **Mitigation**: Prefer exact title/author matches over partial

- **Risk**: Google Books API rate limits
  - **Mitigation**: Add delays between retry attempts
  - **Mitigation**: Cache results when possible

- **Trade-off**: More API calls vs better book discovery
  - **Acceptable**: Retry only happens for user-reported books, not every scan

- **Risk**: ISBN format conversion edge cases
  - **Mitigation**: Use well-tested ISBN conversion library/utilities
  - **Mitigation**: Validate converted ISBNs before using

## Open Questions

- Should we also search Open Library by title/author, or just Google Books? (Google Books has better API for title/author search)
- Should retry script automatically resolve reports if it finds books, or just update them for manual review?
