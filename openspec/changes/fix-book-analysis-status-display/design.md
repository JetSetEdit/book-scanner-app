# Design: Fix book analysis status display

## Context

The book page shows "Content not yet analysed" when `analysisStatus === 'unknown'` and "No content warnings" or Comfort Read when `analysisStatus === 'complete'` and there are no warnings. The status is computed server-side and passed into `BookDetails`. Incorrect "unknown" status causes confusion when the database actually has warnings or pipeline history for the book.

## Decision: When to treat analysis as complete

Analysis is considered **complete** if either:

1. **Audit log present:** There is at least one row in `ai_audit_logs` for the book with `decision_type` in `['warnings_generated', 'no_warnings']`. This is the authoritative record that the pipeline ran.
2. **Any content warnings returned:** After fetching content warnings and applying appeal suppression (`getWarningsForBookExcludingAppeals`), the list is non-empty. This covers legacy data (warnings with null or non-`ai_generated` source), books that have warnings but lost or never had an audit log, and any future source types.

We do **not** restrict to `source === 'ai_generated'` for the "any warnings" branch, so that legacy or mixed-source books still show as analyzed when they have stored results.

## Edge cases

- **Appeal suppression:** If every warning is under an open appeal (whole-book or all IDs listed), `getWarningsForBookExcludingAppeals` returns `[]`. Then status depends only on audit log. That is correct: we are not showing those warnings, so we avoid implying "analyzed and safe" when the visible set is empty due to appeals.
- **No audit log and no warnings:** Book was never analyzed or scan failed before writing. Showing "not analyzed" is correct.

## Out of scope

- Changing how warnings are fetched or filtered (appeal logic stays as-is).
- Backfilling audit logs (optional operational script; not required for this fix).
