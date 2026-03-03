# Tasks: Add scan failure observability

## 1. Structured logging

- [x] 1.1 In `lib/services/scan-service.ts`, when returning the "book not found in any external library" result (no `bookData`), emit a single log line with a stable, searchable prefix (e.g. `[Scan] book_not_found`), the ISBN, and `pipelinePath: 'not_found'` (or equivalent). Keep or retain existing `console.log` only if the new line satisfies the requirement; prefer one line so Vercel log search can find it without truncation.
- [x] 1.2 Ensure the log line does not include PII or secrets; ISBN and pipeline path only.

## 2. Troubleshooting documentation

- [x] 2.1 In `docs/SCAN_TROUBLESHOOTING.md`, add a section for "Book not found in any external library" that explains: (a) cause – Open Library and Google Books both returned no data for that ISBN; (b) required production env – e.g. `GOOGLE_BOOKS_API_KEY` (and that Open Library is keyless); (c) how to check production logs – Vercel dashboard Logs, or Vercel CLI `vercel env ls`, or Vercel MCP `get_runtime_logs` with projectId/teamId from `.vercel/project.json`.
- [x] 2.2 Optionally add a known-good test ISBN (e.g. 9780593356159) for quick verification.

## 3. Validation

- [x] 3.1 Run `openspec validate add-scan-failure-observability --strict --no-interactive` and fix any issues.
- [x] 3.2 Manual check: trigger a not-found scan (invalid or uncatalogued ISBN) and confirm the new log line appears in local logs; confirm doc is readable and accurate.
