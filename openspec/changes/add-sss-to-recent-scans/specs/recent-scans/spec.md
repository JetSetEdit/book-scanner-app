## ADDED Requirements

### Requirement: Recently Scanned API includes SSS level for each book

The `GET /api/recent-scans` response SHALL include for each scan's `book` object a `sss_level` field (or equivalent) derived from the `books` table. The field SHALL be the book's Subtext Suitability Scale level (S0_NO_INPUT, S1_GENTLE, S2_MILD, S3_MODERATE, S4_INTENSE) when present, or null when the book has no level. The field SHALL be present on every `book` in the response so clients can assume `book.sss_level` exists (and may be null).

#### Scenario: Book has SSS level

- **GIVEN** a book in the database has `sss_level` set (e.g. S1_GENTLE, S2_MILD)
- **WHEN** `GET /api/recent-scans` is called and that book is included in the response
- **THEN** `book.sss_level` SHALL equal the value stored on the book
- **AND** the client can use it to display the suitability label

#### Scenario: Book has no SSS level

- **GIVEN** a book in the database has `sss_level` null or not yet assigned
- **WHEN** `GET /api/recent-scans` is called and that book is included in the response
- **THEN** `book.sss_level` SHALL be null (or omitted with client treating absence as null)
- **AND** the client SHALL not break and MAY show "Not yet assessed" or omit the SSS row

### Requirement: Recently Scanned flip-card back displays SSS label

The back of each Recently Scanned flip card SHALL display the Subtext Suitability Scale (SSS) label when the user has flipped the card. The label SHALL use the same semantics as the book details and collection pages: S0_NO_INPUT → "Not yet assessed" (muted styling), S1_GENTLE → "S1 Gentle" (green), S2_MILD → "S2 Mild" (yellow), S3_MODERATE → "S3 Moderate" (orange), S4_INTENSE → "S4 Intense" (red). The SSS pill or label SHALL be placed between the metadata (title, author, relative time) and the warning category icons row, or between the warning icons and the actions ("View book", "Show cover"). When `sss_level` is null or missing, the client SHALL show "Not yet assessed" with muted styling or omit the SSS row; the component SHALL NOT throw or break.

#### Scenario: Back shows SSS when book has level

- **GIVEN** the book has `sss_level` set (e.g. S2_MILD)
- **AND** the user has flipped the card to the back
- **WHEN** the back is visible
- **THEN** the SSS label SHALL be shown with the correct text and styling for that level
- **AND** the label SHALL be placed between metadata and warning icons (or between warning icons and actions)

#### Scenario: Back shows Not yet assessed when sss_level is null

- **GIVEN** the book has `sss_level` null or the field is absent
- **AND** the user has flipped the card to the back
- **WHEN** the back is visible
- **THEN** the client SHALL show "Not yet assessed" with muted styling or omit the SSS row
- **AND** the component SHALL NOT throw or break

#### Scenario: Client tolerates missing sss_level

- **GIVEN** the `GET /api/recent-scans` response does not include `sss_level` on a `book` (e.g. older deployment)
- **WHEN** the client renders the flip-card back
- **THEN** the client SHALL treat the missing field as null
- **AND** the client SHALL show "Not yet assessed" or omit the SSS row and SHALL NOT throw
