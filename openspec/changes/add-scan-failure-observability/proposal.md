# Change: Add scan failure observability

## Why

When a scan returns "Book not found in any external library", debugging in production is difficult: Vercel runtime logs truncate messages (e.g. to "[Scan API] Starting scan fo..."), so operators cannot search by outcome or ISBN. The cause (Open Library + Google Books both returning no data) and the steps to verify env and logs are not documented in one place, so resolving issues requires code archaeology.

## What Changes

- **Structured logging** – When the scan service determines that no book data was found from external APIs, the system SHALL emit a single, searchable log line that includes a stable prefix (e.g. `[Scan] book_not_found`), the ISBN, and pipeline path. This allows production log search (Vercel dashboard or MCP `get_runtime_logs` with query) without relying on long truncated messages.
- **Troubleshooting documentation** – The scan troubleshooting doc (e.g. `docs/SCAN_TROUBLESHOOTING.md`) SHALL cover the "Book not found in any external library" case: cause (both Open Library and Google Books returned no data for that ISBN), required production env vars (e.g. `GOOGLE_BOOKS_API_KEY`), and how to check production logs (Vercel dashboard Logs, Vercel CLI `vercel env ls`, or Vercel MCP `get_runtime_logs` with projectId/teamId). No new capability for "runbook" beyond this doc requirement.

## Impact

- **Affected specs:** New capability `scan-observability` (ADDED: structured log on not-found; ADDED: troubleshooting doc content for not-found and production verification).
- **Affected code:**
  - `lib/services/scan-service.ts` – Replace or supplement the existing `console.log('Book not found in external APIs')` with one structured line (prefix + ISBN + pipelinePath).
  - `docs/SCAN_TROUBLESHOOTING.md` – Add section for "Book not found in any external library" (cause, env, how to check logs).
- **Breaking changes:** None.
