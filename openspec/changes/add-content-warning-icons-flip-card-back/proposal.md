# Change: Content warning category icons on the flip-card back

## Why

The back of each Recently Scanned flip card shows title, author, relative time, "View book", and "Show cover". Adding small icons for the book's content warning categories (one per category, e.g. violence, sexual content, mental health) gives an at-a-glance signal before the user taps "View book", supporting "fast, informed decisions" without leaving the homepage.

## What Changes

- **API**: `GET /api/recent-scans` SHALL include for each scan's `book` a `warningCategoryIds` array: distinct `category_id` (or legacy `category` when `category_id` is null) from `content_warnings` for that book. When the book has no content warnings, `warningCategoryIds` SHALL be an empty array.
- **Flip-card back**: The back of each Recently Scanned flip card SHALL display a compact row of icons representing the book's content warning categories (one icon per category), using the same category-to-icon mapping as the content warnings list (e.g. Brain for mental_health, Flame for sexual_content, Sword for violence). When the book has no content warnings, the icons row MAY be omitted or show a neutral indicator (e.g. "Comfort Read" or a checkmark). Each icon MAY have a tooltip with the category label. The row SHALL be placed between the metadata (title, author, time) and the actions (View book, Show cover) so the back does not become overcrowded; if needed, the number of icons SHALL be capped (e.g. 6–8) with no requirement to show "and more".
- **Reuse**: Reuse or extract the category-to-icon logic from `components/content-warnings-list.tsx` (e.g. `CategoryIcon` / `getCategoryIcon`) so icons stay consistent across the app.

## Impact

- Affected specs: `recent-scans` (two ADDED requirements: API shape, flip-card back icons)
- Affected code: `app/api/recent-scans/route.ts` (query `content_warnings`, aggregate distinct `category_id`/`category` per `book_id`, add `warningCategoryIds` to `book`); `components/recent-scans.tsx` (BackFace: read `warningCategoryIds`, render icon row; optionally extract or import `getCategoryIcon`); optionally `lib/utils/category-icons.tsx` or shared `CategoryIcon` if we extract.
