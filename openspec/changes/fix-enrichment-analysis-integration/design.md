# Design: Enrichment → analysis integration and needs-review

## Context

- Enrichment currently runs *after* the first Gemini/OpenAI pass. When description is empty, the first pass sees no text and often returns zero warnings; then enrichment runs and a second pass uses enriched metadata. The second pass can still return zero warnings (e.g. model behaviour or prompt limits), and we do not distinguish that case from “genuinely no content to warn about.”
- Scan-service passes `descriptionForAnalysis` to analysis and to SSS; when that is empty and enrichment lives inside multi-model-analysis, SSS never sees enrichment text.
- There is no persisted “needs review” flag today; adding it requires a storage decision (book-level vs scan/audit).

## Goals / Non-Goals

- **Goals**: (1) Enrichment text reliably influences analysis (first or second pass). (2) Only short-circuit when there is neither description nor enrichment. (3) When enrichment was used but warnings are zero, set and persist `needsReview`. (4) SSS receives enrichment as description fallback when description is empty. (5) Regression tests for these behaviours.
- **Non-Goals**: Changing enrichment sources or TOS policy; implementing the “Needs review” UI (can follow in a later change); changing severity or taxonomy rules.

## Decisions

### 1. Enrichment result type

- **Decision**: Enrichment SHALL return a type that includes `combinedText` (or equivalent) and `hadResults` (boolean). Existing `EnrichmentResult` uses `enrichedContext` and `foundContentWarnings`; we SHALL add or alias `combinedText` and `hadResults` so analysis and scan-service can use them consistently. No breaking change to existing callers if we add fields and set `hadResults = !!enrichedContext`, `combinedText = enrichedContext ?? ''`.

- **Alternatives considered**: Keep only `enrichedContext` / `foundContentWarnings` and use those names everywhere — rejected to match the user’s requested naming and avoid confusion with “found content warnings” (which is about indicators in snippets) vs “had results” (we got any enrichment text).

### 2. When enrichment runs relative to first analysis

- **Decision**: Prefer **enrichment-before-first-analysis** when description is missing or minimal (e.g. Quick scan with thin metadata). In that case, run enrichment once upfront, build `inputText = baseDescription + enrichment.combinedText`, and run the first Gemini/OpenAI pass with that input. This avoids “first pass sees empty → 0 warnings → second pass sees enrichment” and makes enrichment directly influence the primary analysis. Existing “enrichment after first pass” can remain for the “few warnings but generic” path (e.g. add more warnings from community context).

- **Alternatives considered**: Only ever run enrichment after first pass and fix the second pass — keeps current order but does not fix the case where the first pass short-circuits or the second pass still returns 0; rejected in favour of making enrichment visible to the first pass when we have no description.

### 3. Short-circuit condition

- **Decision**: Replace “no description → return zero warnings” with “no analysable input → return zero warnings”: i.e. only short-circuit when `!description?.trim() && !enrichment?.hadResults`. When enrichment has results, proceed to full analysis with `inputText` built from enrichment (and description if any).

### 4. Needs-review flag

- **Decision**: Set `needsReview: true` when `enrichment?.hadResults === true` and `analysisResult.warnings.length === 0`. Persist this at book level (e.g. `books.content_warnings_needs_review` or `books.needs_review`) or in the audit/scan result so the UI can show a “Needs review” state later. Exact column/field is implementation detail; design requires that the flag is stored and available for the API/UI.

- **Alternatives considered**: Store only in audit log — possible but harder for UI to query; prefer a book-level or scan-result field for easy reads.

### 5. SSS description fallback

- **Decision**: At the assignSSS call site(s), build `sssDescription = description || enrichment?.combinedText || \`${title} by ${author}\`` and pass `sssDescription` as `description` to `assignSSS`. No change inside `assignSSS` logic; only the caller supplies the fallback so SSS sees enrichment context when warnings are zero.

## Risks / Trade-offs

- **Upfront enrichment for thin metadata**: May add latency when description is empty (one extra web search before analysis). Mitigation: only run upfront when description is missing or below a length threshold; keep existing “enrich after first pass” for other cases.
- **needs_review storage**: Adding a column or field requires a small migration or schema change. Mitigation: document in tasks; use a boolean column with a clear name to avoid confusion with “manual review” queues.

## Migration Plan

- Add enrichment fields (`combinedText`, `hadResults`) and optional upfront enrichment path; change short-circuit and analysis input building; add `needsReview` to analysis return and persist it; pass enrichment to SSS at call site. No data migration for existing books; new scans will set the flag when applicable. Rollback: revert code; optional DB column can be left unused or dropped in a follow-up migration.

## Open Questions

- None blocking; exact DB column name and UI treatment can be decided in implementation.
