## ADDED Requirements

### Requirement: Pipeline assigns S0_NO_INPUT when there is no analysable input

The scan pipeline SHALL assign `sss_level: 'S0_NO_INPUT'` and a fixed `sss_notes` message when the analysis produced zero content warnings and there was no usable input to assess (no book description and no enrichment from community sources). In this case the pipeline SHALL NOT call the SSS assignment model; it SHALL set the result directly and persist to the book. When there is any usable input (non-empty description or enrichment or non-zero warnings), the pipeline SHALL call the SSS assignment step as usual and persist S1–S4 (or model default).

#### Scenario: Zero warnings and no description and no enrichment

- **GIVEN** the analysis result has `warnings.length === 0`
- **AND** there is no book description (or it is empty/whitespace)
- **AND** enrichment did not produce any combined text (`!enrichment?.hadResults` or equivalent)
- **WHEN** the scan pipeline assigns SSS for this book
- **THEN** it does not call `assignSSS()`
- **AND** it sets `sss_level` to `'S0_NO_INPUT'` and `sss_notes` to a message explaining that emotional intensity could not be assessed (e.g. "No description or community content warnings were available, so emotional intensity could not be assessed.")
- **AND** these values are persisted to `books.sss_level` and `books.sss_notes`

#### Scenario: Zero warnings but description or enrichment present

- **GIVEN** the analysis result has `warnings.length === 0`
- **AND** either the book has a non-empty description or enrichment produced combined text
- **WHEN** the scan pipeline assigns SSS
- **THEN** it calls `assignSSS()` with the best available description/enrichment
- **AND** it persists the returned `sss_level` (S1–S4) and `sss_notes`; it does not set S0_NO_INPUT

---

### Requirement: SSS level type and persistence include S0_NO_INPUT

The system SHALL treat `S0_NO_INPUT` as a valid SSS level. The type for `sss_level` SHALL include `S0_NO_INPUT` in addition to S1_GENTLE, S2_MILD, S3_MODERATE, S4_INTENSE. The database SHALL allow storing `S0_NO_INPUT` in `books.sss_level` (constraint or enum updated as needed). The SSS assignment prompt SHALL document S0_NO_INPUT for use when there is effectively no information to assess; the pipeline is responsible for assigning S0 without calling the model.

#### Scenario: S0_NO_INPUT can be stored and read

- **GIVEN** the pipeline has set `sss_level: 'S0_NO_INPUT'` for a book
- **WHEN** the result is written to the database and later read
- **THEN** no constraint or type error occurs
- **AND** the UI and API can read and display S0_NO_INPUT correctly
