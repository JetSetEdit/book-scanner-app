## ADDED Requirements

### Requirement: Auto-scrolling carousel for Recently Scanned

The "Recently Scanned" row on the homepage SHALL display as a slow auto-scrolling carousel: the list of book covers SHALL move horizontally at a slow speed (on the order of one item every 4–6 seconds, or equivalent) so the section feels dynamic. The motion SHALL loop or reset so it does not permanently stop at the end. The auto-scroll SHALL pause when the user hovers or focuses within the carousel (to allow clicking a book). The auto-scroll SHALL be disabled when the user has `prefers-reduced-motion: reduce`; in that case the row SHALL behave as a static, user-scrollable strip. Manual horizontal scroll (touch, trackpad, or pointer) SHALL remain possible and, when used, may pause or temporarily override the auto-scroll so the user stays in control.

#### Scenario: Default: carousel auto-scrolls

- **GIVEN** the user does not have `prefers-reduced-motion: reduce`
- **AND** "Recently Scanned" has at least one item
- **WHEN** the section is visible
- **THEN** the carousel auto-scrolls horizontally at a slow speed
- **AND** the motion loops or resets so it appears continuous

#### Scenario: Pause on hover or focus

- **GIVEN** the carousel is auto-scrolling
- **WHEN** the user hovers or focuses within the carousel area
- **THEN** the auto-scroll pauses
- **AND** when the user leaves (blur or mouse out), auto-scroll resumes

#### Scenario: prefers-reduced-motion

- **GIVEN** the user has `prefers-reduced-motion: reduce`
- **WHEN** "Recently Scanned" is shown
- **THEN** the carousel does not auto-scroll
- **AND** the row behaves as a static, horizontally scrollable list (same as today)

#### Scenario: User scrolls manually

- **GIVEN** the carousel is auto-scrolling
- **WHEN** the user scrolls horizontally (touch, trackpad, or pointer)
- **THEN** the user can browse the list as today
- **AND** auto-scroll may pause while the user is actively scrolling; the user stays in control
