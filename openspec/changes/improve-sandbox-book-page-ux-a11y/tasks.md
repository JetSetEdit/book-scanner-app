# Tasks: Improve sandbox book page UX and accessibility

## 1. Heading hierarchy and section labels

- [x] 1.1 In `book-details.tsx`, ensure the main content block uses a single `<h2>` for "Content analysis" (or "Content Analysis"); keep the section `id="content-analysis"` and `aria-label` in sync.
- [x] 1.2 In `book-details.tsx`, change Specifications and Book info section headings from `<h3>` to a level consistent with the outline (e.g. keep as h3 if Content analysis is h2 so structure is h1 → h2 for main content, with h3 subsections under Content analysis; ensure no duplicate h2 for "Content analysis" elsewhere).
- [x] 1.3 In `content-warnings-list.tsx`, ensure subsection headings (Support Resources, Author's content warnings, Official Author Notes, Content analysis, Community Reports) are `<h3>`; if "Content analysis" appears both as the main section title and as the automated-warnings subsection label, rename or remove the duplicate so only one "Content analysis" label is visible in the document outline for that section (e.g. use "Detailed content warnings" for the list subsection or drop the inner heading when redundant).
- [x] 1.4 Verify heading order with a quick manual check or axe: h1 (title) → h2 (Content analysis) → h3 (Quick Glance, Age recommendation, … Support Resources, … Report area).

## 2. Contrast (WCAG AA)

- [x] 2.1 Audit Age Recommendation disclaimer text ("This is an indicative rating only…") and any other muted/italic body text on the book page for contrast ratio; ensure ≥4.5:1 for normal text (e.g. use or adjust `text-muted-foreground` so it passes on the page background).
- [x] 2.2 Apply any token or class change in `book-details.tsx` and `content-warnings-list.tsx` so disclaimer and secondary text meet WCAG AA without relying on italics alone.

## 3. Support Resources prominence and touch targets

- [x] 3.1 In `content-warnings-list.tsx`, add subtle visual weight to the Support Resources block (e.g. light background or border) so the section is easy to spot.
- [x] 3.2 Ensure crisis links have a visible hover/focus affordance (e.g. `hover:underline` or underline on focus) and that "All services 24/7" and "In an emergency, call 000" remain prominent (e.g. bold/foreground for "call 000").
- [x] 3.3 Ensure crisis link touch targets are at least 44px where feasible (e.g. padding on link or wrapper) for the Support Resources section on narrow viewports.

## 4. Cover badge (if present)

- [x] 4.1 If a badge is rendered overlapping the book cover (e.g. content reports count), move it to a non-overlapping position (above/beside cover or small corner) and add a descriptive `aria-label`; ensure any dismiss or action control is keyboard-focusable with visible focus ring. If no such badge exists, document in code or docs that any future cover badge MUST follow these rules and mark this task done.

## 5. Scannability and a11y (Age Recommendation, disclosure, Report)

- [x] 5.1 In `book-details.tsx`, ensure the Age Recommendation "How we determine this rating" collapsible uses `aria-expanded` and that expanded content is exposed to assistive tech; optionally add a short summary line above the collapsible for scannability.
- [x] 5.2 In `content-warnings-list.tsx`, ensure disclosure triggers ("Show list…", category toggles) have clear focus styles and use `aria-expanded` (and optional `aria-live` for revealed list where appropriate).
- [x] 5.3 Keep "Found an error? Report this book" in a visually separate block (e.g. existing `#feedback` section below the list) with distinct styling so it is not grouped with category toggles; ensure the trigger is keyboard-focusable with visible focus ring.

## 6. Documentation and validation

- [x] 6.1 Update `docs/SANDBOX_BOOK_PAGE_CONTENT.md` with any section heading or label changes and note the UX/a11y improvements (heading hierarchy, contrast, Support Resources, disclosure/report separation).
- [x] 6.2 Manually verify on `/sandbox/book/[isbn]`: heading outline, contrast of disclaimer text, Support Resources visibility and link behaviour, keyboard focus order and focus rings, and that "Report this book" is easy to find and distinct from the disclosure toggles.
