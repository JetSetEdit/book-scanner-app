## MODIFIED Requirements

### Requirement: Placeholder book page with switchable layout variants

The system SHALL provide a design-time placeholder book page that displays a book using **mock or fixture data only** (no Supabase, no scan or check-book APIs). The page SHALL offer a **variant switcher** so the user can switch between multiple layout and state treatments (e.g. Baseline, Compact, Spacious, Card-based, Not-found, Analyzing). The purpose is to compare different ways of presenting the book page for design decisions.

The page SHALL be available at a dedicated route (e.g. `/book/placeholder` or `/design/book-page`). Access in production MAY be restricted (e.g. 404, redirect to `/`, or only when `?design=1` is present) so it is not linked from production navigation. The page SHALL NOT perform any real book lookup or scan.

The page SHALL support an optional query parameter `v` with values `baseline`, `compact`, or `spacious`. When the user loads the page with `?v={value}` and the value is valid, the initial variant SHALL be that value; otherwise the default SHALL be `baseline`.

#### Scenario: Designer opens the placeholder page in development

- **GIVEN** the app is running in development (e.g. `NODE_ENV=development` or equivalent)
- **WHEN** the user navigates to the placeholder route (e.g. `/book/placeholder`)
- **THEN** the page renders with a variant switcher and a default layout (e.g. Baseline)
- **AND** the book and content warnings shown are from the fixture only
- **AND** no request is made to Supabase `books` or `content_warnings`, or to `/api/scan*`, `/api/check-book`, or similar

#### Scenario: Designer switches to another variant

- **GIVEN** the user is on the placeholder book page
- **WHEN** the user selects a different variant (e.g. Compact or Card-based) from the switcher
- **THEN** the main content area re-renders to show that layout
- **AND** the same fixture data is used; no new API calls

#### Scenario: Designer arrives via Preview link with ?v=

- **GIVEN** the user navigates to `/design/book-page?v=compact`
- **WHEN** the page loads
- **THEN** the Compact variant is shown initially
- **AND** the variant switcher reflects Compact as selected

#### Scenario: Production access (when gated)

- **GIVEN** the app is running in production and the implementation gates the placeholder route (e.g. by `NODE_ENV` or by requiring `?design=1`)
- **WHEN** a user opens the placeholder URL without the required condition
- **THEN** the response SHALL be 404 or a redirect to `/` (or equivalent)
- **AND** the placeholder page SHALL NOT be linked from the main navigation or sitemap
