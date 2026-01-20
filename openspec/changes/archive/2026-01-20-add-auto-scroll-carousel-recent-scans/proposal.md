# Change: Add a slow auto-scrolling carousel to Recently Scanned

## Why

The "Recently Scanned" row is a static horizontal strip. A slow, continuous auto-scroll makes it feel more dynamic and alive without being distracting, and signals that the section is active and up to date.

## What Changes

- In `components/recent-scans.tsx`, add a slow horizontal auto-scroll to the book strip (on the order of one item every 4–6 seconds, or equivalent) so it moves like a carousel. The motion SHALL loop or reset so it does not permanently stop at the end.
- Pause auto-scroll when the user hovers or focuses within the carousel (so they can click a book); resume on mouse leave / blur.
- Disable auto-scroll when the user has `prefers-reduced-motion: reduce`; in that case the row stays a static, user-scrollable strip (current behaviour).
- Manual horizontal scroll (touch, trackpad, pointer) SHALL remain possible; auto-scroll may pause while the user is actively scrolling so the user stays in control.
- Data, layout, links, and API usage stay the same; only the scroll behaviour changes. Use a constant for speed so it can be tuned.

## Impact

- Affected specs: `recent-scans` (add one requirement)
- Affected code: `components/recent-scans.tsx`
