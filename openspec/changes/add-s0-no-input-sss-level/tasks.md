# Tasks: Add S0_NO_INPUT and fix comfort-by-default

## 1. Taxonomy and types

- [x] 1.1 Extend `SSSLevel` in `lib/services/sss-assignment.ts` to include `'S0_NO_INPUT'`. Update `SSSAssignmentResult`, `VALID_LEVELS`, and `parseResponse()` (or validation) so `S0_NO_INPUT` is accepted.
- [x] 1.2 Update `types/supabase.ts`: add `S0_NO_INPUT` to `books.sss_level` Row, Insert, and Update types.

## 2. Database

- [x] 2.1 Add migration to allow `S0_NO_INPUT` in `books.sss_level`: drop the existing CHECK constraint (if any) and add a new one that includes `'S0_NO_INPUT'`, or alter the column constraint. Update column comment to mention S0.

## 3. SSS agent (prompt and behaviour)

- [x] 3.1 In `lib/services/sss-assignment.ts`, update `SSS_ASSIGNMENT_SYSTEM_PROMPT`: add S0 to the band definitions ("S0_NO_INPUT: Use only when there is effectively no information to assess emotional intensity (no description, no warnings, and no external context).") and add a triage note that if there is no meaningful information, assign S0_NO_INPUT with a note explaining that emotional intensity could not be assessed.
- [x] 3.2 Ensure the prompt's output-format line and any validation accept `S0_NO_INPUT` for `sss_level`.

## 4. Scan pipeline (when to set S0)

- [x] 4.1 In `lib/services/scan-service.ts`, after `analyzeBookWithMultiModel()` (and where you have `analysisResult`, `descriptionForAnalysis`, `enrichmentCombinedText`): compute `hasAnyInput = (descriptionForAnalysis?.trim().length > 0) || (enrichmentCombinedText?.trim().length > 0)`.
- [x] 4.2 In the branch where `analysisResult.warnings.length === 0`: if `!hasAnyInput`, do not call `assignSSS()`. Set `sssResult = { sss_level: 'S0_NO_INPUT', sss_notes: '...' }` (using `S0_NO_INPUT_SSS_RESULT` from sss-assignment) and persist that to `books`. Otherwise call `assignSSS()` as today with `sssDescription` and persist its result.
- [x] 4.3 Apply the same S0-vs-call-assignSSS logic in any other code path that assigns SSS when there are zero warnings (single no-warnings branch updated).

## 5. Frontend: SSS pill and filters

- [x] 5.1 In `components/book-details.tsx` (and any other place that renders the SSS pill): when `book.sss_level === 'S0_NO_INPUT'`, show a neutral label (e.g. "Not yet assessed") and neutral/grey styling; show `book.sss_notes` in the tooltip.
- [x] 5.2 In `components/collection-filters.tsx`: add S0 to the SSS filter list ("S0 – No rating" / "Not yet assessed"); filter counts and URL params handle S0.
- [x] 5.3 In `app/collection/page.tsx`: ensure filtering and filter counts include `S0_NO_INPUT` when present.

## 6. Tests

- [x] 6.1 Add or extend test: when the pipeline has `warnings.length === 0`, no description, and no enrichment, assert that the SSS result used is `sss_level === 'S0_NO_INPUT'` and `sss_notes` includes "could not be assessed" (via `S0_NO_INPUT_SSS_RESULT` and `lib/services/__tests__/sss-s0-no-input.test.ts`).
- [x] 6.2 Regression: assignSSS with empty warnings returns S1_GENTLE; pipeline uses S0 only when `!hasAnyInput` (unit test in sss-s0-no-input.test.ts).

## 7. Data migration (optional)

- [ ] 7.1 Write a one-off script: select books where (content_warnings count = 0 or equivalent), `sss_level = 'S1_GENTLE'`, and no-warnings reasoning matches "no description or external context"; update to `sss_level = 'S0_NO_INPUT'` and set `sss_notes` to the standard S0 message. Document in a script or docs; run only if desired.
