## ADDED Requirements

### Requirement: SSS is assigned by reader-focused emotional load, not calculated

The system SHALL assign the Subtext Suitability Scale (SSS) level based on how intense the reading experience will feel to a typical reader. Assignment SHALL be based on judgment over themes, explicitness, and sustained intensity, not on a numeric formula and not on legal or ACB classification. The output SHALL be one of S1_GENTLE, S2_MILD, S3_MODERATE, S4_INTENSE plus a short reasoning note (`sss_notes`).

#### Scenario: SSS assigned from warnings and metadata

- **GIVEN** a book has content warnings (and optionally title, author, description) from the content-warning pipeline
- **WHEN** the SSS assignment step runs
- **THEN** it produces an `sss_level` in { S1_GENTLE, S2_MILD, S3_MODERATE, S4_INTENSE }
- **AND** it produces `sss_notes` that briefly justify the level in terms of themes, explicitness, or sustained intensity
- **AND** the assignment is based on reader-focused emotional load, not on a single numeric score or ACB rating

#### Scenario: SSS independent of ACB

- **GIVEN** a book may have an age or classification rating from another system (e.g. ACB)
- **WHEN** the SSS assignment step runs
- **THEN** the assigned `sss_level` and `sss_notes` are not derived from that classification
- **AND** they reflect perceived emotional intensity for readers, not legal or regulatory categories

---

### Requirement: SSS assignment follows the triage process

The SSS assignment step SHALL follow a documented triage process: (1) Identify major sensitive themes from the content warnings (e.g. violence, sexual violence, self-harm, suicide, bigotry) and note whether they are referenced vs depicted on-page. (2) Gauge explicitness and frequency (mild or brief references vs graphic, frequent, or sustained depictions). (3) Assign the band by emotional load: S1 = gentle, mostly off-page or implied; S2 = noticeable emotional weight but not overwhelming; S3 = clear on-page depictions, multiple instances, or generally heavy tone; S4 = graphic, prolonged, or frequent traumatic content, likely very activating. (4) Write a short `sss_notes` string that justifies the level (e.g. “S3_MODERATE – multiple on-page scenes of domestic violence, emotionally intense but not graphic.”).

#### Scenario: Triage produces S4 for intense, on-page content

- **GIVEN** content warnings indicate graphic sexual violence, racism, and child abuse, with on-page presence and high severity
- **WHEN** the SSS assignment step runs
- **THEN** the step identifies these themes and their on-page, graphic nature
- **AND** it assigns S4_INTENSE (or equivalent) and writes `sss_notes` that reference graphic or prolonged depictions and emotional impact

#### Scenario: Triage produces S2 for mild, mostly off-page content

- **GIVEN** content warnings indicate some sensitive themes but they are mostly referenced or implied, with mild severity
- **WHEN** the SSS assignment step runs
- **THEN** the step assigns S2_MILD (or equivalent) and writes `sss_notes` that reference brief or off-page treatment
- **AND** the reasoning is consistent with the triage process (themes, explicitness, emotional load)

---

### Requirement: SSS step consumes warnings and metadata and outputs sss_level and sss_notes

The SSS assignment step SHALL accept as input the content warnings (and optionally book metadata such as title, author, description) produced by the existing content-warning pipeline. It SHALL return a structured output containing `sss_level` (one of the four valid values) and `sss_notes` (non-empty string). The step SHALL run after content warnings are available for the book; it SHALL NOT replace or duplicate the content-warning generation logic.

#### Scenario: Input is warnings array and book metadata

- **GIVEN** the content-warning pipeline has produced a list of warnings and book metadata is available
- **WHEN** the SSS assignment step is invoked with those inputs
- **THEN** it returns an object with `sss_level` and `sss_notes`
- **AND** `sss_level` is one of S1_GENTLE, S2_MILD, S3_MODERATE, S4_INTENSE
- **AND** `sss_notes` is a short string suitable for storage in `books.sss_notes`

#### Scenario: Output can be persisted to books

- **GIVEN** the SSS assignment step has returned `sss_level` and `sss_notes`
- **WHEN** the scan flow or caller persists the result to the database
- **THEN** the values can be written to `books.sss_level` and `books.sss_notes` without further transformation
- **AND** the existing UI that displays SSS (collection filters, book details) can show the assigned level and notes

---

### Requirement: Behavior when warnings are absent or sparse

When the book has no content warnings or very few warnings, the SSS assignment step SHALL still produce an `sss_level` and `sss_notes`. The step SHALL define consistent behavior for this case (e.g. assign S1_GENTLE or S2_MILD with a note that no or few warnings were present, or that the assignment is based on metadata only). The step SHALL NOT fail or return null for `sss_level` when warnings are absent; it SHALL provide a default or metadata-based assignment and document it in `sss_notes`.

#### Scenario: No warnings available

- **GIVEN** the book has an empty warnings list (or warnings were not generated)
- **WHEN** the SSS assignment step runs
- **THEN** it returns a valid `sss_level` (e.g. S1_GENTLE or S2_MILD)
- **AND** it returns `sss_notes` that indicate the assignment was made in the absence of warnings (e.g. “S1_GENTLE – no content warnings; defaulting to low intensity.” or equivalent)
- **AND** it does not throw or return null for `sss_level`
