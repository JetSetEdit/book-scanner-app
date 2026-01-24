## ADDED Requirements

### Requirement: Production includes integrated capabilities from preview and lite

The production deployment (main branch) SHALL include the capabilities implemented on the preview and lite branches: content explanation on book details, scan recording on re-scan and auto-scrolling carousel for Recently Scanned, Settings with aesthetic themes, BookTok-inspired theme and Ethics reframe, variant config (including navbar app name from `getVariantConfig().name`), and the lite variant (so that a build with `NEXT_PUBLIC_VARIANT=lite` yields the unbranded "Book Scanner" experience as specified in add-subtext-lite-variant). Production SHALL be built and deployed with `NEXT_PUBLIC_VARIANT=public` or unset.

#### Scenario: Content explanation and recent-scans in production

- **GIVEN** a production build with `NEXT_PUBLIC_VARIANT=public` or unset
- **WHEN** the user views a book details page
- **THEN** an expandable "How we generate these" (or equivalent) control is present and shows the short, evidence-based explanation when expanded
- **AND** when the user re-scans an already-analyzed book (without forceRefresh), a row is inserted into `scans` and the book may appear in Recently Scanned
- **AND** Recently Scanned on the homepage is shown as an auto-scrolling carousel (subject to prefers-reduced-motion and pause-on-hover as in recent-scans spec)

#### Scenario: Settings and themes in production

- **GIVEN** a production build with `NEXT_PUBLIC_VARIANT=public` or unset
- **WHEN** the user opens the Settings page
- **THEN** aesthetic theme selection is available and Apply applies the chosen theme
- **AND** BookTok-inspired visual tweaks (e.g. warmer parchment, oxblood, forest Comfort Read, gold How Subtext Works, link/button styling) are present where implemented on preview

#### Scenario: Variant config and navbar in production

- **GIVEN** a production build with `NEXT_PUBLIC_VARIANT=public` or unset
- **WHEN** the user views the app
- **THEN** the navbar app name is taken from `getVariantConfig().name` (e.g. "Subtext" for public), not a hardcoded "Subtext Preview"
- **AND** Ethics reframe and variant-driven copy (e.g. AI→automated/system in frontend, Roadmap/ToS/Privacy, How Subtext Works, User Privacy) are present as on preview

#### Scenario: Lite variant available when built with VARIANT=lite

- **GIVEN** a build with `NEXT_PUBLIC_VARIANT=lite`
- **WHEN** the user loads the app
- **THEN** the navbar shows "Book Scanner" and the experience matches the lite variant as specified in add-subtext-lite-variant: no "Subtext" in app name or in-app copy; features grid, "How we generate these", "Learn how we work", affiliate, BookTok/Dynamic Reader summaries, and reasoning/confidence in the warnings list are hidden or reduced; beta modal uses short, neutral copy without "automated" or "AI"
- **AND** production deployments do not use `NEXT_PUBLIC_VARIANT=lite`; that value is for a separate Lite deployment only
