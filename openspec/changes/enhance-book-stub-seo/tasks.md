## 1. Enhance stub page with metadata fetching

- [x] 1.1 Modify `app/book/[isbn]/page.tsx` to fetch metadata when book doesn't exist
- [x] 1.2 Import and use `fetchBookByISBN` from `lib/book-api.ts`
- [x] 1.3 Handle loading and error states for metadata fetch
- [x] 1.4 Create or enhance stub page component to display fetched metadata
- [x] 1.5 Show book cover, title, author, description (if available)
- [x] 1.6 Add "Why isn't this scanned yet?" explanatory section
- [x] 1.7 Ensure CTA buttons remain prominent

## 2. Add SEO metadata

- [x] 2.1 Implement `generateMetadata` function in `app/book/[isbn]/page.tsx`
- [x] 2.2 Generate dynamic `<title>` from book metadata:
  - Stub pages: `"{Title} – Scan for Content Warnings | Subtext Scanner"`
  - Full pages: `"{Title} – Content Warnings | Subtext Scanner"`
- [x] 2.3 Generate dynamic `<meta description>` with book title and author
- [x] 2.4 Add Open Graph tags for social sharing
- [x] 2.5 Implement `noindex` robots directive when minimum metadata is unavailable
- [ ] 2.6 Test metadata appears correctly in page source

## 3. Add structured data (JSON-LD)

- [x] 3.1 Create Book schema.org JSON-LD object
- [x] 3.2 Include required fields: ISBN, title, author, cover image, publisher (if available)
- [x] 3.3 Include optional fields: `url` (canonical), `sameAs` (external links), `isAccessibleForFree` (if applicable)
- [x] 3.4 Add JSON-LD script tag to stub page
- [ ] 3.5 Validate structured data using Google's Rich Results Test
- [x] 3.6 Ensure structured data only appears when metadata is successfully fetched
- [x] 3.7 Ensure structured data omits fields that are not available

## 4. ISBN validation and quality gates

- [x] 4.1 Implement ISBN validation (length, checksum) before metadata fetch
- [x] 4.2 Return 404 or `noindex` for invalid ISBNs
- [x] 4.3 Implement minimum metadata check (title + author required for indexing)
- [x] 4.4 Set `noindex` robots directive when minimum metadata unavailable
- [ ] 4.5 Test invalid ISBN handling (wrong length, checksum failure, non-ISBN characters)

## 5. Testing and validation

- [ ] 5.1 Test stub page with valid ISBN that doesn't exist in Subtext
- [ ] 5.2 Test stub page with invalid ISBN (should return 404 or `noindex`)
- [ ] 5.3 Test stub page when external APIs fail (graceful degradation with `noindex`)
- [ ] 5.4 Test stub page with partial metadata (title + author only)
- [ ] 5.5 Verify page returns 200 OK for valid ISBNs (404 for invalid)
- [ ] 5.6 Check page is crawlable (no auth walls, no blocking)
- [ ] 5.7 Verify `robots.txt` allows `/book/` paths
- [ ] 5.8 Check canonical URL behavior (especially ISBN-10 vs ISBN-13)
- [ ] 5.9 Validate JSON-LD with Google's Rich Results Test
- [ ] 5.10 Use Google URL Inspection tool to verify indexing behavior
- [ ] 5.11 Test metadata appears in page source
- [ ] 5.12 Verify mobile responsiveness

## 6. Documentation

- [x] 6.1 Document the SEO strategy in relevant docs
- [x] 6.2 Add comments explaining the stub page approach
- [x] 6.3 Document quality gates (ISBN validation, minimum metadata requirements)
- [x] 6.4 Note any API rate limit considerations
- [x] 6.5 Document `noindex` usage rationale
