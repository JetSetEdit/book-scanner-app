# book-page – Spec Delta (surface content summary above the fold)

## ADDED Requirements

### Requirement: Above-the-fold content summary

The book page SHALL show a compact content summary in the above-the-fold region so that users can answer "should I avoid this book?" without scrolling. The summary SHALL appear in the right column after the Book info section (title, author, Buy/Share, SSS, Content Rating) and before the Synopsis. When the book has been analyzed and has at least one content warning, the summary SHALL include a severity strip (one segment per warning, colored by mild/moderate/severe) and a single line of counts (e.g. Mild X · Moderate Y · Severe Z). When the book has been analyzed and has zero warnings, the summary SHALL show a single line indicating no content warnings (e.g. "No content warnings"). When analysis has not been run or is unknown, the summary SHALL show nothing or a short "Not yet analyzed" so the app does not imply the book is safe. The compact summary SHALL include a control (e.g. link) to scroll to the full Content Analysis section (`#content-analysis`). The full Quick Glance and Content Analysis section SHALL remain below the fold unchanged.

#### Scenario: User sees content summary before scrolling

- **GIVEN** the user has navigated to a book page for a book that has been analyzed and has content warnings
- **WHEN** the page is rendered
- **THEN** in the right column, after the book title, author, Buy/Share, and SSS/Content Rating, and before the Synopsis, the user SHALL see a compact content summary that includes a severity strip and counts (e.g. Mild 2 · Moderate 3 · Severe 1)
- **AND** the user SHALL be able to see this without scrolling on a typical desktop viewport

#### Scenario: User can jump to full content analysis

- **GIVEN** the compact content summary is visible
- **WHEN** the user activates the "See full content analysis" (or equivalent) control
- **THEN** the page SHALL scroll to the Content Analysis section (`#content-analysis`)

#### Scenario: No warnings and analysis complete

- **GIVEN** the book has been analyzed and has zero content warnings
- **WHEN** the page is rendered
- **THEN** the above-the-fold summary SHALL show a single line indicating no content warnings (e.g. "No content warnings")
- **AND** the user SHALL not need to scroll to learn that the book has no warnings

#### Scenario: Analysis unknown

- **GIVEN** the book has not been analyzed or analysis status is unknown
- **WHEN** the page is rendered
- **THEN** the above-the-fold summary SHALL show nothing or a short "Not yet analyzed" so the app does not imply the book is safe without analysis
