## ADDED Requirements

### Requirement: Lite variant for unbranded, minimal beta sharing

The system SHALL support a `lite` variant selectable via `NEXT_PUBLIC_VARIANT=lite`. The Lite variant SHALL present an unbranded "Book Scanner" experience: no "Subtext" in the app name, meta, tagline, or in-app copy; minimal headlines and footer text; and no user-facing language that refers to "AI" or "automated" analysis. Lite SHALL hide or strongly reduce: the "How we generate these" block, the "Learn how we work" (Transparency) link, the homepage features grid, the BookTok-style and Dynamic Reader summaries on book details, the reasoning/confidence copy in the content-warnings list, and the affiliate paragraph. The beta onboarding modal SHALL use short, neutral copy that does not mention "automated" or "AI". The goal is to allow sharing a separate beta URL (e.g. a second Vercel project with `NEXT_PUBLIC_VARIANT=lite`) as a generic book scanner.

#### Scenario: Lite variant selected

- **GIVEN** `NEXT_PUBLIC_VARIANT=lite` at build time
- **WHEN** the user loads the app
- **THEN** the app name shown in the navbar and homepage is "Book Scanner" (not "Subtext")
- **AND** meta title and description are generic (e.g. "Book Scanner" / "Scan books to see content warnings")
- **AND** the homepage has a minimal headline and subhead and does not show the 3-column features grid
- **AND** the footer does not show the "Learn how we work" link, the long trust statement, or the affiliate paragraph
- **AND** the footer uses a one-line trust and short beta disclaimer

#### Scenario: Lite on book details and warnings

- **GIVEN** `NEXT_PUBLIC_VARIANT=lite`
- **WHEN** the user views a book details page
- **THEN** the "How we generate these" expandable block is not shown
- **AND** the BookTok-style summary component and the "Dynamic Reader Summary" block are not shown
- **AND** the content-warnings list does not show the "Why?" / reasoning disclosure or the "Confidence is based on automated verification…" copy (or shows a single neutral line)
- **AND** core content (warnings, severity, age rating, scan, collection) remains available

#### Scenario: Lite beta modal

- **GIVEN** `NEXT_PUBLIC_VARIANT=lite`
- **WHEN** the beta onboarding / disclaimer modal is shown
- **THEN** the copy does not include "automated analysis" or "AI"
- **AND** it uses a short, neutral summary (e.g. from the variant or a lite fallback)

#### Scenario: Public variant unchanged

- **GIVEN** `NEXT_PUBLIC_VARIANT` is `public`, `libraries`, `schools`, or unset
- **WHEN** the user loads the app
- **THEN** behavior matches the current app: "Subtext" branding, features grid, "How we generate these", "Learn how we work", affiliate, BookTok/Dynamic Reader summaries, and reasoning/confidence copy are shown as today
- **AND** the `lite` variant does not affect these deployments
