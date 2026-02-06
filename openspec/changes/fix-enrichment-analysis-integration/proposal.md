# Change: Fix enrichment → analysis integration and add safety nets

## Why

When the scan pipeline has thin or empty book descriptions, web-search enrichment can find community content-warning text (e.g. BookTriggerWarnings, StoryGraph CW pages), but that text does not reliably influence the first analysis pass. In addition, when enrichment succeeds yet the model still returns zero warnings (e.g. Under the Whispering Door / Klune), the system treats the result as authoritative (“Comfort Read”) with no signal that the result may need review. This creates false negatives and undermines trust for a commercial launch. Fixing enrichment integration and adding a “needs review” safety net will reduce this class of miss and make zero-warning outcomes safer when enrichment was used.

## What Changes

- **Enrichment result shape**: Web-search enrichment SHALL return a consistent result type that includes a combined text field and a “had results” flag so callers can build analysis input and guard short-circuits.
- **Analysis input**: The content-warning analysis SHALL use enrichment text when available: the input to Gemini/OpenAI SHALL be built from base description plus enrichment combined text (when enrichment succeeded), not description alone.
- **Short-circuit guard**: The “no description → no warnings” early exit SHALL be replaced with “no description and no enrichment” so that when enrichment provides context, full analysis runs.
- **Needs-review safety net**: When enrichment was used and the analysis still returns zero warnings, the result SHALL be marked `needsReview` and this flag SHALL be persisted (e.g. on the book or scan) so the UI can show a “Needs review” signal instead of treating S1_GENTLE as authoritative.
- **SSS description fallback**: When assigning SSS (with or without warnings), the description passed to SSS SHALL fall back to enrichment combined text when the book description is empty, so SSS has narrative context (e.g. grief, death) even when warnings are still zero.
- **Regression tests**: Tests SHALL cover (1) enrichment-only book produces warnings, (2) enrichment hits but zero warnings → needsReview, (3) no description and no enrichment → zero warnings with appropriate reasoning and SSS default.

## Impact

- **Affected specs**: New capability `content-warning-analysis` (enrichment integration, analysis input, short-circuit, needs-review, SSS fallback).
- **Affected code**: `lib/services/web-search-enrichment.ts` (result type), `lib/services/multi-model-analysis.ts` (input building, short-circuit, needsReview), `lib/services/scan-service.ts` (persist needsReview, pass enrichment to SSS), `lib/services/sss-assignment.ts` (call-site only: receive description fallback). Optional: DB column or audit field for `needs_review`; UI later for “Needs review” banner.
