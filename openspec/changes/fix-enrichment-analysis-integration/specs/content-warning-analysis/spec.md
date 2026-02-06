## ADDED Requirements

### Requirement: Enrichment result supplies combined text and had-results flag

The web-search enrichment module SHALL return a result that includes a combined text field (e.g. `combinedText`) containing all enrichment content usable as analysis input, and a boolean flag (e.g. `hadResults`) that is true when any enrichment text was produced. Callers SHALL use these to build analysis input and to decide whether to short-circuit or proceed with full analysis.

#### Scenario: Enrichment finds community content warnings

- **GIVEN** enrichment runs for a book with thin or empty description
- **AND** the search returns snippets that contain content-warning phrases (e.g. from BookTriggerWarnings or StoryGraph)
- **WHEN** the enrichment function returns
- **THEN** the result has `hadResults === true` and `combinedText` (or equivalent) set to a non-empty string suitable for appending to analysis input
- **AND** callers can reliably append this to base description for the model

#### Scenario: Enrichment finds no usable content

- **GIVEN** enrichment runs and no safe results or no content-warning indicators are found
- **WHEN** the enrichment function returns
- **THEN** the result has `hadResults === false` and combined text empty or null
- **AND** callers SHALL treat this as “no enrichment” for short-circuit and input-building logic

---

### Requirement: Analysis input includes enrichment text when available

The content-warning analysis SHALL build the input text sent to Gemini/OpenAI from the book description plus enrichment combined text when enrichment succeeded. When enrichment provides combined text, that text SHALL be appended to the base description (or title+author fallback) under a clear “Additional context from community content-warnings and reviews” (or equivalent) label. The model SHALL receive this combined input, not description alone, when enrichment had results.

#### Scenario: First analysis pass receives enrichment when description is empty

- **GIVEN** the book has no or minimal description and enrichment runs (before or as part of analysis) and returns combined text
- **WHEN** the first analysis pass (Gemini or OpenAI) is invoked
- **THEN** the input to the model includes the enrichment text (e.g. base + “Additional context…” + enrichment combined text)
- **AND** the model is not given only an empty or minimal description for that pass

#### Scenario: Analysis uses description only when no enrichment

- **GIVEN** no enrichment was run or enrichment had no results
- **WHEN** the analysis runs
- **THEN** the input is the book description (or title+author fallback) only
- **AND** behaviour remains as today when enrichment is not in use

---

### Requirement: No short-circuit when enrichment supplied context

The pipeline SHALL NOT return zero warnings with “no description” reasoning when enrichment had results. The only acceptable short-circuit for zero warnings due to lack of input SHALL be when there is neither a usable description nor enrichment results (`!description?.trim() && !enrichment?.hadResults`). When enrichment produced combined text, the system SHALL proceed to full analysis with that text.

#### Scenario: Enrichment provided but description empty

- **GIVEN** description is empty or minimal and enrichment returned `hadResults === true` with non-empty combined text
- **WHEN** the analysis pipeline runs
- **THEN** it does not return zero warnings with reasoning that cites only “no description”
- **AND** it runs full analysis using the built input that includes enrichment text

#### Scenario: No description and no enrichment

- **GIVEN** description is empty and enrichment did not run or returned `hadResults === false`
- **WHEN** the analysis pipeline runs
- **THEN** it MAY return zero warnings with reasoning that explains the lack of analysable input (e.g. “No content warnings found because there was no description or external context to analyze”)
- **AND** this is the only case where such short-circuit is acceptable

---

### Requirement: Needs-review when enrichment was used but zero warnings returned

When enrichment was used (enrichment had results) and the analysis result has zero warnings, the result SHALL be marked as needing review (`needsReview: true`). This flag SHALL be persisted (e.g. on the book or scan) so that the UI or API can show a “Needs review” state instead of treating the outcome as authoritative (e.g. S1_GENTLE as definitive).

#### Scenario: Enrichment hit but model returns zero warnings

- **GIVEN** enrichment ran and returned combined text (`hadResults === true`)
- **AND** the analysis (first or second pass) still returns zero warnings
- **WHEN** the analysis result is finalized
- **THEN** the result has `needsReview === true`
- **AND** the scan-service persists this flag so it can be read later (e.g. for UI or audit)

#### Scenario: Enrichment not used or zero warnings with no enrichment

- **GIVEN** either enrichment did not run / had no results, or the analysis returned at least one warning
- **WHEN** the result is finalized
- **THEN** `needsReview` is not set to true (or is false)
- **AND** the result is treated as a normal analysis outcome

---

### Requirement: SSS receives enrichment as description fallback

When assigning SSS (Subtext Suitability Scale), the caller SHALL pass a description that falls back to enrichment combined text when the book description is empty. Thus when warnings are zero but enrichment provided context (e.g. grief, death, emotional themes), SSS SHALL receive that context so it can assign a level and notes that reflect the narrative, not only “no information.”

#### Scenario: Zero warnings but enrichment had context

- **GIVEN** analysis returned zero warnings and enrichment had produced combined text (e.g. community CWs mentioning grief, death)
- **WHEN** assignSSS is called for this book
- **THEN** the `description` argument passed to assignSSS is the enrichment combined text (or description if present), not an empty string
- **AND** SSS can produce sss_level and sss_notes that reflect emotional themes from that context

#### Scenario: No enrichment and no description

- **GIVEN** no description and no enrichment text
- **WHEN** assignSSS is called
- **THEN** the description passed is a fallback such as “{title} by {author}” or empty, and SSS defaults (e.g. S1) with a “no information” style note as today
