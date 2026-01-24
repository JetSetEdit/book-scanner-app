# Design: External API Search Integration

## Context

The search bar currently only searches the local database. Users want to discover books that haven't been scanned yet. We have Google Books API access with proper API key configuration, and existing functions like `fetchByTitleAuthor` that can search external APIs.

## Goals / Non-Goals

### Goals
- Allow users to search for books not yet in the database
- Provide clear path to scan books found via external APIs
- Maintain fast search performance (database-first, external as fallback)
- Graceful degradation if external APIs are unavailable or rate-limited

### Non-Goals
- Real-time external API search on every keystroke (only when database search yields no/limited results)
- Caching external API results in database (only show results, don't persist)
- Full book metadata display for external results (minimal preview, full details after scan)

## Decisions

### Decision: Database-first search with external fallback
**What**: Search database first, only query external APIs if database search returns no results or very few results (< 3).

**Why**: 
- Database search is fast and free
- External API calls have rate limits and latency
- Most common use case is finding already-scanned books
- Reduces API quota usage

**Alternatives considered**:
- Always search both in parallel: Rejected - too many API calls, slower response
- External-first: Rejected - slower, more expensive, database is primary source

### Decision: Limit external results to 5-10 items
**What**: Return maximum 5-10 external API results, sorted by relevance.

**Why**:
- Keeps UI manageable
- Reduces API quota usage
- Most users only need top matches

**Alternatives considered**:
- Show all results: Rejected - could be overwhelming, expensive
- Show only 3: Rejected - might miss relevant matches

### Decision: Filter out duplicates by ISBN
**What**: Before returning external results, check if any match existing database books by ISBN and exclude them.

**Why**:
- Avoids showing duplicate results
- Database results are authoritative (have warnings, full metadata)
- Cleaner user experience

**Alternatives considered**:
- Show both: Rejected - confusing to have same book twice
- Only show external if no database match: Rejected - might miss better metadata

### Decision: Graceful degradation on API failures
**What**: If Google Books API fails (rate limit, network error, etc.), return database results only and log warning. Don't show error to user.

**Why**:
- Search should always work, even if external APIs are down
- Rate limits are common with free tier
- User experience shouldn't break due to external dependency

**Alternatives considered**:
- Show error message: Rejected - breaks search UX
- Retry with backoff: Rejected - adds complexity, slows down search

### Decision: Visual distinction for external results
**What**: Style external API results differently (muted background, different icon, "Scan this book" button) to clearly indicate they're not yet scanned.

**Why**:
- Users need to understand these books aren't in the system yet
- Clear call-to-action to scan
- Prevents confusion about why warnings aren't shown

**Alternatives considered**:
- Same styling: Rejected - users might think book is already scanned
- Completely different UI: Rejected - too jarring, breaks consistency

## Risks / Trade-offs

### Risk: Rate limiting from Google Books API
**Mitigation**: 
- Only search external APIs when database search yields no results
- Limit to 5-10 results
- Graceful degradation (return database results only)
- API key configured for higher limits

### Risk: Slower search performance
**Mitigation**:
- Database-first approach (fast path for most queries)
- External API only triggered when needed
- Debounced search (300ms) already in place
- Consider adding timeout (5s) for external API calls

### Risk: Inaccurate external results
**Mitigation**:
- Use existing `fetchByTitleAuthor` which has ISBN validation
- Filter by ISBN matching to ensure relevance
- Limit results to top matches
- User can verify before scanning

### Trade-off: External results don't have warnings
**Acceptance**: This is expected - warnings are only generated after scanning. External results are discovery mechanism, not final results.

## Implementation Notes

- Reuse `fetchByTitleAuthor` from `lib/book-api.ts` (already implemented)
- Extract ISBN from Google Books `industryIdentifiers` field
- Use `normalizeISBN` to ensure consistent ISBN format
- Check database for existing books by ISBN before including in external results
- Add `source` field to search results to distinguish database vs external
- Update TypeScript interfaces to include external result fields

## Open Questions

- Should we cache external API results temporarily (e.g., 5 minutes) to reduce API calls for repeated searches?
  - **Decision**: No, for now. Keep it simple. Can add later if needed.
- Should we show a preview of book description for external results?
  - **Decision**: Yes, show truncated description (first 100 chars) if available to help users identify the right book.
