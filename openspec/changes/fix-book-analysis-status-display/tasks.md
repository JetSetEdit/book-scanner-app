# Tasks: Fix book analysis status display

## 1. Implementation

- [x] 1.1 In `app/book/[isbn]/page.tsx`, set analysis status to "complete" when there is at least one audit log (decision_type `warnings_generated` or `no_warnings`) for the book OR when the warnings array returned from `getWarningsForBookExcludingAppeals` has length > 0. Use `hasAnalysisCompleted = hasAuditLog || (warnings && warnings.length > 0)` and derive `analysisStatus` from that (no reliance on `source === 'ai_generated'` for the warnings branch).
- [x] 1.2 Add a short comment at the computation site documenting that "any warnings" (not only ai_generated) is intentional so legacy or mixed-source books show as analyzed.

## 2. Verification

- [x] 2.1 Manually verify: open a book that has content warnings but previously showed "not analyzed" (e.g. legacy source or missing audit log) and confirm it now shows as analyzed (e.g. "No content warnings" or warning list, not "Content not yet analysed").
- [x] 2.2 Confirm books with no audit log and no content warnings still show "Content not yet analysed".
