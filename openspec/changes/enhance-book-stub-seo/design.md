# Design: SEO-Friendly Book Stub Pages

## Context

The book page route `/book/[isbn]` currently shows a minimal error state when a book hasn't been scanned. We want to transform this into a valuable, SEO-friendly landing page that can be indexed by search engines even before the book has Subtext data.

## Goals

- Create indexable, helpful pages for books that haven't been scanned yet
- Use real book metadata from external sources (Open Library, Google Books)
- Maintain legal safety (factual metadata only, no copyrighted excerpts)
- Convert SEO traffic into scans/contributions
- Follow Google's best practices for programmatic SEO

## Non-Goals

- Auto-generating thousands of empty pages (only generate on-demand when URL is accessed)
- Including copyrighted book excerpts or full descriptions
- Misrepresenting content warnings we don't have
- Blocking search engine crawlers

## Decisions

### Decision: Fetch metadata on-demand, not pre-generate

**What**: When `/book/[isbn]` is accessed and the book doesn't exist in Subtext, fetch metadata from external APIs.

**Why**: 
- Avoids generating thousands of empty pages upfront
- Only creates pages when there's actual interest (someone visits the URL)
- Reduces API costs and storage
- Follows the "future-complete" pattern where pages exist conceptually but data is fetched when needed

**Alternatives considered**:
- Pre-generating stubs for popular ISBNs: Too expensive, requires curation
- Caching all fetched metadata: Adds complexity, may violate API TOS
- **Chosen**: On-demand fetching with Next.js caching

### Decision: Reuse existing `fetchBookByISBN` function

**What**: Use the existing `lib/book-api.ts` function that already handles Open Library and Google Books.

**Why**:
- Already tested and working
- Handles error cases and fallbacks
- Respects API rate limits and TOS
- Returns structured `BookData` type

**Alternatives considered**:
- New dedicated stub-fetching function: Unnecessary duplication
- **Chosen**: Reuse existing function

### Decision: Return 200 OK for valid ISBNs, 404 for invalid ISBNs

**What**: Stub pages return HTTP 200 with helpful content for valid-ish ISBNs (even if not found in external APIs), but return 404 for clearly invalid ISBNs (wrong length, checksum failure, non-ISBN characters).

**Why**:
- Google can index 200 responses
- 404s are not indexable (appropriate for truly invalid requests)
- Page provides value (book info + CTA to scan) when ISBN is valid
- Prevents polluting index with garbage URLs
- Matches pattern used by Goodreads, StoryGraph, etc.

**Quality gate**: For valid ISBNs where external metadata fetch fails, still return 200 but set `noindex` unless minimum metadata (title + author) is available.

**Alternatives considered**:
- 404 with redirect: Loses SEO value
- 200 always: Risks indexing low-quality pages
- **Chosen**: 200 OK for valid ISBNs with quality gates, 404 for invalid ISBNs

### Decision: Add JSON-LD structured data

**What**: Include Book schema.org structured data in stub pages.

**Why**:
- Helps Google understand the page content
- Improves rich snippet eligibility
- Standard practice for book pages
- Can include ISBN, title, author, cover image

**Required fields**:
- `@type`: "Book"
- `isbn`: The book's ISBN
- `name`: Book title
- `author`: Author name (if available)
- `image`: Cover image URL (if available)
- `publisher`: Publisher name (if available)

**Optional but recommended fields**:
- `url`: Canonical page URL
- `sameAs`: Link to Open Library or Google Books page (if available)
- `isAccessibleForFree`: Omit or set based on messaging

**Alternatives considered**:
- Microdata: Less common, more verbose
- **Chosen**: JSON-LD (easier to maintain, Next.js-friendly)

### Decision: Dynamic page metadata

**What**: Generate `<title>` and `<meta description>` from book metadata.

**Why**:
- Better SEO than generic titles
- More relevant search result snippets
- Follows Next.js App Router patterns (`generateMetadata`)

**Format**:
- Stub pages (no Subtext data): Title: `"{Book Title} – Scan for Content Warnings | Subtext Scanner"`
- Full pages (with Subtext data): Title: `"{Book Title} – Content Warnings | Subtext Scanner"`
- Description: `"Check content warnings for {Book Title} by {Author}. Scan this book with Subtext Scanner to unlock community-reviewed warnings before you read."`

**Rationale**: Using "Scan for Content Warnings" for stubs avoids over-promising when we don't have warnings yet, while maintaining SEO intent.

### Decision: Optional sitemap enhancement (future)

**What**: Consider adding popular/trending ISBNs to sitemap in future iteration.

**Why**:
- Helps Google discover pages proactively
- Can prioritize high-value books
- Not required for initial implementation

**Alternatives considered**:
- Include all ISBNs: Too many, not scalable
- **Chosen**: Defer to future enhancement, focus on on-demand generation first

## Risks / Trade-offs

### Risk: API rate limits

**Mitigation**: 
- Use Next.js caching (`next: { revalidate: 86400 }`) to reduce API calls
- External APIs already have caching in `fetchBookByISBN`
- Stub pages are only generated on-demand, not bulk

### Risk: Thin content penalty

**Mitigation**:
- Include substantial helpful content (book metadata, explanation, FAQ)
- Not just a button - actual value for users
- Follow Google's quality guidelines

### Risk: Legal concerns about metadata

**Mitigation**:
- Only use factual metadata (title, author, ISBN, cover) - these are facts, not copyrighted
- No book excerpts or full descriptions
- Same pattern used by Goodreads, StoryGraph, etc.
- Open Library and Google Books APIs allow this usage

### Trade-off: Performance vs. SEO

**Consideration**: Fetching external metadata adds latency.

**Mitigation**:
- Use Next.js ISR or caching
- Show loading state if needed
- Metadata fetch is fast (< 1s typically)

## Migration Plan

1. **Phase 1**: Enhance stub page to fetch and display metadata
2. **Phase 2**: Add structured data (JSON-LD)
3. **Phase 3**: Add dynamic page metadata
4. **Phase 4** (optional): Sitemap enhancement for popular books

No rollback needed - this is additive. Existing behavior (showing stub) remains, just enhanced.

## Open Questions

- Should we cache fetched metadata in database for faster subsequent loads? (Probably not needed initially - Next.js cache is sufficient)
- Should stub pages include "Similar books" or "Recently scanned" sections? (Defer to future)

## Future Enhancements

### Stub page traffic tracking

Track which stub pages receive the most visits to prioritize which books to scan next. This creates a direct feedback loop:
- SEO visits → identify high-demand books → prioritize scanning → better content → better SEO rankings

This is a separate feature but directly supports the SEO strategy.
