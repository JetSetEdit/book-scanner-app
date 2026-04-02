# book-page – Spec Delta

## Purpose

The book page (shared by `/book/[isbn]` and `/sandbox/book/[isbn]`) presents book metadata, content analysis, age recommendation, content warnings, support resources, and feedback. This delta adds requirements for heading hierarchy, contrast, support resources prominence, cover badge accessibility, and scannability of the content analysis and report sections so the page meets UX and accessibility best practice and is verifiable on the sandbox.

## ADDED Requirements

### Requirement: Heading hierarchy on book page

The book page SHALL use a logical heading outline: one `<h1>` for the book title, one `<h2>` for the main Content analysis section, and `<h3>` for all subsections within that block (e.g. Quick Glance, Age recommendation, Support Resources, Author's content warnings, detailed content warnings list, Community reports, feedback). There SHALL be only one visible "Content analysis" (or "Content Analysis") label for the main section; the automated-warnings subsection SHALL use a distinct label or be unlabeled when redundant so that the document outline has no duplicate section names for content analysis.

#### Scenario: Outline is h1 then h2 then h3

- **GIVEN** the user is on the book page (live or sandbox)
- **WHEN** the page is rendered
- **THEN** the first heading SHALL be an `<h1>` (book title)
- **AND** the main content analysis block SHALL have exactly one `<h2>` (e.g. "Content analysis")
- **AND** all subsections within that block SHALL use `<h3>` so no heading level is skipped

#### Scenario: Single Content analysis section label

- **GIVEN** the user is on the book page
- **WHEN** the content analysis block is displayed
- **THEN** there SHALL be only one visible heading or aria-label that reads as "Content analysis" (or "Content Analysis") for the whole section
- **AND** any inner subsection that lists automated warnings SHALL use a different label (e.g. "Detailed content warnings") or SHALL not repeat "Content analysis" so screen-reader users and outline navigation do not encounter duplicate section names

### Requirement: Contrast for disclaimer and secondary text

All disclaimer and secondary body text on the book page (e.g. Age Recommendation "indicative rating only" disclaimer, content warning disclaimer line, muted helper text) SHALL meet WCAG AA contrast: at least 4.5:1 for normal text against the page background. The system SHALL use a sufficiently dark muted colour (e.g. `text-muted-foreground` or equivalent that passes 4.5:1) and SHALL NOT rely on italics alone to convey emphasis where contrast would otherwise fail.

#### Scenario: Disclaimer text passes contrast check

- **GIVEN** the book page shows the Age Recommendation box with the "indicative rating only" disclaimer
- **WHEN** contrast is measured for that disclaimer text against its background
- **THEN** the contrast ratio SHALL be at least 4.5:1 (WCAG AA normal text)

#### Scenario: Muted body text meets WCAG AA

- **GIVEN** any muted or secondary body text on the book page (e.g. "Content warnings help readers make informed choices…", methodology text)
- **WHEN** the page is displayed in default theme
- **THEN** that text SHALL have a contrast ratio of at least 4.5:1 against its background

### Requirement: Support Resources visibility and crisis link usability

The Support Resources section SHALL have sufficient visual weight (e.g. subtle background or border) so it is easy to find. Crisis and support links SHALL be obviously tappable: they SHALL show an underline or equivalent on hover and on focus. The line "All services 24/7" and "In an emergency, call 000" SHALL remain prominent (e.g. "call 000" in bold/foreground). On narrow viewports, interactive elements for crisis links SHALL have a minimum touch target size of 44px where feasible (e.g. via padding).

#### Scenario: Support Resources section is visually distinct

- **GIVEN** the book page shows content warnings that trigger Support Resources
- **WHEN** the page is displayed
- **THEN** the Support Resources block SHALL have a subtle background or border so it is distinguishable from surrounding content

#### Scenario: Crisis links are tappable and prominent

- **GIVEN** the Support Resources section is visible
- **WHEN** the user hovers or focuses a crisis link (e.g. Lifeline, 1800RESPECT)
- **THEN** the link SHALL show a visible affordance (e.g. underline or colour change)
- **AND** the "In an emergency, call 000" text SHALL be visually prominent (e.g. bold, foreground colour)

#### Scenario: Touch targets on mobile

- **GIVEN** the user is on a narrow viewport (e.g. 375px width)
- **WHEN** the Support Resources crisis links are displayed
- **THEN** each link or its tap area SHALL have a minimum touch target of 44px where feasible (e.g. padding) so the links are easy to tap

### Requirement: Cover badge placement and accessibility

If the book page displays a badge overlaying or adjacent to the book cover (e.g. content reports count, status), that badge SHALL be positioned so it does not obscure the cover (e.g. above the cover, beside it, or in a small non-overlapping corner). The badge SHALL have a descriptive `aria-label` (e.g. "1 content report"). Any dismiss or action control on or near the badge SHALL be keyboard-focusable and SHALL have a visible focus ring. If no such badge exists in the current implementation, this requirement is satisfied by documenting that any future cover badge MUST follow these rules.

#### Scenario: Cover badge has accessible label and placement

- **GIVEN** the book page shows a badge related to the cover (e.g. content reports)
- **WHEN** the page is rendered
- **THEN** the badge SHALL have an `aria-label` that describes its meaning (e.g. "1 content report")
- **AND** the badge SHALL not obscure the book cover (e.g. placed above, beside, or in a small corner)

#### Scenario: Badge control is focusable

- **GIVEN** the badge has a dismiss or action control
- **WHEN** the user navigates by keyboard
- **THEN** the control SHALL be focusable
- **AND** when focused it SHALL show a visible focus ring

### Requirement: Scannability and accessibility of Age Recommendation and disclosure list

The Age Recommendation "How we determine this rating" collapsible SHALL expose its expanded state to assistive technology via `aria-expanded`. The content warnings disclosure list (e.g. "Show list (N items; may contain spoilers)" and category toggles) SHALL have clear focus styles and SHALL use `aria-expanded` on triggers; expanded content MAY use `aria-live` where appropriate so screen-reader users are notified when the list is revealed. The "Found an error? Report this book" action SHALL be in a visually separate block (e.g. below the content warnings list, in a dedicated feedback section) with distinct styling so it is not grouped with category toggles; its trigger SHALL be keyboard-focusable with a visible focus ring.

#### Scenario: Age Recommendation collapsible is accessible

- **GIVEN** the Age Recommendation box is visible
- **WHEN** the "How we determine this rating" trigger is rendered
- **THEN** it SHALL have `aria-expanded` reflecting the open/closed state
- **AND** when expanded, the methodology content SHALL be exposed to assistive tech (e.g. not hidden from screen readers)

#### Scenario: Disclosure triggers have focus and expanded state

- **GIVEN** the content warnings list is in disclosure/cards variant (e.g. sandbox)
- **WHEN** the user focuses "Show list…" or a category toggle
- **THEN** the trigger SHALL have a visible focus style
- **AND** the trigger SHALL have `aria-expanded` reflecting whether the list or category is expanded

#### Scenario: Report this book is visually and structurally separate

- **GIVEN** the book page shows the content warnings section and the feedback trigger
- **WHEN** the page is displayed
- **THEN** the "Found an error? Report this book" control SHALL be in a separate block (e.g. `#feedback` section) with distinct styling from the category toggles
- **AND** the control SHALL be keyboard-focusable and SHALL show a visible focus ring when focused
