## ADDED Requirements

### Requirement: User-facing explanation of how content warnings are generated

The system SHALL provide a short, user-facing explanation of how content warnings are generated, on the book details page near the content warnings section.

The explanation SHALL:

- Be 2–4 sentences, non-technical, and advisory in tone.
- State that warnings are based on the book’s description and other verified information about that specific book.
- Indicate that severity is derived from factors (e.g. how central or explicit the content is), not from genre, author, or similar books.
- Clarify that all results are advisory to help readers decide what is right for them.

The explanation SHALL be discoverable but not dominant: it SHALL be shown via an expandable control (e.g. “How we generate these”) that is collapsed by default. The control SHALL be placed near the existing content-warnings disclaimer.

#### Scenario: User expands the explanation on a book page

- **GIVEN** the user is on a book details page that shows the content warnings section
- **WHEN** the user activates the “How we generate these” (or equivalent) control
- **THEN** the short explanation is displayed
- **AND** the explanation does not mention internal implementation (e.g. model names, APIs)
- **AND** the explanation reflects evidence-based, spoiler-free, and advisory-only behaviour

#### Scenario: User sees the control when no warnings are present

- **GIVEN** the user is on a book details page where the analysis is complete and zero content warnings are shown (e.g. “Comfort Read”)
- **WHEN** the content warnings block is visible
- **THEN** the “How we generate these” control is still present and expandable
- **AND** the expanded text remains accurate (e.g. that we analyze the book and may find no concerning content)
