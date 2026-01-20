# recent-scans Specification

## Purpose
TBD - created by archiving change record-scans-on-existing-book-lookup. Update Purpose after archive.
## Requirements
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

### Requirement: Auto-scrolling carousel for Recently Scanned

The "Recently Scanned" row on the homepage SHALL display as a slow auto-scrolling carousel: the list of book covers SHALL move horizontally at a slow speed (on the order of one item every 4–6 seconds, or equivalent) so the section feels dynamic. The motion SHALL loop or reset so it does not permanently stop at the end. The auto-scroll SHALL pause when the user hovers or focuses within the carousel (to allow clicking a book). The auto-scroll SHALL be disabled when the user has `prefers-reduced-motion: reduce`; in that case the row SHALL behave as a static, user-scrollable strip. Manual horizontal scroll (touch, trackpad, or pointer) SHALL remain possible and, when used, may pause or temporarily override the auto-scroll so the user stays in control.

#### Scenario: Default: carousel auto-scrolls

- **GIVEN** the user does not have `prefers-reduced-motion: reduce`
- **AND** "Recently Scanned" has at least one item
- **WHEN** the section is visible
- **THEN** the carousel auto-scrolls horizontally at a slow speed
- **AND** the motion loops or resets so it appears continuous

#### Scenario: Pause on hover or focus

- **GIVEN** the carousel is auto-scrolling
- **WHEN** the user hovers or focuses within the carousel area
- **THEN** the auto-scroll pauses
- **AND** when the user leaves (blur or mouse out), auto-scroll resumes

#### Scenario: prefers-reduced-motion

- **GIVEN** the user has `prefers-reduced-motion: reduce`
- **WHEN** "Recently Scanned" is shown
- **THEN** the carousel does not auto-scroll
- **AND** the row behaves as a static, horizontally scrollable list (same as today)

#### Scenario: User scrolls manually

- **GIVEN** the carousel is auto-scrolling
- **WHEN** the user scrolls horizontally (touch, trackpad, or pointer)
- **THEN** the user can browse the list as today
- **AND** auto-scroll may pause while the user is actively scrolling; the user stays in control

