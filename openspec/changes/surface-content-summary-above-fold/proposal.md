# Change: Surface content summary above the fold

## Why

Users need to answer "should I avoid this book?" without scrolling. Today the main content summary (Quick Glance, severity, key triggers) lives in the Content Analysis section, which appears below the fold after cover, specs, title, author, Buy/Share, SSS, and synopsis. Surfacing a compact content summary in the above-the-fold region (right column, before Synopsis) lets users make a fast, informed decision and scroll for detail only if needed.

## What Changes

- Add a **compact content summary** in the book page right column, after the Book info section (title, author, Buy/Share, SSS, Content Rating) and **before** the Synopsis.
- Summary shows when the book has been analyzed (warnings array available): a small severity strip (one segment per warning, amber/orange/red) plus one line of counts (e.g. "Mild 2 · Moderate 3 · Severe 1") and optional spice indicator. When there are no warnings (Comfort Read), show a single line (e.g. "No content warnings"). When analysis is unknown, show nothing or "Not yet analyzed."
- Full Quick Glance and Content Analysis section remain below as today; the above-the-fold block is a teaser that may link or scroll to `#content-analysis`.
- Mobile: same component in document order before Synopsis so it appears before first scroll on narrow viewports.

## Impact

- Affected specs: book-page (new requirement)
- Affected code: `components/book-details.tsx` (insert compact summary between book-info and synopsis); optionally `docs/SANDBOX_BOOK_PAGE_CONTENT.md`
