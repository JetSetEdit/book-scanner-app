## ADDED Requirements

### Requirement: Recently Scanned API includes warning category identifiers for each book

The `GET /api/recent-scans` response SHALL include for each scan's `book` object a `warningCategoryIds` field: an array of distinct category identifiers derived from `content_warnings` for that book. Each element SHALL be the `category_id` when present, or the legacy `category` when `category_id` is null. When the book has no rows in `content_warnings`, `warningCategoryIds` SHALL be an empty array. The field SHALL be present on every `book` in the response so clients can assume `book.warningCategoryIds` exists (and may be `[]`).

#### Scenario: Book has content warnings

- **GIVEN** a book has one or more rows in `content_warnings` with `book_id` equal to that book's id
- **WHEN** `GET /api/recent-scans` is called and that book is included in the response
- **THEN** `book.warningCategoryIds` SHALL be an array of distinct non-null values from `(category_id ?? category)` for that book's content_warnings
- **AND** each distinct category SHALL appear at most once in the array

#### Scenario: Book has no content warnings

- **GIVEN** a book has no rows in `content_warnings`
- **WHEN** `GET /api/recent-scans` is called and that book is included in the response
- **THEN** `book.warningCategoryIds` SHALL be an empty array `[]`

### Requirement: Content warning category icons on flip-card back

The back of each Recently Scanned flip card SHALL display a compact row of icons representing the book's content warning categories when the book has at least one content warning. There SHALL be one icon per distinct category in `book.warningCategoryIds`, using the same category-to-icon mapping as the content warnings list (e.g. Brain for mental_health, Flame for sexual_content, Sword for violence). The row SHALL be placed between the metadata (title, author, relative time) and the actions ("View book", "Show cover"). The number of icons MAY be capped (e.g. 6) to avoid crowding the back. Each icon SHOULD have a tooltip or `aria-label` with the category label. When `warningCategoryIds` is empty or the book has no content warnings, the icons row MAY be omitted; no icons row is required in that case.

#### Scenario: Back shows content warning category icons when the book has warnings

- **GIVEN** the book has `warningCategoryIds` with at least one element
- **AND** the user has flipped the card to the back
- **WHEN** the back is visible
- **THEN** a row of category icons SHALL be shown between the relative time and the "View book" / "Show cover" controls
- **AND** each icon SHALL correspond to one of the category ids in `warningCategoryIds`, using the same icon mapping as the content warnings list
- **AND** each icon SHOULD have an accessible name (e.g. `aria-label` or `title`) with the category label

#### Scenario: Back omits icons when the book has no content warnings

- **GIVEN** the book has `warningCategoryIds` empty or the field is absent (e.g. older API)
- **AND** the user has flipped the card to the back
- **WHEN** the back is visible
- **THEN** the icons row MAY be omitted
- **AND** the back SHALL still show title, author, relative time, "View book", and "Show cover"

#### Scenario: Client tolerates missing warningCategoryIds

- **GIVEN** the `GET /api/recent-scans` response does not include `warningCategoryIds` on a `book` (e.g. older deployment or error)
- **WHEN** the client renders the flip-card back
- **THEN** the client SHALL treat the missing field as an empty array and SHALL NOT throw or break
- **AND** the icons row SHALL be omitted in that case
