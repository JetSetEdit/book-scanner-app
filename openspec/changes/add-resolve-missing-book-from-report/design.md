# Design: Resolve user-reported missing books

## Context

- `manual_handling_scans` has `reason=not_found` from (1) **scan-service** when `book-api` returns no candidates (`metadata.source=scan_service`), and (2) **report-book** when the user submits the "Report Missing Book" form (`metadata.source=user_report`, `metadata.user_provided_title`, `user_provided_author`, `user_additional_info`).
- `GET /api/admin/manual-handling-scans` returns pending rows; no filter by `reason` or user-reported. `PATCH` updates `status`, `resolved_at`, `resolution_notes`. GitHub Actions creates issues for all pending; the `not_found` issue template does not include user-provided title/author.
- `books` requires `isbn`, `title`; `author`, `description`, `cover_url` are optional. We can create a minimal row and rely on a subsequent scan to enrich.

## Goals / Non-Goals

- **Goals**: (1) Triage user-reported `not_found` in the admin API and in GitHub issues. (2) One-click (one API call) resolution for user-reported missing books: add `books` row, trigger scan, mark resolved. (3) Admin endpoints remain gated.
- **Non-Goals**: Resolving system `not_found` (no user title/author) via this flow; that stays as manual DB/scripts. A public "retry with title+author" in the scan flow (we only use title+author in the admin resolve path). Changing `report-book` to auto-add the book before inserting `manual_handling_scans` (we keep the current insert; the fix is in the admin resolution step).

## Decisions

### 1. Admin GET filters

Add optional query params to `GET /api/admin/manual-handling-scans`:

- `reason`: if set, filter `where reason = $reason` (e.g. `not_found`).
- `user_reported_only`: if `true`, filter `where reason = 'not_found' and (metadata->>'source' = 'user_report' or metadata->>'user_reported' = 'true')`. Ignored if `reason` is set to something other than `not_found`.

Implementation: build a Supabase query; add `.eq('reason', reason)` when `reason` is provided; when `user_reported_only=true` use `.eq('reason','not_found').or('metadata->>source.eq.user_report,metadata->>user_reported.eq.true')` or equivalent. (Exact Supabase syntax may vary; we need one `not_found` + `(source=user_report or user_reported=true)`.)

### 2. GitHub Actions: user-reported not_found

In the `not_found` branch of the workflow’s switch, after the existing body:

- If `scan.metadata?.source === 'user_report'` or `scan.metadata?.user_reported === true` or `scan.metadata?.user_provided_title`:
  - Prepend or add a "**User-Reported:** Yes" section.
  - Append: `**User-Provided Title:** ${scan.metadata?.user_provided_title || '—'}\n**User-Provided Author:** ${scan.metadata?.user_provided_author || '—'}\n**Additional Info:** ${scan.metadata?.user_additional_info || '—'}`.
  - Add to the checklist: `- [ ] Resolve via POST /api/admin/manual-handling-scans/resolve-by-adding-book with body { "id": "${scan.id}" } (if user provided title/author)`.

### 3. POST /api/admin/manual-handling-scans/resolve-by-adding-book

