# Change: Add SSS assignment agent

## Why

The Subtext Suitability Scale (SSS) is a **reader-focused** emotional intensity rating (S1–S4) that is **assigned**, not calculated numerically, and is independent of legal/ACB classification. Today the database has `sss_level` and `sss_notes` on `books`, and the UI displays them, but nothing in the analysis pipeline assigns SSS. To produce consistent, defensible SSS values we need a dedicated step—an SSS-specific agent or service—that takes existing content warnings and book metadata, applies a clear triage process (themes → explicitness/frequency → emotional-load band → short reasoning note), and outputs `sss_level` and `sss_notes` for persistence.

## What Changes

- Introduce an **SSS assignment** capability: a dedicated agent or service step that:
  - Consumes: content warnings (and optionally book metadata) produced by the existing content-warning pipeline.
  - Applies a reader-focused triage: identify major sensitive themes; gauge explicitness and frequency (on-page vs implied, brief vs sustained); assign one of S1_GENTLE, S2_MILD, S3_MODERATE, S4_INTENSE by “emotional load”; write a short `sss_notes` justification.
  - Outputs: `sss_level` and `sss_notes` in a form that can be persisted to `books`.
- Integration: the SSS step runs after content warnings are available (e.g. after multi-model analysis, before or after saving warnings). Optionally persist `sss_level` and `sss_notes` to `books` in the same scan flow.
- No change to how content warnings are generated; the content-warning agent remains focused on taxonomy-based warnings. SSS assignment is a separate, reader-experience layer.

## Impact

- **Affected specs**: `sss-assignment` (new capability).
- **Affected code**: New module (e.g. `lib/services/sss-assignment.ts` or `lib/sss-agent.ts`); optional integration in `lib/services/scan-service.ts` and/or `lib/services/multi-model-analysis.ts`; possibly `lib/content-warning-agent.ts` only if we extend it (prefer separate module).
