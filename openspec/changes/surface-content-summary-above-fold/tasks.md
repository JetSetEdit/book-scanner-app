# Tasks: Surface content summary above the fold

## 1. Implementation

- [x] 1.1 In `book-details.tsx`, after the Book info section (after `</section>` for `#book-info`) and before the Synopsis section, add a compact content summary block that renders when `warnings` is available (analyzed).
- [x] 1.2 When `warnings.length > 0`: show a severity strip (one segment per warning, amber/orange/red for mild/moderate/severe) and one line of counts (e.g. "Mild 2 · Moderate 3 · Severe 1"). Include a "See full content analysis" link that scrolls to `#content-analysis`.
- [x] 1.3 When `analysisStatus === 'complete' && warnings.length === 0`: show one line "No content warnings" (or similar) with optional link to `#content-analysis`.
- [x] 1.4 When analysis not yet run or unknown: show nothing or a short "Not yet analyzed" so we don't imply the book is safe.
- [x] 1.5 Ensure the block is accessible (e.g. `role="region"` and `aria-label` "Content at a glance") and does not duplicate heading hierarchy (no new h2/h3; use a styled label or paragraph).

## 2. Documentation and verification

- [x] 2.1 Update `docs/SANDBOX_BOOK_PAGE_CONTENT.md` to describe the new above-the-fold content summary (placement and content).
- [x] 2.2 Manually verify: load a book page with warnings and confirm the compact summary appears before the synopsis and that "See full content analysis" scrolls to the Content Analysis section. Verify no-warnings and not-analyzed states.
