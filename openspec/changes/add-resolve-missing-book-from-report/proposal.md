# Change: Resolve user-reported missing books by adding the book and triggering a scan

## Why

User-reported "missing book" reports (`reason=not_found`, `metadata.source=user_report`) include title, author, and sometimes extra details. Today we log them and create GitHub issues, but there is no way to **fix** them: we cannot add the book to `books` or trigger a scan from the report. The one such report (9781761420597, "Someone Else's Bucket List") and any future ones stay pending until someone manually edits the DB and runs a scan.

## What Changes

- **Triage and visibility**: Differentiate user-reported missing books from system `not_found`. The admin `GET /api/admin/manual-handling-scans` gains optional `reason` and `user_reported_only` (or equivalent) query params. The GitHub Actions workflow surfaces `metadata.user_provided_title`, `metadata.user_provided_author`, and `metadata.user_additional_info` in the issue body for `not_found` when `metadata.source=user_report`, and adds a clear "User-Reported" marker so these can be prioritized.
- **Resolve-by-adding-book**: New admin-only `POST /api/admin/manual-handling-scans/resolve-by-adding-book` with body `{ id: string }`. For a `manual_handling_scans` row that is `reason=not_found`, `metadata.source=user_report`, `status=pending`:
  1. Validate ISBN (normalize, reject if invalid).
  2. Ensure no `books` row exists for that ISBN.
  3. Create a `books` row: `isbn`, `title` from `metadata.user_provided_title` or fallback `"Unknown"`, `author` from `metadata.user_provided_author`, `description=null`, `cover_url` from a best-effort fetch (`https://covers.openlibrary.org/b/isbn/{isbn}-L.jpg` validated, or null).
  4. Trigger a scan for that ISBN (or return `book_id` and instruct the caller to run a scan; the proposal prefers triggering the scan so the fix is one-step). If "trigger" is async (e.g. fire-and-forget to `/api/scan-isbn` or in-process `runScan`), document that the book will be analyzed shortly.
  5. Update the `manual_handling_scans` row: `status=resolved`, `resolved_at=now`, `resolution_notes` including `"Added book from user report; book_id=...; scan triggered."`.
- **Auth**: The new endpoint and any changed admin routes MUST be gated (e.g. same as existing admin: IP allowlist, `Authorization`/`x-admin-secret` header, or Supabase role). If the current admin routes have no gating, we add a minimum (e.g. `x-admin-secret` or `Authorization: Bearer <secret>`) and document it.
- **Optional—title+author lookup**: If we add `fetchByTitleAuthor(isbnHint, title, author)` to `book-api` that queries Google Books `intitle:... inauthor:...` and returns a candidate whose `industryIdentifiers` match the ISBN, we can use it in resolve-by-adding-book to fill `description` and `cover_url` when the user gave title/author. This improves the created `books` row and the subsequent scan. Mark as optional in tasks; implement only if time allows.

## Impact

- **Affected specs**: `manual-handling` (new capability).
- **Affected code**: `app/api/admin/manual-handling-scans/route.ts` (GET: add `reason`, `user_reported_only`), new `app/api/admin/manual-handling-scans/resolve-by-adding-book/route.ts`, `.github/workflows/manual-handling-notifications.yml` (not_found issue body for user_report), `lib/book-api.ts` (optional `fetchByTitleAuthor`). `docs/MANUAL_HANDLING_SETUP.md` updated with the new endpoint and triage params.
