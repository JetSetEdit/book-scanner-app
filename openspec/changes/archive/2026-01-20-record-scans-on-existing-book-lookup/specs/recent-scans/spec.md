## ADDED Requirements

### Requirement: Record scan on existing-book lookup

The system SHALL insert a row into the `scans` table when a user completes a scan that takes the "existing book, already analyzed" early return (i.e. the book exists, has an audit log with decision_type in `warnings_generated` or `no_warnings`, and the request is neither `forceRefresh` nor `scanMode === 'deep'`). This ensures "Recently Scanned" on the homepage reflects re-lookups as well as first-time scans. If the insert fails, the system SHALL log the failure and return a synthetic scan object so the response remains valid; the scan SHALL NOT block or fail the request.

#### Scenario: User re-scans an already-analyzed book

- **GIVEN** the book exists in the database with at least one `ai_audit_logs` row (decision_type in `warnings_generated` or `no_warnings`)
- **AND** the request has `forceRefresh === false` and `scanMode !== 'deep'`
- **WHEN** the user completes the scan and the service takes the early return (redirect to book page)
- **THEN** a row is inserted into `scans` with `isbn` and `book_id`
- **AND** the return value includes a `scan` object (the inserted row when successful, or a synthetic `{ id: 'existing', isbn }` on insert failure)
- **AND** the book may appear or refresh its position in "Recently Scanned" subject to `/api/recent-scans` deduplication, cover filter, and limit rules

#### Scenario: Insert fails (e.g. scans table missing or DB error)

- **GIVEN** the conditions for the early return are met
- **WHEN** the insert into `scans` fails (error or exception)
- **THEN** the failure is logged (e.g. `console.warn`) and the request still returns success
- **AND** the `scan` field in the response is a synthetic object `{ id: 'existing', isbn: cleanIsbn }` so clients continue to work

#### Scenario: User scans a new book or existing book without audit log

- **GIVEN** the book does not exist, or it exists but has no `ai_audit_logs` row with decision_type in `warnings_generated` or `no_warnings`, or the request is `forceRefresh` or `scanMode === 'deep'`
- **WHEN** the user completes the scan
- **THEN** the existing behaviour applies: a row is inserted into `scans` only in the main "Record the scan" block at the end of `processIsbnScan`
- **AND** this requirement does not alter those code paths
