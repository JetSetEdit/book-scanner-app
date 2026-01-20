## 1. Implementation

- [x] 1.1 In `lib/services/scan-service.ts`, in the block where we detect "existing book, already analyzed" (existingAuditLog, !forceRefresh, scanMode !== 'deep'), **before** the `return`, attempt an insert into `scans` with `{ isbn: cleanIsbn, book_id: bookId }` and `.select().single()`.
- [x] 1.2 If the insert succeeds, set a local variable (e.g. `scanRecord`) to the inserted row and use it for the `scan` field in the return. If it fails (DB error or exception), log with `console.warn` and use `{ id: 'existing', isbn: cleanIsbn }` for `scan` so the response shape remains backward-compatible.
- [x] 1.3 Reuse the same try/catch and error-handling style as the main "Record the scan" block further down in `processIsbnScan` (lines ~1722–1747) for consistency.

## 2. Verification

- [x] 2.1 Manually: scan an ISBN that already exists and has been analyzed (quick/normal flow). Confirm a new row appears in `scans` for that ISBN and that "Recently Scanned" on the homepage shows or refreshes that book (within cache/poll limits). If the `scans` insert is disabled or fails, confirm the scan still completes and the UI receives a valid response.
