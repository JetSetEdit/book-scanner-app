## 1. Foundation

- [x] 1.1 Create mock book fixture: a single book object and 3–6 content warnings (mixed severity and categories) matching the shape expected by `BookDetails` and `ContentWarningsList`. Place in `lib/fixtures/placeholder-book.ts` (or similar); no API or Supabase calls.
- [x] 1.2 Add route `app/design/book-page/page.tsx`. The page SHALL NOT fetch from Supabase or scan APIs; it SHALL use only the fixture. In production, the route MAY 404 or redirect to `/` if we gate by `NODE_ENV` or `?design=1`; document the chosen behaviour.

## 2. Variant switcher

- [x] 2.1 Implement a variant switcher (tabs or select) in the placeholder page. Options: at least **Baseline**, **Compact**, and one of **Spacious** or **Card-based**. Selecting an option SHALL re-render the main content with that layout; state can be in React state or `?v=...` (optional for first slice).

## 3. Layout variants

- [x] 3.1 **Baseline**: Render `BookDetails` with the fixture book and warnings (and any required analysis-status / metadata stubs). Reuse existing component as-is.
- [x] 3.2 **Compact**: Implement a variant with cover on top (centered), then a single column for metadata, description, and content warnings. Denser spacing than baseline. Reuse `ContentWarningsList`, `SeverityScoreBadge`, and other shared UI where possible.
- [x] 3.3 Implement one additional layout: **Spacious** (larger cover, more whitespace, two-column on desktop) or **Card-based** (distinct cards for Cover | Metadata | Warnings | Actions). Reuse shared components where possible.

## 4. Optional state variants (defer if needed)

- [ ] 4.1 **Not-found**: Add a variant that shows the “This book isn’t in Subtext yet” treatment (reuse or mirror the block from `app/book/[isbn]/page.tsx`). Use a stub ISBN in the copy (e.g. from fixture or “9780000000000”).
- [ ] 4.2 **Analyzing**: Add a variant that shows a skeleton or “Analyzing…” placeholder for the main content, to compare loading/empty states.

## 5. Docs and validation

- [x] 5.1 Add a short doc (e.g. `docs/PLACEHOLDER_BOOK_PAGE.md` or a comment in the page) describing: how to open the placeholder page, what each variant illustrates, and how to add a new variant.
- [x] 5.2 Add a link to `/design/book-page` in **Settings → Appearance** (under themes), labelled e.g. “Book page layouts” / “Open design page”. Show only when `NODE_ENV === 'development'`. Update `docs/DESIGN_BOOK_PAGE.md` to mention this entry point.
- [ ] 5.3 Manually verify: in dev, open the placeholder route, switch between Baseline, Compact, and the third layout; confirm no Supabase or scan API calls; confirm production behaviour (404/redirect or reachable) matches the chosen gate.
