## ADDED Requirements

### Requirement: Book page layout selector and Preview link in Appearance (dev only)

When the app is running in development, Settings → Appearance SHALL include a "Book page layouts" block. The block SHALL contain:

1. A **variant selector** with options Baseline, Compact, and Spacious. The user SHALL be able to select one option; the selection SHALL be reflected in the UI (e.g. highlighted or checked).
2. A **"Preview"** link (or equivalent label such as "Open design page") to `/design/book-page?v={selected}`, where `{selected}` is the currently selected variant. The link SHALL open the design-time placeholder book page with that variant as the initial view.

The selection MAY be persisted to user preferences (e.g. `bookPageLayoutPreview`) so it prefills on the next visit. The block SHALL NOT be shown in production (e.g. when `NODE_ENV=production`).

#### Scenario: User selects Compact and clicks Preview

- **GIVEN** the user is in Settings → Appearance in development
- **AND** the "Book page layouts" block is visible
- **WHEN** the user selects Compact in the variant selector
- **AND** the user clicks the Preview link
- **THEN** the user is navigated to `/design/book-page?v=compact`
- **AND** the design page loads with the Compact variant shown initially

#### Scenario: Block is hidden in production

- **GIVEN** the app is running in production
- **WHEN** the user opens Settings → Appearance
- **THEN** the "Book page layouts" block is not shown
