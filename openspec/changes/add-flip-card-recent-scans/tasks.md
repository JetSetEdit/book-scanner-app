## 1. Flip-card component and motion

- [x] 1.1 Implement a flip card (inline in `RecentScans` or as `BookCoverFlipCard`) with two faces: **front** = cover image (or placeholder on `onError`), **back** = title, author, relative time (`formatDistanceToNow`), "View book" `Link` to `/book/[isbn]`, and a "Show cover" (or back-chevron) control. Use Framer Motion `motion.div` with `rotateY` and `transform-style: preserve-3d`; `backface-visibility: hidden` on front and back so only one face is visible.
- [x] 1.2 When `prefers-reduced-motion: reduce` (via `matchMedia`, consistent with carousel), disable 3D flip: use an instant swap or opacity crossfade &lt; 150ms instead of `rotateY`.

## 2. State and interaction

- [x] 2.1 In `RecentScans`, add `flippedIsbn: string | null`. Clicking the front of a card sets `flippedIsbn` to that `isbn`; flipping another card updates it so at most one card is flipped to the back. "Show cover" sets `flippedIsbn` to `null` for that card.
- [x] 2.2 Replace the existing `<Link>`-wrapped cover with the flip card. The front is clickable to flip; it must NOT navigate. Only "View book" on the back navigates to `/book/[isbn]`.

## 3. Carousel and layout

- [x] 3.1 Ensure the carousel (auto-scroll, pause on hover/focus, prefers-reduced-motion for auto-scroll) still works unchanged. The flip card lives inside the existing scroll row; no changes to scroll or pause logic.
- [x] 3.2 Avoid clipping during flip: if the 3D transform is clipped, set `overflow-visible` on the card wrapper or adjust `overflow-y` on the row so the card is fully visible during rotation.

## 4. Accessibility and validation

- [x] 4.1 Front: focusable (e.g. `tabIndex={0}` or `button`), activatable with Enter/Space to flip; `aria-label` such as "Show details for [title]". Back: "View book" (Link) and "Show cover" (button) focusable. Prefer moving focus to "View book" when flipping to back.
- [x] 4.2 Manual smoke: desktop and mobile; with and without `prefers-reduced-motion: reduce`; keyboard (Tab, Enter, Space); basic screen-reader check that "View book" and "Show cover" are announced.
