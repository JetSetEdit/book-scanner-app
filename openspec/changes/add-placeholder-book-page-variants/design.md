# Design: Placeholder book page variants

## Context

- The live book page (`/book/[isbn]`) uses `BookDetails` with a two-column layout: left = cover + specs ( sticky ), right = title, author, description, content warnings, BookTok summary, etc. Data comes from Supabase; if the book is not found, we show “This book isn’t in Subtext yet” with Scan / Go to scanner / Back to home.
- There is no design-time way to try different layouts, placeholder states, or “analyzing” treatments without scanning a real book or mocking the API. Design discussions rely on screenshots or one-off branches.

## Goals / Non-Goals

- **Goals**: One place to compare 2–4+ book-page layout and state variants using **mock data only**; switch between variants without a page reload (or with a simple reload); keep production book page and `BookDetails` untouched until we decide on changes; support future A/B or design-review workflows.
- **Non-Goals**: Replacing the production book page in this change; implementing all variants in the first slice (we can ship baseline + 2 new layouts, then add more); production SEO or deep-linking for the placeholder route.

## Decisions

### 1. Route

- **Chosen**: `/book/placeholder` (or `/design/book-page` if we prefer a `/design` namespace for future design-only routes).
- **Rationale**: `/book/placeholder` is easy to remember and aligns with “placeholder book.” `/design/book-page` groups design tools. Proposal leaves the exact path open; implementation can pick one and document it.

### 2. Variant switching

- **Chosen**: Client-side switcher (tabs or a select) in the page header or above the content. Selecting a variant re-renders the main area with that layout; no new navigation.
- **Rationale**: Fast comparison without losing scroll state. If we need shareable URLs per variant, we can add `?v=compact` later.

### 3. Mock data

- **Chosen**: In-code fixture (e.g. `lib/fixtures/placeholder-book.ts` or a constant in the page) with one realistic book + 3–6 content warnings of mixed severity and categories. No Supabase, no `/api/scan*`, no `/api/check-book`. `BookDetails` and `ContentWarningsList` receive the fixture; no change to their data contracts.
- **Rationale**: Reproducible, fast, works offline in dev. Fixture can be updated when we want to stress-test long titles, many warnings, or missing fields.

### 4. Variants to implement (priority)

| Variant       | Description                                                                 | Priority  |
|---------------|-----------------------------------------------------------------------------|-----------|
| **Baseline**  | Current `BookDetails` layout with mock data (reuse as-is).                  | P0        |
| **Compact**   | Cover centered on top; metadata + warnings in one column; denser spacing.   | P1        |
| **Spacious**  | Larger cover, more whitespace; two-column on desktop, stacked on mobile.    | P1        |
| **Card-based**| Distinct cards: Cover \| Metadata \| Warnings \| Actions; easy to reorder.  | P2        |
| **Not-found** | “This book isn’t in Subtext yet” treatment (reuse or mirror existing UX).   | P2        |
| **Analyzing** | Skeleton or “Analyzing…” message; useful to compare loading/empty states.   | P2        |

- **First slice**: Baseline + at least 2 of Compact / Spacious / Card-based. Not-found and Analyzing can follow.

### 5. Access and discoverability

- **Chosen**: Page is available when the app runs (no auth). It SHALL NOT be linked from production nav or sitemap. Optionally: show only when `NODE_ENV=development` or when `?design=1` is present; otherwise redirect to `/` or 404. Implementation can start with “always reachable in dev, 404 in prod” and relax later if we want stakeholder previews on a preview deployment.

### 6. Structure of the page

- **Chosen**: (1) Minimal chrome: back link to `/`, optional “Design” label; (2) Variant switcher (tabs or select); (3) Main content area that renders the selected variant. Each variant is a component or a named branch; shared pieces (e.g. `ContentWarningsList`, `SeverityScoreBadge`) are reused with fixture data.

## Risks / Trade-offs

- **Stale fixtures**: Mock data can drift from real API shape. Mitigation: document the fixture’s intended shape and add a comment or test that it matches `BookDetails`’ expectations.
- **Variant creep**: Too many variants make the page hard to reason about. Mitigation: start with 3–4; add new ones via a follow-up change.
- **Production URL**: If the route is reachable in prod, crawlers or shared links might surface it. Mitigation: no nav link, no sitemap; optional `noindex` or 404 when not in dev.

## Open Questions

- ~~Prefer `/book/placeholder` or `/design/book-page`?~~ **Resolved**: `/design/book-page`.
- Should `?v=compact` (or similar) be supported in the first slice for shareable variant URLs?
