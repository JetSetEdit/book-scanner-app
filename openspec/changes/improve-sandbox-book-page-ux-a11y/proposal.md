# Change: Improve sandbox book page UX and accessibility

## Why

A browser review of the sandbox book page (`/sandbox/book/[isbn]`) identified gaps against UX and accessibility best practice: heading hierarchy jumps from h1 to h3 with no h2 and duplicate "Content analysis" labels; secondary and disclaimer text may fail WCAG AA contrast; any badge overlaying the book cover lacks clear placement and a11y; Support Resources and crisis links need stronger visual weight and touch targets; and the Age Recommendation / disclosure list and "Report this book" action need clearer scannability and focus/aria behaviour. Implementing these improvements will make the book page (and thus the sandbox) more navigable, inclusive, and compliant.

## What Changes

- **Heading hierarchy**: Introduce a single h2 for the main Content analysis section; use h3 for subsections (Quick Glance, Age recommendation, Support Resources, Author's content warnings, Content analysis list, etc.). Remove or merge duplicate "Content Analysis" / "Content analysis" so one clear section label exists.
- **Contrast**: Ensure Age Recommendation disclaimer and other muted/italic body text meet WCAG AA (e.g. ≥4.5:1 for normal text) by using a darker muted colour where needed; avoid relying on italics alone for emphasis.
- **Cover badge**: If a badge overlays the book cover (e.g. content reports, status), ensure it has clear placement (e.g. above or beside the cover, or a small non-overlapping corner), a descriptive `aria-label`, and that any dismiss/action control is keyboard-focusable with a visible focus ring.
- **Support Resources**: Give the Support Resources section slightly more visual weight (e.g. subtle background or border); make crisis links obviously tappable (underline or button-style on hover/focus); keep "All services 24/7" and "In an emergency, call 000" prominent; ensure touch targets are at least 44px on mobile where feasible.
- **Scannability and a11y**: For Age Recommendation, consider a short summary line plus optional "How we determine this rating" expandable with bullets. For the disclosure list, ensure "Show list…" and category toggles have clear focus styles and expanded content uses `aria-expanded` (and optional `aria-live` where appropriate). Visually separate "Found an error? Report this book" from the category toggles (e.g. separate row or distinct style) so the action is easy to find.

All changes apply to the shared book page components used by both live (`/book/[isbn]`) and sandbox (`/sandbox/book/[isbn]`); the sandbox is the primary place to verify and showcase them.

## Impact

- Affected specs: new capability `book-page`
- Affected code: `components/book-details.tsx`, `components/content-warnings-list.tsx` (headings, contrast, Support Resources block, disclosure/report separation, optional cover badge); `docs/SANDBOX_BOOK_PAGE_CONTENT.md` (document any section/label changes)
