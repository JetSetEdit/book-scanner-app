## MODIFIED Requirements

### Requirement: SSS step consumes warnings and metadata and outputs sss_level and sss_notes

The SSS assignment step SHALL accept as input the content warnings (and optionally book metadata such as title, author, description) produced by the existing content-warning pipeline. It SHALL return a structured output containing `sss_level` (one of the five valid values: S0_NO_INPUT, S1_GENTLE, S2_MILD, S3_MODERATE, S4_INTENSE) and `sss_notes` (non-empty string). The step SHALL run after content warnings are available for the book; it SHALL NOT replace or duplicate the content-warning generation logic. The step SHALL guarantee that the returned `sss_level` is exactly one of the values allowed by the database constraint `books_sss_level_check`, so that callers may persist the result to `books.sss_level` without transformation and without constraint violations.

#### Scenario: Input is warnings array and book metadata

- **GIVEN** the content-warning pipeline has produced a list of warnings and book metadata is available
- **WHEN** the SSS assignment step is invoked with those inputs
- **THEN** it returns an object with `sss_level` and `sss_notes`
- **AND** `sss_level` is one of S0_NO_INPUT, S1_GENTLE, S2_MILD, S3_MODERATE, S4_INTENSE
- **AND** `sss_notes` is a short string suitable for storage in `books.sss_notes`

#### Scenario: Output can be persisted to books

- **GIVEN** the SSS assignment step has returned `sss_level` and `sss_notes`
- **WHEN** the scan flow or caller persists the result to the database
- **THEN** the values can be written to `books.sss_level` and `books.sss_notes` without further transformation
- **AND** the existing UI that displays SSS (collection filters, book details) can show the assigned level and notes
- **AND** no check constraint on `books.sss_level` is violated (i.e. `sss_level` is NULL or exactly one of the five allowed literals)

#### Scenario: Malformed or unexpected model output is normalized

- **GIVEN** the SSS assignment step receives a model response that contains an `sss_level` string that is not exactly one of the five DB-allowed values (e.g. wrong case, extra whitespace, or typo)
- **WHEN** the step parses and returns a result
- **THEN** it normalizes or maps the value to one of S0_NO_INPUT, S1_GENTLE, S2_MILD, S3_MODERATE, S4_INTENSE (or uses a defined fallback such as S2_MILD)
- **AND** the returned value is always safe to write to `books.sss_level` without violating `books_sss_level_check`
