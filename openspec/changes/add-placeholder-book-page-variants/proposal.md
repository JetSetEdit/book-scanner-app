# Change: Add placeholder book page with switchable layout variants

## Why

We need a design-time way to compare different layouts and placeholder treatments for the book page without touching production data or running full scans. A single page with mock data and a variant switcher lets designers and stakeholders compare options side-by-side and make informed decisions before we change the live book experience.

## What Changes

- **New route** (e.g. `/book/placeholder` or `/design/book-page`) that renders a book page using **mock/fixture data only** (no Supabase or scan APIs).
- **Variant switcher** (tabs, select, or links) so users can switch between multiple layout/state treatments.
- **Layout variants** to consider: (1) **Baseline** — current `BookDetails` layout with mock data; (2) **Compact** — cover on top, single column, denser; (3) **Spacious** — larger cover, more whitespace, two-column; (4) **Card-based** — distinct cards for Cover | Metadata | Warnings | Actions.
- **State variants** (optional in first slice): **Not-found** — “This book isn’t in Subtext yet” style; **Analyzing** — skeleton or “Analyzing…” placeholder.
- **Access**: Page SHALL be available in development; access in production MAY be gated (e.g. unlinked from nav, or behind `?design=1`) so it is not a user-facing entry point.
- **Documentation**: Short note (e.g. in `docs/` or a README in the route) on how to use the page and what each variant illustrates.

## Impact

- Affected specs: `book-page` (new capability)
- Affected code: new `app/book/placeholder/page.tsx` (or `app/design/book-page/page.tsx`), optional `components/book-page-variants/` or similar, mock data (e.g. `lib/fixtures/placeholder-book.ts` or inline), `BookDetails` or new layout components reused/adapted for variants.
