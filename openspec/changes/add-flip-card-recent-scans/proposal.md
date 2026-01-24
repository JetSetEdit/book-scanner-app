# Change: Flip-card interaction for Recently Scanned book covers

## Why

Currently, the "Recently Scanned" row shows book covers that link directly to the book page. An alternative is to let users peek at key info (title, author, when scanned) by clicking a cover to flip it, then choose to view the full book. This supports "fast, informed decisions" with a more engaging, in-context preview and aligns with a BookTok-style, tactile feel. The flip uses Framer Motion (already in the project) for a 3D card rotation.

## What Changes

- **Recently Scanned cards** become flip cards: **front** = book cover (or placeholder when the image fails to load); **back** = title, author, relative time (e.g. "2 hours ago"), a "View book" link to `/book/[isbn]`, and a control to flip back to the cover (e.g. "Show cover" or back icon).
- **Interaction**: Click or tap the front to flip to the back; on the back, "View book" navigates, and a "Show cover" (or equivalent) control flips to the front. Only one card is flipped to the back at a time—flipping a second card flips the first back.
- **Animation**: Framer Motion 3D flip (e.g. `rotateY`) on the card. When the user has `prefers-reduced-motion: reduce`, the flip SHALL be replaced by an instant or very short (e.g. &lt; 150ms) opacity transition—no 3D rotation.
- **Carousel**: The existing auto-scroll, pause-on-hover/focus, and prefers-reduced-motion behaviour for the carousel SHALL remain unchanged. The flip does not affect horizontal scroll or auto-scroll.
- **Data**: No API changes; `/api/recent-scans` already returns `title`, `author`, `coverUrl`, `createdAt`. The back uses existing fields.

## Impact

- Affected specs: `recent-scans` (one ADDED requirement)
- Affected code: `components/recent-scans.tsx`; optionally a shared `BookCoverFlipCard` in `components/` if we extract for reuse. Framer Motion is an existing dependency.
