# Change: Fix book analysis status display

## Why

Some books in the database show "Content not yet analysed" (or "Not analyzed" in lists) even when they have content warnings or have been through the analysis pipeline. This happens when analysis status is derived only from (1) the presence of an `ai_audit_log` row with `decision_type` in `['warnings_generated', 'no_warnings']` and (2) the presence of at least one content warning with `source === 'ai_generated'`. Legacy or migrated data may have warnings with `source` null or different; books may have warnings but no audit log (e.g. backfill not run). The UI should treat a book as analyzed when we have either an audit log or any content warnings for that book (after appeal suppression), so users are not shown "not analyzed" when the system has already produced or stored results.

## What Changes

- **Analysis status rule:** The book page (and any consumer of analysis status for a book) SHALL set status to "complete" when there is at least one relevant `ai_audit_log` row (decision_type `warnings_generated` or `no_warnings`) for that book, OR when there is at least one content warning returned for that book (after excluding warnings under open appeals). Status SHALL be "unknown" only when there is no such audit log and no content warnings returned.
- **Implementation:** The book page data layer (`app/book/[isbn]/page.tsx`) already fetches warnings via `getWarningsForBookExcludingAppeals` and audit logs; it SHALL compute `hasAnalysisCompleted = hasAuditLog || (warnings.length > 0)` (not only `source === 'ai_generated'`) so that books with any stored warnings or an audit log show as analyzed.
- **Edge cases:** Books with all warnings suppressed by an open appeal (whole-book or full list) correctly return zero warnings and, in the absence of an audit log, will continue to show "not analyzed" until the appeal is resolved or an audit log exists.

## Impact

- Affected specs: book-page (new requirement for analysis-status derivation)
- Affected code: `app/book/[isbn]/page.tsx` (analysis status computation)
- No API or schema changes; backfill script `scripts/backfill-missing-audit-logs-for-warnings.ts` remains optional for adding audit logs where missing.
