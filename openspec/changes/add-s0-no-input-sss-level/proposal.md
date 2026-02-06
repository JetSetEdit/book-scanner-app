# Change: Add S0_NO_INPUT and fix "comfort by default"

## Why

When the scan pipeline has no analysable input (no book description, no enrichment from community sources, and zero content warnings), the system currently assigns S1_GENTLE with a note like "No content warnings; defaulting to low emotional intensity." That presents as "Comfort Read" and implies a real assessment, which is misleading when we had nothing to assess. Adding a distinct **S0_NO_INPUT** level makes "unknown / not yet assessed" explicit and avoids falsely reassuring users.

## What Changes

- **Taxonomy and types**: Extend the SSS level type to include `S0_NO_INPUT`. Update shared types (`types/supabase.ts`, `lib/services/sss-assignment.ts`) and any DB constraint or enum so `S0_NO_INPUT` is a valid stored value.
- **SSS agent**: Update the SSS system prompt to define S0 (use only when there is effectively no information). Ensure `assignSSS()` return type and validation accept `S0_NO_INPUT`. The **pipeline** (not the model) decides when to use S0: when `warnings.length === 0` and no description and no enrichment, skip calling the model and set S0 with a fixed note.
- **Scan pipeline**: In `lib/services/scan-service.ts`, after analysis, compute `hasAnyInput` (description or enrichment). If zero warnings and no input, set `sss_level: 'S0_NO_INPUT'` and `sss_notes` to an explanatory string without calling `assignSSS()`. Otherwise call `assignSSS()` as today.
- **Frontend**: In the SSS pill (book detail and collection), when `sss_level === 'S0_NO_INPUT'`, show a neutral label (e.g. "Not yet assessed" / "No intensity rating") and grey styling; show `sss_notes` in tooltip. In collection SSS filters, either exclude S0 from the S1–S4 list and add an "Include books without ratings" toggle, or add a separate S0 option.
- **Tests**: Add or extend tests so that (1) when description is empty, enrichment had no results, and warnings are zero, the pipeline persists S0_NO_INPUT with notes containing "could not be assessed"; (2) when enrichment or description exists (e.g. Under the Whispering Door), the pipeline does not return S0 and proceeds to full analysis/SSS.
- **Data migration (optional)**: One-off script to set `sss_level = 'S0_NO_INPUT'` (and matching notes) for books that were previously stored as S1_GENTLE with no-warnings reasoning indicating no input.

## Impact

- **Affected specs**: New capability `sss-assignment` (deltas: S0 in type and prompt; pipeline assigns S0 when no input; validation). New or updated capability for **SSS display** (S0 pill and filter behaviour).
- **Affected code**: `types/supabase.ts`, `lib/services/sss-assignment.ts`, `lib/services/scan-service.ts`, `components/book-details.tsx`, `components/collection-filters.tsx`, `app/collection/page.tsx`, DB migration for `books.sss_level` constraint, optional backfill script.
