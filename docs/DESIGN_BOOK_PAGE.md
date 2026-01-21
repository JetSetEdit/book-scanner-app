# Design: Placeholder book page (`/design/book-page`)

Design-time page to compare different book-page layout variants using **fixture data only** (no Supabase or scan APIs).

## How to open

- **Development**: go to [http://localhost:3000/design/book-page](http://localhost:3000/design/book-page), or use **Settings → Appearance → Book page layouts**: pick Baseline, Compact, or Spacious and click **Preview** (that block is only shown in development). The Preview link goes to `/design/book-page?v={selected}` so the page opens with that variant.
- **URL and ?v=**: `/design/book-page?v=baseline`, `?v=compact`, or `?v=spacious` opens with that variant as the initial view. If `v` is missing or invalid, the default is Baseline.
- **Production**: the route returns 404. It is not linked from the main nav or sitemap.

## Variants

| Variant   | Description                                                                 |
|-----------|-----------------------------------------------------------------------------|
| **Baseline** | Current `BookDetails` layout: two-column (cover+specs left, content right). Reused as-is with fixture data. |
| **Compact**  | Cover on top (centered), then single column: title, author, buy/share, description, Quick Glance, content warnings. Denser spacing. |
| **Spacious** | Two-column on desktop with a wider left column (440px) and more gap; same building blocks as Baseline. |

## Fixture

- **Book**: `lib/fixtures/placeholder-book.ts` — `PLACEHOLDER_BOOK` (e.g. *Where the Crawdads Sing*).
- **Warnings**: `PLACEHOLDER_WARNINGS` — 4 warnings (mental health, sexual content, emotional abuse, death/grief) with mixed severity.
- Shape matches `BookDetails` and `ContentWarningsList`. Update the fixture when you need different coverage (e.g. long titles, many warnings, missing cover).

## Adding a variant

1. Add a component in `components/design/book-page-variants.tsx` (e.g. `BookPageCardBased`).
2. Add a `TabsTrigger` and branch in `components/design/DesignBookPageClient.tsx`.
3. Reuse `ContentWarningsList`, `BooktokWarningsSummary`, `ShareButton`, `BuyButton` where possible.

## Behaviour

- No Supabase, `/api/scan*`, or `/api/check-book` calls.
- `ContentWarningsList` and support resources run as normal with the fixture warnings.
- In production, `NODE_ENV === 'production'` triggers `notFound()`.
