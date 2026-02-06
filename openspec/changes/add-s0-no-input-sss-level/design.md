# Design: S0_NO_INPUT for "no input" vs "comfort by default"

## Context

- SSS today has four levels (S1–S4). When there are no content warnings, `assignSSS()` is still called with description/enrichment fallback and returns S1_GENTLE with a default note. For books where we had no description and no enrichment (e.g. failed or empty metadata), that still yields S1, which the UI shows as a green "Gentle" pill and reads as a positive assessment.
- The fix is to introduce **S0_NO_INPUT** meaning "we had no information to assess emotional intensity" and use it only when the pipeline has zero warnings and no usable description and no enrichment.

## Goals / Non-Goals

- **Goals**: (1) Clear semantics: S0 = unknown / not assessed, S1–S4 = real judgment. (2) No "comfort by default" when we had zero input. (3) Pipeline decides S0 at the call site; model is not called for S0. (4) UI shows S0 as neutral and distinct from S1–S4. (5) Optional backfill for existing "fake gentle" rows.
- **Non-Goals**: Changing how S1–S4 are assigned; changing content-warning or enrichment logic; changing ACB or other ratings.

## Decisions

### 1. Where S0 is assigned

- **Decision**: S0 is assigned in the **scan pipeline** (scan-service), not by the SSS model. When `warnings.length === 0` and `!hasAnyInput` (no description and no enrichment), the pipeline sets `sss_level: 'S0_NO_INPUT'` and a fixed `sss_notes` string and does **not** call `assignSSS()`. This avoids the model ever being asked to assign a level with no information and keeps the rule explicit in one place.

- **Alternatives considered**: Let the model return S0 when it detects no input — rejected because the pipeline already has definitive signals (description, enrichment, warnings) and can decide without an extra API call.

### 2. DB constraint

- **Decision**: The existing migration `20260206_add_sss_rating.sql` uses `CHECK (sss_level IN ('S1_GENTLE', 'S2_MILD', 'S3_MODERATE', 'S4_INTENSE'))`. A new migration SHALL alter the constraint to include `'S0_NO_INPUT'` so inserts/updates with S0 succeed. No enum type change if the column remains TEXT with CHECK.

### 3. SSS prompt and return type

- **Decision**: Update `SSS_ASSIGNMENT_SYSTEM_PROMPT` to document S0 (use only when there is effectively no information). The pipeline will not call the model for that case, but the prompt stays accurate for documentation and for any future or edge use. The `SSSLevel` type and `VALID_LEVELS` in sss-assignment.ts SHALL include `S0_NO_INPUT`; `assignSSS()` may never return S0 (pipeline sets it), but the type allows it for consistency and for tests that construct S0 results.

### 4. Frontend: S0 pill and filters

- **Decision**: (1) **Pill**: When `sss_level === 'S0_NO_INPUT'`, display a neutral label (e.g. "Not yet assessed" or "No intensity rating") with grey/neutral styling; show `sss_notes` in the tooltip. (2) **Collection filters**: Either (a) exclude S0 from the main S1–S4 checkboxes and add an "Include books without ratings" toggle, or (b) add a separate S0 checkbox. Design leaves the choice to implementation; spec will require that S0 is distinguishable and that filtering behaviour is consistent (e.g. "Include books without ratings" or explicit S0 filter).

### 5. Data migration

- **Decision**: Optional one-off script. Find books where content warnings are empty, `sss_level = 'S1_GENTLE'`, and audit/reasoning indicates "no description or external context"; update those to `S0_NO_INPUT` with the new notes. Not required for the change to be correct; recommended for data hygiene.

## Risks / Trade-offs

- **Existing books**: Without backfill, some books will remain S1_GENTLE even though they had no input. Backfill is optional and can be run after deployment.
- **Filter UX**: Adding S0 as a filter option may dilute the main S1–S4 choices; an "Include books without ratings" toggle keeps the main list to four levels. Implementation can choose.

## Migration Plan

- Add S0 to types and DB constraint; update pipeline to set S0 when no input; update SSS prompt and validation; update UI pill and filters; add tests. Optional: run backfill script. Rollback: revert code and, if needed, migration to drop S0 from constraint (existing S0 rows would need to be set to null or S1 for constraint to hold).

## Open Questions

- None blocking. Filter UX (toggle vs S0 checkbox) can be decided in implementation.
