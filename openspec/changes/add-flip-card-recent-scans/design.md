# Design: Flip-card interaction for Recently Scanned

## Context

- The "Recently Scanned" row is a horizontal carousel of book covers; each item is currently a single `<Link>` to `/book/[isbn]`. The user requested an alternative: show covers, click to flip with Framer Motion, and show info on the back.
- Framer Motion is already a dependency (`components/scanning-animation.tsx`). The project uses `prefers-reduced-motion` for the carousel; we must respect it for the flip too.
- `/api/recent-scans` returns `book.title`, `book.author`, `book.coverUrl`, `createdAt`. No backend changes.

## Goals / Non-Goals

- **Goals**: Flip-card UX in Recently Scanned (front = cover, back = title, author, time, "View book", "Show cover"); 3D flip via Framer Motion; respect `prefers-reduced-motion`; preserve carousel behaviour; at most one card flipped at a time.
- **Non-Goals**: Changing the recent-scans API, the carousel spec, or other book grids (e.g. collection). Reuse of the flip card elsewhere can follow later.

## Decisions

### 1. Framer Motion for 3D flip

Use `motion.div` with `rotateY` (e.g. 0° front, 180° back) and `transform-style: preserve-3d` on a wrapper. Front and back are two faces of the same card; only one visible at a time via `backface-visibility: hidden`. Spring or ease-out for the flip; keep duration ~300–400ms when motion is allowed.

**Alternatives**: CSS-only 3D transform—works but Framer Motion gives consistent easing and easy `prefers-reduced-motion` handling. `AnimatePresence` not required for a simple two-state flip.

### 2. Back content and controls

- **Back**: Title (truncated if long), author (or "Unknown author"), relative time (e.g. "2 hours ago"), primary "View book" `Link` to `/book/[isbn]`, and a "Show cover" or back-chevron control to flip to front. "Show cover" may be an icon (e.g. `ChevronLeft` or `X`) to save space; it must be focusable and clearly afford reverting to the cover.
- **Front**: Cover image only (or placeholder when `onError`). No timestamp on front to keep the flip clean; timestamp on back is sufficient.

### 3. prefers-reduced-motion

When `prefers-reduced-motion: reduce` (via `window.matchMedia`, consistent with the carousel): disable 3D rotation. Use an instant swap or a very short opacity crossfade (&lt; 150ms). The card still flips in the sense of toggling front/back; only the motion is reduced.

### 4. One card flipped at a time

- **State**: `flippedIsbn: string | null` in the parent (`RecentScans`).
- **Behaviour**: Clicking the front of card A sets `flippedIsbn = A`. Clicking the front of card B sets `flippedIsbn = B`, so A’s `flipped` becomes false and it flips back. No need for "click outside to close"—one-at-a-time keeps the carousel readable.

### 5. Overflow and carousel

The flip uses 3D `transform` on the card. The carousel has `overflow-x-auto` on the scroll container. To avoid clipping the card mid-flip:

- Use `overflow-visible` on the card wrapper (the `flex-shrink-0` item), or ensure the scroll row has `overflow-y: visible` so the card can extend slightly vertically during rotation if needed. The current row uses `overflow-x-auto overflow-y-visible`; we will keep the card within the row’s height so no extra overflow is required. If the 3D perspective causes clipping, add `overflow-visible` to the card’s parent and `transform-style: preserve-3d` only on the inner flip layer.

### 6. Accessibility

- The front (cover) must be focusable and activate on Enter/Space to flip. It should have an `aria-label` such as "Show details for [title]" or "Flip to see details".
- The back: "View book" is a `Link` (focusable, default); "Show cover" is a `button` (focusable). When the card flips to the back, focus SHOULD move to the "View book" link so keyboard users can continue without an extra Tab. (Implementation note; not a hard spec requirement if it complicates Framer’s exit animations.)

## Risks / Trade-offs

- **Extra click to reach the book**: Users who want to go straight to the book must flip first, then "View book". Trade-off: we gain a quick, in-context peek. If metrics show friction, we could add a long-press or modifier-key to "go directly" in a later change.
- **Mobile tap targets**: The front and the "Show cover" control must be at least 44×44px effective. The card is ~128–160px wide; the whole front is tappable. "Show cover" as a small icon should have enough padding.

## Open Questions

- None. Optional follow-up: optional subtle timestamp on the front (e.g. corner badge) if we observe that users often flip only to check "when."
