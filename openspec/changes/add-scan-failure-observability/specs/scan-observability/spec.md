# Scan observability (delta)

## ADDED Requirements

### Requirement: Structured log when book is not found in external APIs

When the scan service determines that no book data was found from external APIs (Open Library and Google Books) and returns the "book not found in any external library" result, the system SHALL emit a single, searchable log line. The log line SHALL include: (a) a stable prefix that can be used for log search (e.g. `[Scan] book_not_found`), (b) the normalized ISBN that was queried, and (c) the pipeline path or outcome (e.g. `not_found`). The log line SHALL NOT include PII beyond the ISBN or any secrets. This enables production log search (e.g. Vercel dashboard or `get_runtime_logs` with a query) to find not-found outcomes without relying on long, truncated messages.

#### Scenario: Not-found result is logged with searchable prefix and ISBN

- **GIVEN** a user scans an ISBN for which both Open Library and Google Books return no book data
- **WHEN** the scan service returns the "book not found in any external library" response
- **THEN** the system emits exactly one log line that contains a stable searchable prefix (e.g. `[Scan] book_not_found`), the ISBN, and the pipeline path or outcome
- **AND** an operator can find this event in production logs by searching for that prefix or the ISBN
- **AND** the log line does not contain secrets or PII other than the ISBN

#### Scenario: Existing manual_handling_scans insert unchanged

- **GIVEN** the same not-found condition
- **WHEN** the scan service returns the not-found response
- **THEN** the existing insert into `manual_handling_scans` (reason `not_found`, isbn, error_message, metadata) SHALL remain as-is
- **AND** the new structured log line is additive and does not replace that insert

---

### Requirement: Scan troubleshooting doc covers not-found and production verification

The scan troubleshooting documentation (e.g. `docs/SCAN_TROUBLESHOOTING.md`) SHALL include a section that describes the "Book not found in any external library" outcome. The section SHALL state: (a) the cause – that both Open Library and Google Books returned no data for the given ISBN; (b) which production environment variables are required for book lookup (e.g. `GOOGLE_BOOKS_API_KEY`; Open Library is keyless); and (c) how to check production logs – at least one of: Vercel dashboard Logs, Vercel CLI (e.g. `vercel env ls` for env names), or Vercel MCP `get_runtime_logs` using projectId and teamId from `.vercel/project.json`. The doc MAY also list a known-good test ISBN for quick verification.

#### Scenario: Operator finds not-found cause and verification steps in doc

- **GIVEN** an operator sees a user report or log indicating "Book not found in any external library"
- **WHEN** they open the scan troubleshooting documentation
- **THEN** they find a section that explains the cause (no data from Open Library and Google Books for that ISBN)
- **AND** they find which env vars to verify (e.g. `GOOGLE_BOOKS_API_KEY`) and how to check production logs (Vercel dashboard, CLI, or MCP)
- **AND** they can act on that without reading the scan-service or book-api source code
