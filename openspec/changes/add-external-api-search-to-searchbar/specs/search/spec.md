# Search Capability Specification

## ADDED Requirements

### Requirement: Database search
The system SHALL search the local database for books matching the user's query by title, author, ISBN, publisher, description, or categories.

#### Scenario: Search by title
- **WHEN** user enters a book title in the search bar
- **THEN** the system returns books from the database matching the title (case-insensitive, partial match)
- **AND** results are sorted by relevance (exact match > starts with > contains)

#### Scenario: Search by author
- **WHEN** user enters an author name in the search bar
- **THEN** the system returns books from the database matching the author name
- **AND** results include books with content warnings if severity filters allow

#### Scenario: Search by ISBN
- **WHEN** user enters a valid ISBN in the search bar
- **THEN** the system returns the book with that ISBN if it exists in the database
- **AND** if not found, the system indicates the ISBN was not found

### Requirement: External API search fallback
The system SHALL search external APIs (Google Books) when database search returns no results or very few results (< 3 matches).

#### Scenario: External search when no database results
- **WHEN** user searches for a book title that doesn't exist in the database
- **AND** database search returns zero results
- **THEN** the system queries Google Books API using title/author search
- **AND** returns up to 10 external API results with book metadata (title, author, ISBN, cover, description preview)

#### Scenario: External search with partial database results
- **WHEN** user searches for a book title
- **AND** database search returns 1-2 results
- **THEN** the system also queries Google Books API to find additional matches
- **AND** combines database results with external API results (database results shown first)

#### Scenario: External search rate limiting
- **WHEN** Google Books API returns a rate limit error (429)
- **THEN** the system returns database results only
- **AND** logs a warning message
- **AND** does not show an error to the user

#### Scenario: External search API failure
- **WHEN** Google Books API request fails (network error, timeout, etc.)
- **THEN** the system returns database results only
- **AND** logs the error
- **AND** search continues to function normally

### Requirement: External result filtering
The system SHALL filter external API results to exclude books already in the database.

#### Scenario: Duplicate filtering
- **WHEN** external API search returns a book with ISBN that already exists in the database
- **THEN** the system excludes that book from external results
- **AND** only shows the database version (which has warnings and full metadata)

### Requirement: Search result display
The system SHALL display search results with clear distinction between database results and external API results.

#### Scenario: Database results display
- **WHEN** search returns books from the database
- **THEN** results show book cover, title, author, and content warning summary
- **AND** clicking a result navigates to the book detail page

#### Scenario: External API results display
- **WHEN** search returns books from external APIs
- **THEN** results show book cover, title, author, and description preview (truncated to 100 characters)
- **AND** results are visually distinct (muted background, different styling)
- **AND** each result has a "Scan this book" button instead of direct navigation
- **AND** clicking "Scan this book" navigates to scan page with ISBN pre-filled

#### Scenario: Combined results display
- **WHEN** search returns both database and external API results
- **THEN** database results are shown first
- **AND** a visual separator indicates external API results section
- **AND** external results are clearly labeled as "Not yet scanned"

### Requirement: Scan prompt for external results
The system SHALL provide a clear path to scan books found via external API search.

#### Scenario: Scan prompt navigation
- **WHEN** user clicks "Scan this book" button on an external API result
- **THEN** the system navigates to `/scan?isbn={isbn}` with the ISBN pre-filled
- **AND** user can immediately trigger a scan to add the book to the database

#### Scenario: ISBN pre-fill
- **WHEN** user navigates to scan page from external search result
- **THEN** the ISBN input field is pre-populated with the book's ISBN
- **AND** user can modify or confirm the ISBN before scanning
