## 1. Triage and visibility

- [x] 1.1 **GET /api/admin/manual-handling-scans**: Add optional query params `reason` and `user_reported_only`. If `reason` is set, filter `.eq('reason', reason)`. If `user_reported_only=true`, restrict to `reason=not_found` and `(metadata->>source = 'user_report' or metadata->>user_reported = 'true')` (use Supabase `.eq()` + `.or()` or equivalent; if not expressible cleanly, filter in memory after fetch with a reasonable limit).
- [x] 1.2 **GitHub Actions** (`.github/workflows/manual-handling-notifications.yml`): In the `not_found` case, if `scan.metadata?.source === 'user_report'` or `scan.metadata?.user_reported` or `scan.metadata?.user_provided_title`, add to the issue body: a "**User-Reported:** Yes" line and "**User-Provided Title:**", "**User-Provided Author:**", "**Additional Info:**" from `metadata`. Add a checklist item: "Resolve via POST /api/admin/manual-handling-scans/resolve-by-adding-book with body {\"id\": \"<scan.id>\"} (if title/author provided)".

## 2. Resolve-by-adding-book endpoint

- [x] 2.1 Create `app/api/admin/manual-handling-scans/resolve-by-adding-book/route.ts`. Implement `POST` with JSON body `{ id: string }`. Apply the same admin gating as `PATCH /api/admin/manual-handling-scans` (or add `x-admin-secret` / `Authorization` if none exists; document in MANUAL_HANDLING_SETUP).
- [x] 2.2 In the handler: fetch `manual_handling_scans` by `id`. If missing → 404. If `reason !== 'not_found'` or `status !== 'pending'` → 400. If not user-report (no `metadata.source=user_report` or `user_reported` or `user_provided_title`) → 400.
- [x] 2.3 Normalize ISBN with `normalizeISBN`; if invalid or empty → 400. Check `books` for existing `isbn`; if exists → 409.
- [x] 2.4 Insert `books`: `isbn`, `title = metadata.user_provided_title || 'Unknown'`, `author = metadata.user_provided_author || null`, `description = null`. For `cover_url`: try `https://covers.openlibrary.org/b/isbn/{isbn}-L.jpg` (validate with a HEAD or small GET; if 404 or non-image, set `null`). Set `created_at`/`updated_at` as needed.
- [x] 2.5 Trigger scan for `isbn`: call the same scan entry used by `/api/scan-isbn` (e.g. `runScan` from `scan-service`) with `isbn` and `forceRefresh=false`. If it throws, still resolve the manual_handling_scan and set `resolution_notes` to include "Scan failed: <message>". On success, note "Scan triggered" in `resolution_notes`.
- [x] 2.6 Update `manual_handling_scans`: `status=resolved`, `resolved_at=now()`, `resolution_notes="Added book from user report; book_id=<id>. Scan triggered."` (or scan error). Return `{ ok: true, book_id, isbn, scan_triggered: true }` or `{ ok: true, book_id, isbn, scan_triggered: false, scan_error }`.

## 3. Documentation and checks

- [x] 3.1 Update `docs/MANUAL_HANDLING_SETUP.md`: document `reason`, `user_reported_only` for GET; document `POST /api/admin/manual-handling-scans/resolve-by-adding-book` with body `{ id }`, when it applies (user-reported not_found), and that it adds the book and triggers a scan. Mention admin gating.
- [x] 3.2 Manually test: (1) GET with `?reason=not_found` and `?user_reported_only=true`; (2) POST resolve-by-adding-book for the existing user report 9781761420597 (or a test user-report row). Confirm `books` row exists, `manual_handling_scans` is resolved, and a scan runs (or a clear `scan_error` if services fail).

## 4. Optional (if time)

- [ ] 4.1 In `lib/book-api.ts`, add `fetchByTitleAuthor(isbnHint: string, title: string, author: string): Promise<BookData | null>` (Google Books `intitle:`+`inauthor:`, match `industryIdentifiers` to `isbnHint`). In resolve-by-adding-book, when user provided title and author, call it and use the result for `description` and `cover_url` when inserting `books`; fall back to current behavior if null.
