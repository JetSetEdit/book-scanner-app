## ADDED Requirements

### Requirement: S0_NO_INPUT is displayed as "not yet assessed" with neutral styling

When a book has `sss_level === 'S0_NO_INPUT'`, the UI SHALL display the SSS pill (or equivalent) with a neutral label such as "Not yet assessed" or "No intensity rating", and SHALL use neutral or grey styling so it is visually distinct from S1–S4 (which use green/yellow/orange/red). The full `sss_notes` SHALL be available in a tooltip or similar so users can see why the rating was not assessed.

#### Scenario: Book detail shows S0 pill

- **GIVEN** the user is viewing a book with `sss_level: 'S0_NO_INPUT'`
- **WHEN** the SSS pill is rendered
- **THEN** the label indicates that the intensity was not assessed (e.g. "Not yet assessed")
- **AND** the styling is neutral/grey, not green/yellow/orange/red
- **AND** the tooltip or expandable area shows `sss_notes` (e.g. "No description or community content warnings were available, so emotional intensity could not be assessed.")

#### Scenario: S1–S4 unchanged

- **GIVEN** the book has `sss_level` in { S1_GENTLE, S2_MILD, S3_MODERATE, S4_INTENSE }
- **WHEN** the SSS pill is rendered
- **THEN** the existing labels and colour scheme (e.g. S1 green, S2 yellow, S3 orange, S4 red) are used as today
- **AND** behaviour is unchanged from before S0 was introduced

---

### Requirement: Collection SSS filter handles S0_NO_INPUT

The collection page SSS filter SHALL allow users to include or exclude books with no intensity rating (S0_NO_INPUT). The implementation MAY (a) add S0 as a separate filter option (e.g. "S0 – No rating" or "Not yet assessed"), or (b) exclude S0 from the main S1–S4 checkboxes and provide an "Include books without ratings" toggle. Filter counts and URL parameters SHALL correctly reflect and filter by S0 when applicable.

#### Scenario: Filter by S0 or include unrated books

- **GIVEN** the collection has some books with `sss_level: 'S0_NO_INPUT'`
- **WHEN** the user applies the SSS filter (either by selecting S0 or by toggling "Include books without ratings" as designed)
- **THEN** the list shows only books matching the selected SSS levels (including or excluding S0 as chosen)
- **AND** the filter count for S0 (if shown) reflects the number of books with S0_NO_INPUT
