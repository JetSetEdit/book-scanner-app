## MODIFIED Requirements

### Requirement: User feedback submission
The system SHALL accept user feedback submissions via the `/api/feedback` endpoint and store them in the database with complete metadata including ISBN, book context, and page URL information.

#### Scenario: Successful feedback submission with ISBN from URL
- **WHEN** a user submits feedback with a `pageUrl` containing a book ISBN (e.g., `/book/9781234567890`)
- **AND** the book does not exist in the database
- **THEN** the feedback SHALL be saved with the ISBN extracted from the URL
- **AND** the ISBN SHALL be stored in the `isbn` field (not "N/A")

#### Scenario: Feedback submission with invalid URL
- **WHEN** a user submits feedback with an invalid or malformed `pageUrl`
- **THEN** the feedback submission SHALL succeed without crashing
- **AND** the pathname extraction SHALL fall back to string splitting if URL parsing fails
- **AND** the feedback SHALL be saved successfully

#### Scenario: Feedback submission with context ISBN
- **WHEN** a user submits feedback with `context.bookIsbn` provided
- **THEN** the ISBN SHALL be saved from the context
- **AND** if the book exists, book metadata (title, author, book_id) SHALL be populated
- **AND** if the book doesn't exist, the ISBN SHALL still be saved
