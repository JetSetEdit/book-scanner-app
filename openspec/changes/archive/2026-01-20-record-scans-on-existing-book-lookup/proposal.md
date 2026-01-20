# Change: Record a scan when user looks up an existing, already-analyzed book

## Why

"Recently Scanned" on the homepage does not update when users re-scan a book that already exists and has been analyzed, because the scan service returns early and never inserts into `scans`. That makes the section feel stale and underrepresents real lookup activity.

## What Changes

- In `lib/services/scan-service.ts`, when the "existing book, already analyzed" early return is taken, insert a row into `scans` (isbn, book_id) before returning. Use the same non-fatal pattern as the main scan insert: on success use the inserted row for the `scan` field in the return; on failure log and use a synthetic `{ id: 'existing', isbn }` so behaviour stays backward-compatible.
- No change to `/api/recent-scans` or `RecentScans`; deduplication by ISBN and the 10-item cap already apply. Re-lookups will refresh the "most recent scan" for that ISBN.

## Impact

- Affected specs: `recent-scans` (new capability)
- Affected code: `lib/services/scan-service.ts` (early-return block ~685–720)
- Trade-off: more rows in `scans` from re-lookups; acceptable because the table is append-only, the recent-scans API already dedupes by ISBN, and the gain in homepage freshness justifies it.
