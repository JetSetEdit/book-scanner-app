# Design: SSS assignment agent

## Context

- **SSS** (Subtext Suitability Scale): reader-focused emotional intensity rating. Four levels: S1_GENTLE, S2_MILD, S3_MODERATE, S4_INTENSE. Stored on `books` as `sss_level` and `sss_notes`. It is **assigned** from judgment about “how intense the reading experience will feel,” not derived from a numeric formula or ACB rating.
- **Content warnings**: Produced by the existing multi-model/content-warning pipeline (taxonomy-based, severity-computed). Warnings describe what content is present (categories, severity, presence, detail_level, reasoning).
- **Gap**: No automated step today assigns SSS from warnings; `sss_level`/`sss_notes` are only set manually or left null.

## Goals / Non-Goals

- **Goals**: One dedicated SSS assignment step (agent or service) that (1) takes content warnings (and optionally book metadata), (2) applies a documented triage process (themes → explicitness/frequency → emotional-load band → notes), (3) returns `sss_level` and `sss_notes`; optionally persist to `books` in the scan flow.
- **Non-Goals**: Changing how content warnings are generated; deriving SSS from ACB or a single numeric score; replacing human curation where manual override is desired.

## Decisions

### 1. Separate SSS agent vs. extending content-warning agent

- **Decision**: Implement SSS assignment as a **separate** module (e.g. `lib/services/sss-assignment.ts` or dedicated agent file). It consumes the **output** of the content-warning pipeline (warnings + metadata) and produces `sss_level` + `sss_notes`. Do not extend `lib/content-warning-agent.ts` with SSS logic; that agent stays focused on taxonomy and evidence-based warnings.
- **Rationale**: SSS is a different concern (reader emotional load) and a different output shape; keeping it separate preserves single responsibility and allows different prompting and evaluation.

### 2. Triage process (encoded in spec and prompts)

- **Decision**: The SSS step SHALL follow a documented triage: (1) Identify major sensitive themes from warnings (violence, SA, self-harm, suicide, bigotry, etc.) and note whether they are referenced vs on-page. (2) Gauge explicitness and frequency (mild references vs graphic/sustained). (3) Assign band by emotional load: S1 = gentle/mostly off-page; S2 = noticeable but not overwhelming; S3 = clear on-page, multiple or heavy tone; S4 = graphic, prolonged, or very activating. (4) Write short `sss_notes` justifying the level (e.g. “S3_MODERATE – multiple on-page scenes of domestic violence, emotionally intense but not graphic.”).
- **Rationale**: Matches the user-described process and keeps assignment auditable and consistent.

### 3. When SSS runs and persistence

- **Decision**: SSS assignment runs **after** content warnings are available for the book (e.g. after `analyzeBookWithMultiModel` returns, using its warnings and book metadata). Optionally persist `sss_level` and `sss_notes` to `books` in the same scan flow when warnings are saved; if not persisted automatically, the step still returns values for use by an admin or later job.
- **Rationale**: SSS depends on warnings; running after analysis avoids duplicate analysis and keeps the pipeline order clear.

### 4. Model and interface

- **Decision**: The SSS step MAY use the same model(s) as the rest of the pipeline (OpenAI/Gemini) or a single model; the interface SHALL accept structured inputs (warnings array, title, author, description) and return `{ sss_level, sss_notes }`. Implementation may be LLM-based (prompt that encodes the triage) or rule-based; the spec constrains behavior, not implementation.
- **Rationale**: Allows either a small LLM call with a focused prompt or a deterministic scorer; both can satisfy the triage requirements.

## Risks / Trade-offs

- **Subjectivity**: SSS is inherently subjective. Mitigation: clear bands and triage steps; short reasoning in `sss_notes`; optional human override or review for high-traffic books.
- **Warnings missing or thin**: If there are no warnings or very few, SSS may still be assigned (e.g. S1 or S2) based on metadata; the step SHALL define behavior when warnings are absent or sparse.

## Migration Plan

- New code only; no schema change (columns already exist). Optional: backfill `sss_level`/`sss_notes` for existing books in a separate script using the new agent.

## Open Questions

- None for the proposal scope. Implementation may choose LLM vs rule-based and exact placement in scan-service.
