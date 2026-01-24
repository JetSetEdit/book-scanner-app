## ADDED Requirements

### Requirement: Triage user-reported missing books in admin API and GitHub issues

The admin API SHALL support filtering `manual_handling_scans` by `reason` and by user-reported status. The GitHub Actions workflow SHALL surface user-provided title, author, and additional info in the issue body for `not_found` when the row is a user report (`metadata.source=user_report` or has `metadata.user_provided_title`), and SHALL include a clear "User-Reported" marker and an action to resolve via the resolve-by-adding-book endpoint.

#### Scenario: GET with reason and user_reported_only

- **GIVEN** `manual_handling_scans` contains rows with `reason=not_found` and both `metadata.source=user_report` and `metadata.source=scan_service`
- **WHEN** the client requests `GET /api/admin/manual-handling-scans?reason=not_found`
- **THEN** the response contains only rows with `reason=not_found`
- **WHEN** the client requests `GET /api/admin/manual-handling-scans?user_reported_only=true`
- **THEN** the response contains only `not_found` rows where `metadata.source=user_report` or `metadata.user_reported=true` or `metadata.user_provided_title` is present

#### Scenario: GitHub issue for user-reported not_found

- **GIVEN** a pending `manual_handling_scans` row with `reason=not_found`, `metadata.source=user_report`, `metadata.user_provided_title="Someone Else's Bucket List"`, `metadata.user_provided_author="Amy T Matthews"`, `metadata.user_additional_info="Paperback, 400pp"`
- **WHEN** the Manual Handling Notifications workflow runs and creates an issue
- **THEN** the issue body includes a "**User-Reported:** Yes" line
- **AND** the body includes "**User-Provided Title:** Someone Else's Bucket List", "**User-Provided Author:** Amy T Matthews", "**Additional Info:** Paperback, 400pp"
- **AND** the checklist includes an item to resolve via `POST /api/admin/manual-handling-scans/resolve-by-adding-book` with body `{"id":"<scan.id>"}` when title/author are provided

---

### Requirement: Resolve user-reported missing books by adding the book and triggering a scan

An admin-only `POST /api/admin/manual-handling-scans/resolve-by-adding-book` endpoint SHALL accept `{ id: string }` and, for a pending user-reported `not_found` row, SHALL create a `books` row from user-provided title/author, optionally try an Open Library cover by ISBN, trigger a scan for that ISBN, and mark the `manual_handling_scans` row as resolved. The endpoint SHALL enforce admin gating and SHALL return 4xx for invalid id, non–user-report, non-pending, invalid ISBN, or when a book already exists for that ISBN.

#### Scenario: Successful resolve-by-adding-book

- **GIVEN** a pending `manual_handling_scans` row with `reason=not_found`, `metadata.source=user_report`, `metadata.user_provided_title="Someone Else's Bucket List"`, `metadata.user_provided_author="Amy T Matthews"`, `isbn=9781761420597`
- **AND** no `books` row exists for `9781761420597`
- **AND** the request is authorized (admin)
- **WHEN** the client sends `POST /api/admin/manual-handling-scans/resolve-by-adding-book` with body `{ "id": "<that row's id>" }`
- **THEN** a `books` row is created with `isbn=9781761420597`, `title=Someone Else's Bucket List`, `author=Amy T Matthews`, and `cover_url` from a best-effort Open Library cover-by-ISBN check or `null`
- **AND** a scan is triggered for `9781761420597` (in-process or via the same entry as `/api/scan-isbn`)
- **AND** the `manual_handling_scans` row is updated to `status=resolved`, `resolved_at` set, and `resolution_notes` containing "Added book from user report; book_id=..." and "Scan triggered" (or "Scan failed: ..." if the scan throws)
- **AND** the response is `200` with `{ ok: true, book_id: "<uuid>", isbn: "9781761420597", scan_triggered: true }`

#### Scenario: Resolve-by-adding-book when book already exists

- **GIVEN** a pending user-reported `not_found` row for `isbn=9781761420597` and a `books` row already exists for that ISBN
- **WHEN** the client sends `POST /api/admin/manual-handling-scans/resolve-by-adding-book` with body `{ "id": "<that row's id>" }`
- **THEN** the response is `409` with a message indicating the book already exists
- **AND** no new `books` row is created and the `manual_handling_scans` row is not updated

#### Scenario: Resolve-by-adding-book for non–user-report or wrong reason/status

- **GIVEN** a `manual_handling_scans` row with `reason=not_found`, `metadata.source=scan_service` (no user_provided_title)
- **WHEN** the client sends `POST /api/admin/manual-handling-scans/resolve-by-adding-book` with body `{ "id": "<that row's id>" }`
- **THEN** the response is `400` with a message that user-reported title is required
- **AND** no `books` row is created and the row is not updated
- **GIVEN** a row with `reason=analysis_failed` or `status=resolved`
- **WHEN** the client sends the same POST with that `id`
- **THEN** the response is `400` (only pending not_found user reports can be resolved this way)
