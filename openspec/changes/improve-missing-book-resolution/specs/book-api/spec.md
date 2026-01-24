## ADDED Requirements

### Requirement: Search books by title and author
The system SHALL provide a function to search for books using title and author when ISBN search fails.

#### Scenario: Title/author search finds book with matching ISBN
- **WHEN** `fetchByTitleAuthor(isbn, title, author)` is called with a valid ISBN hint, title, and author
- **AND** Google Books API returns a book matching the title and author
- **AND** the returned book has an ISBN matching (or close to) the provided ISBN hint
- **THEN** the function SHALL return the book data with full metadata (title, author, description, cover, etc.)
- **AND** the returned ISBN SHALL match the provided ISBN hint (after normalization)

#### Scenario: Title/author search finds book but ISBN doesn't match
- **WHEN** `fetchByTitleAuthor(isbn, title, author)` is called
- **AND** Google Books API returns a book matching title/author but with different ISBN
- **THEN** the function SHALL return null (don't return books with mismatched ISBNs)
- **AND** the function SHALL log a warning about the ISBN mismatch

#### Scenario: Title/author search returns no results
- **WHEN** `fetchByTitleAuthor(isbn, title, author)` is called
- **AND** Google Books API returns no matching books
- **THEN** the function SHALL return null
- **AND** the function SHALL not throw an error

## ADDED Requirements

### Requirement: ISBN format conversion and retry
The system SHALL automatically retry book searches with alternative ISBN formats when initial search fails.

#### Scenario: ISBN-13 search fails, retry with ISBN-10
- **WHEN** a book search is performed with an ISBN-13 (e.g., 9781761420597)
- **AND** the initial search returns no results
- **THEN** the system SHALL convert the ISBN-13 to ISBN-10 format
- **AND** the system SHALL retry the search with the converted ISBN-10
- **AND** if the retry succeeds, the system SHALL return the found book data

#### Scenario: ISBN-10 search fails, retry with ISBN-13
- **WHEN** a book search is performed with an ISBN-10
- **AND** the initial search returns no results
- **THEN** the system SHALL convert the ISBN-10 to ISBN-13 format
- **AND** the system SHALL retry the search with the converted ISBN-13
- **AND** if the retry succeeds, the system SHALL return the found book data

#### Scenario: Both ISBN format searches fail
- **WHEN** both original and converted ISBN searches fail
- **THEN** the system SHALL return null (no book found)
- **AND** the system SHALL not throw an error

## MODIFIED Requirements

### Requirement: Resolve user-reported missing books
The resolve-by-adding-book endpoint SHALL attempt enhanced search strategies before creating a minimal book entry.

#### Scenario: Resolve with ISBN format retry success
- **WHEN** an admin resolves a user-reported missing book
- **AND** the initial ISBN search fails
- **THEN** the endpoint SHALL retry with converted ISBN format
- **AND** if the retry finds the book, the endpoint SHALL use the found metadata (description, cover, etc.)
- **AND** the endpoint SHALL create the book with full metadata instead of minimal entry

#### Scenario: Resolve with title/author search success
- **WHEN** an admin resolves a user-reported missing book
- **AND** both original and converted ISBN searches fail
- **AND** the report includes user-provided title and author
- **THEN** the endpoint SHALL attempt title/author search
- **AND** if title/author search finds a book with matching ISBN, the endpoint SHALL use that metadata
- **AND** the endpoint SHALL create the book with full metadata

#### Scenario: Resolve with all searches failing
- **WHEN** an admin resolves a user-reported missing book
- **AND** all search strategies (ISBN, converted ISBN, title/author) fail
- **THEN** the endpoint SHALL fall back to creating book with user-provided data (current behavior)
- **AND** the endpoint SHALL still create the book and trigger scan
- **AND** the resolution notes SHALL indicate that enhanced search was attempted but failed