- **Auth**: Reuse the same gating as `PATCH /api/admin/manual-handling-scans` (or introduce `x-admin-secret` / `Authorization` if none exists). Reject 401/403 when not allowed.
- **Request**: `POST` with JSON body `{ id: string }`. `id` is the `manual_handling_scans.id` UUID.
- **Steps**:
  1. Fetch the row by `id`. If not found, 404. If `reason !== 'not_found'` or `status !== 'pending'`, 400 with message like "Only pending not_found user reports can be resolved this way."
  2. If `metadata?.source !== 'user_report'` and `metadata?.user_reported !== true` and `!metadata?.user_provided_title`, 400: "User-reported title is required to add the book."
  3. `cleanIsbn = normalizeISBN(isbn)`. If invalid (e.g. `normalizeISBN` returns null or we deem too short), 400.
  4. Select `books` where `isbn = cleanIsbn`. If any row exists, 409 with message "Book already exists for this ISBN."
  5. Insert `books`: `isbn=cleanIsbn`, `title=metadata.user_provided_title || 'Unknown'`, `author=metadata.user_provided_author || null`, `description=null`, `cover_url`: try `https://covers.openlibrary.org/b/isbn/${cleanIsbn}-L.jpg` and validate (HEAD or fetch) that it’s a real image; if not, `cover_url=null`. Other fields null/default.
  6. **Trigger scan**: Call the scan pipeline for `cleanIsbn` (e.g. `runScan` from scan-service or `POST /api/scan-isbn` with `isbn`). Prefer in-process so we can catch immediate errors; if we use an HTTP call, fire-and-forget and note in `resolution_notes` that the scan was triggered. On success, we have a `book_id` from the insert.
  7. Update `manual_handling_scans`: `status=resolved`, `resolved_at=now`, `resolution_notes="Added book from user report; book_id=<uuid>. Scan triggered for analysis."`
  8. Return 200: `{ ok: true, book_id: string, isbn: string, scan_triggered: true }`.
- **Errors**: 4xx/5xx as above; 500 on insert/update/scan failure with safe message.

### 4. Optional: fetchByTitleAuthor in book-api

- New `fetchByTitleAuthor(isbnHint: string, title: string, author: string): Promise<BookData | null>`. Query Google Books `q=intitle:"${title}" inauthor:"${author}"`, take the first result whose `industryIdentifiers` (after `normalizeISBN`) equal `normalizeISBN(isbnHint)`. Map to `BookData` (title, author, description, cover_url, etc.). Return null if none.
- In resolve-by-adding-book, when `metadata.user_provided_title` and `metadata.user_provided_author` exist, call `fetchByTitleAuthor(cleanIsbn, title, author)` first. If non-null, use that for `title`, `author`, `description`, `cover_url` when inserting `books` (overriding with user values only where we prefer user, e.g. always use user title if not empty). If null, fall back to current behavior (user title/author, try OL cover by ISBN, description=null).
- This is **optional** in the first slice; we can ship without it and add later.

### 5. Triggering the scan from resolve-by-adding-book

- **Option A (preferred)**: In the route handler, import and call the scan service’s `runScan` (or equivalent) in-process with `isbn=cleanIsbn`, `forceRefresh=false`. We already have a book; the scan will do lookup (find the new row or by ISBN), then run analysis. We need to confirm the scan service can be invoked from an API route (it is in `/api/scan` or `/api/scan-isbn`). If `runScan` is the right entry, we call it and do not need to hit HTTP.
- **Option B**: `fetch(origin + '/api/scan-isbn', { method: 'POST', body: JSON.stringify({ isbn: cleanIsbn }) })` (or similar). Fire-and-forget; we don’t wait for analysis. Simpler but less visibility on failure.
- **Recommendation**: Use the same entry point as the public scan (e.g. `runScan` used by `/api/scan-isbn`). The handler awaits it; on failure we still mark the manual_handling_scan as resolved (book was added) but set `resolution_notes` to mention "Scan failed: ...". We return 200 with `scan_triggered: true` or `scan_error: string` so the operator knows.

## Risks / Trade-offs

- **User-provided data**: We insert `title`/`author` from the user into `books`. A typo or wrong book is possible. Mitigation: this is an admin-only action; the operator can run resolve-by-adding-book only when they trust the report. We can add an optional `confirm: true` in the body later if we want a second step.
- **Cover by ISBN**: Open Library’s `covers.openlibrary.org/b/isbn/{isbn}-L.jpg` can return a 404 or a placeholder for unknown ISBNs. We validate and set `cover_url=null` if invalid; the scan or a later job can try to improve the cover.
- **Scan failure**: If the scan fails (e.g. rate limit, AI error), the book is still in `books` and the report is resolved. The operator can re-run a scan via the usual UI or scripts.
