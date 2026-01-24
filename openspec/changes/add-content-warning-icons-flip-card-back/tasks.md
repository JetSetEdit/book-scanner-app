## 1. API: warning category ids in /api/recent-scans

- [x] 1.1 In `app/api/recent-scans/route.ts`, after fetching `scans` with `book:books(...)`, collect the set of `book.id` from the formatted scans that have `book`.
- [x] 1.2 Query `content_warnings` with `book_id in (...)`, select `book_id`, `category_id`, `category`. In application code, build a `Map<bookId, string[]>` of distinct `(category_id ?? category)` per `book_id` (omit nulls).
- [x] 1.3 For each `book` in the formatted response, set `book.warningCategoryIds = map.get(book.id) ?? []`. When the book has no warnings, use `[]`.

## 2. Icon helper and BackFace

- [x] 2.1 Extract `getCategoryIcon(categoryId: string, className?: string)` (or `CategoryIcon` component) from `content-warnings-list`'s `CategoryIcon` logic into `lib/utils/category-icons.tsx` or `components/category-icon.tsx`. Cover `category_id` and legacy `category` values; default to `AlertTriangle`. (Refactoring `ContentWarningsList` to use it is optional for this change.)
- [x] 2.2 In `BackFace`, extend `RecentScan` / `book` to include `warningCategoryIds?: string[]`. When `(warningCategoryIds?.length ?? 0) > 0`, render a horizontal row of icons (one per `id`, cap at 6) between the timeAgo and the actions block. Use `getCategoryIcon(id)` for each. When `warningCategoryIds` is empty or absent, omit the row.
- [x] 2.3 Add a `title` or `aria-label` on each icon with the category label (e.g. from a small `categoryIdToLabel` map or `getCategoryById` if available) for accessibility.

## 3. Types and compatibility

- [x] 3.1 Update the `RecentScan` / `book` type in `recent-scans.tsx` to include `warningCategoryIds?: string[]`. Ensure the client does not assume the field exists (treat missing as `[]`).
- [x] 3.2 Manual check: with and without content warnings, the flip-card back shows the icons row or omits it; `View book` and `Show cover` still work; no errors when the API omits `warningCategoryIds`.
