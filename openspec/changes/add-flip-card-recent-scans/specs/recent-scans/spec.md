## ADDED Requirements

### Requirement: Flip-card interaction for Recently Scanned covers

The "Recently Scanned" row SHALL display each book as a flip card. The **front** SHALL show the book cover (or a placeholder when the cover image fails to load). The **back** SHALL show the book title, author (or a neutral fallback when missing), relative scan time (e.g. "2 hours ago"), a "View book" link to `/book/[isbn]`, and a control to flip back to the cover (e.g. "Show cover" or back icon). A click or tap on the front SHALL flip the card to the back using a 3D rotation (e.g. Framer Motion `rotateY`). When the user has `prefers-reduced-motion: reduce`, the flip SHALL use an instant or very short (&lt; 150ms) opacity transition instead of 3D rotation. At most one card SHALL be flipped to the back at a time; flipping a second card SHALL flip the first back. The existing auto-scrolling carousel, pause-on-hover/focus, and prefers-reduced-motion behaviour for the row SHALL remain unchanged.

#### Scenario: User flips a cover to see details

- **GIVEN** "Recently Scanned" has at least one book
- **WHEN** the user clicks or taps the front (cover) of a card
- **THEN** the card flips to the back with a 3D rotation animation
- **AND** the back shows title, author, relative time, "View book" link, and a "Show cover" (or equivalent) control
- **AND** clicking "View book" navigates to `/book/[isbn]`
- **AND** clicking "Show cover" flips the card back to the front

#### Scenario: Only one card flipped at a time

- **GIVEN** card A is flipped to the back
- **WHEN** the user clicks the front of card B
- **THEN** card B flips to the back
- **AND** card A flips back to the front so at most one card shows the back at a time

#### Scenario: prefers-reduced-motion for flip

- **GIVEN** the user has `prefers-reduced-motion: reduce`
- **WHEN** the user clicks the front of a card to flip
- **THEN** the transition from front to back SHALL be instant or use an opacity change of less than 150ms
- **AND** no 3D `rotateY` (or equivalent) animation SHALL be used for the flip

#### Scenario: Carousel behaviour unchanged by flip

- **GIVEN** the flip-card interaction is implemented
- **WHEN** "Recently Scanned" is displayed
- **THEN** the row SHALL still auto-scroll when `prefers-reduced-motion` is not set, and SHALL pause on hover or focus within the carousel
- **AND** manual horizontal scroll SHALL remain possible
- **AND** when `prefers-reduced-motion: reduce`, the carousel SHALL not auto-scroll (as in the existing Auto-scrolling carousel requirement)
