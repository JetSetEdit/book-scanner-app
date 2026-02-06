## ADDED Requirements

### Requirement: SEO-friendly stub page for unscanned books

When a user or search engine accesses `/book/[isbn]` for a book that does not exist in Subtext's database, the system SHALL display a helpful, indexable landing page that includes book metadata from external sources (Open Library, Google Books) and encourages scanning.

#### Scenario: User visits unscanned book page with valid ISBN
- **WHEN** a user navigates to `/book/[isbn]` where the ISBN is valid (correct length, passes checksum)
- **AND** the ISBN does not exist in Subtext's database
- **AND** external metadata is successfully fetched from Open Library or Google Books
- **AND** minimum metadata is available (at least title + author)
- **THEN** the page SHALL display:
  - Book title, author, and cover image (if available)
  - Book description (if available from external sources)
  - Clear call-to-action: "Scan this book to unlock content warnings"
  - Explanatory section: "Why isn't this scanned yet?" with information about the scanning process
  - Navigation options to scan the book or return to home
- **AND** the page SHALL return HTTP 200 OK (not 404)
- **AND** the page SHALL be indexable (no `noindex` directive)

#### Scenario: Invalid ISBN format
- **WHEN** a user navigates to `/book/[isbn]` where the ISBN is clearly invalid (wrong length, non-ISBN characters, checksum failure)
- **THEN** the page SHALL return HTTP 404 (Not Found)
- **OR** the page SHALL return HTTP 200 with `noindex, follow` robots directive and a helpful error message
- **AND** the page SHALL NOT be indexed by search engines

#### Scenario: Valid ISBN but metadata unavailable
- **WHEN** a user navigates to `/book/[isbn]` where the ISBN is valid but does not exist in Subtext's database
- **AND** external metadata cannot be fetched (API failure, book not found in external sources)
- **AND** minimum metadata (title + author) is not available
- **THEN** the page SHALL display a graceful fallback message
- **AND** the page SHALL return HTTP 200 OK
- **AND** the page SHALL include `noindex, follow` robots directive (to prevent indexing low-quality pages)
- **AND** the page SHALL still include navigation options to scan or return home

#### Scenario: Valid ISBN with partial metadata
- **WHEN** a user navigates to `/book/[isbn]` where the ISBN is valid but does not exist in Subtext's database
- **AND** external metadata is partially fetched (at least title + author available)
- **THEN** the page SHALL display the available metadata
- **AND** the page SHALL return HTTP 200 OK
- **AND** the page SHALL be indexable (no `noindex` directive, as minimum quality threshold is met)

#### Scenario: Search engine crawls stub page
- **WHEN** a search engine crawler accesses `/book/[isbn]` for an unscanned book
- **THEN** the page SHALL be crawlable (no authentication required, no blocking)
- **AND** the page SHALL include proper HTML metadata (title, description)
- **AND** the page SHALL include structured data (JSON-LD Book schema)
- **AND** the page SHALL provide value (book information, not just a button)

### Requirement: Dynamic page metadata for stub pages

The system SHALL generate dynamic HTML metadata (`<title>`, `<meta description>`, Open Graph tags) for stub pages based on fetched book metadata.

#### Scenario: Metadata generation for stub page
- **WHEN** a stub page is rendered with successfully fetched book metadata
- **THEN** the page `<title>` SHALL be: `"{Book Title} – Scan for Content Warnings | Subtext Scanner"`
- **AND** the `<meta description>` SHALL include the book title and author: `"Check content warnings for {Book Title} by {Author}. Scan this book with Subtext Scanner to unlock community-reviewed warnings before you read."`
- **AND** Open Graph tags SHALL be included for social sharing

#### Scenario: Metadata generation for full page
- **WHEN** a full book page is rendered (book exists in Subtext with content warnings)
- **THEN** the page `<title>` SHALL be: `"{Book Title} – Content Warnings | Subtext Scanner"`
- **AND** the `<meta description>` SHALL reflect that warnings are available

#### Scenario: Metadata generation without book data
- **WHEN** a stub page is rendered but external metadata fetch fails or minimum metadata (title + author) is not available
- **THEN** the page SHALL use fallback generic metadata
- **AND** the page SHALL include `noindex` robots directive

### Requirement: Structured data (JSON-LD) for stub pages

The system SHALL include JSON-LD structured data following schema.org Book schema for stub pages when book metadata is available.

#### Scenario: Structured data with complete metadata
- **WHEN** a stub page is rendered with successfully fetched book metadata
- **THEN** the page SHALL include a JSON-LD script tag with Book schema
- **AND** the structured data SHALL include required fields:
  - `@type`: "Book"
  - `isbn`: The book's ISBN
  - `name`: Book title
  - `author`: Author name (if available)
  - `image`: Cover image URL (if available)
  - `publisher`: Publisher name (if available)
- **AND** the structured data MAY include optional fields:
  - `url`: Canonical page URL
  - `sameAs`: Link to Open Library or Google Books page (if available)
  - `isAccessibleForFree`: Omit or set based on messaging
- **AND** the structured data SHALL be valid according to schema.org Book schema
- **AND** the structured data SHALL NOT include fields that are not available (e.g., omit `author` if not fetched)

#### Scenario: Structured data validation
- **WHEN** structured data is included in a stub page
- **THEN** it SHALL pass Google's Rich Results Test validation
- **AND** it SHALL not include any fields that are not available (e.g., omit `author` if not fetched)

## MODIFIED Requirements

### Requirement: Book page route handling

When a user accesses `/book/[isbn]`, the system SHALL:

1. First validate the ISBN format (length, checksum)
2. If the ISBN is invalid, return HTTP 404 or HTTP 200 with `noindex` directive
3. If the ISBN is valid, check if the book exists in Subtext's database
4. If the book exists, display the full book page with content warnings (existing behavior)
5. If the book does not exist:
   - Attempt to fetch metadata from external sources (Open Library, Google Books)
   - If minimum metadata (title + author) is available, display an SEO-friendly stub page with the fetched metadata
   - If minimum metadata is not available, display a helpful fallback page with `noindex` directive
   - Include structured data and proper HTML metadata when metadata is available
   - Return HTTP 200 OK

The page SHALL be crawlable by search engines without authentication. Pages SHALL only be indexed when they meet quality thresholds (valid ISBN + minimum metadata available).

#### Scenario: Existing book page (unchanged)
- **WHEN** a user accesses `/book/[isbn]` for a book that exists in Subtext's database
- **THEN** the page SHALL display the full book details and content warnings (existing behavior unchanged)

#### Scenario: New stub page flow
- **WHEN** a user accesses `/book/[isbn]` for a book that does not exist in Subtext's database
- **THEN** the system SHALL fetch metadata from external sources
- **AND** display the enhanced stub page with metadata
- **AND** include SEO optimizations (metadata, structured data)
