## 1. Copy and placement

- [x] 1.1 Draft the short explanation text (2–4 sentences): evidence-based from the book’s description and verified info, no genre/author inference, formula-driven severity, advisory-only. Store in a constant or shared copy (e.g. `lib/` or `components/`) if we expect reuse.
- [x] 1.2 In `components/book-details.tsx`, add an expandable “How we generate these” (or similar) control near the existing content-warnings disclaimer (e.g. just above or below the italic “Content warnings help readers make informed choices…”).
- [x] 1.3 When expanded, show the short explanation. Use `Collapsible` (or an inline expand/collapse) so the default state is collapsed.

## 2. Behaviour and polish

- [x] 2.1 Ensure the control is keyboard-accessible and has sensible `aria` attributes (e.g. `aria-expanded`, `aria-controls`).
- [x] 2.2 Style the block to match existing `text-muted-foreground` / `text-sm` patterns used for the disclaimer and age-rating copy.
- [x] 2.3 Manually verify on book detail (with and without warnings) and on narrow viewports.
