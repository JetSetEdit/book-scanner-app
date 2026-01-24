# Design: Content warning category icons on flip-card back

## Context

- The Recently Scanned flip card back shows title, author, relative time, "View book", and "Show cover". The user requested icons for the book's content warnings.
- `/api/recent-scans` currently returns `book: { id, title, author, cover_url }` and does not query `content_warnings`. `content_warnings` has `book_id`, `category_id` (nullable), and legacy `category`.
- `components/content-warnings-list.tsx` defines `CategoryIcon` (not exported) mapping `category_id` / legacy `category` to Lucide icons: mental_health→Brain, sexual_content→Flame, emotional_abuse_or_toxic_relationships→HeartCrack, bullying_or_social_cruelty→Users, violence→Sword, substance_use_or_alcohol→Wine, self_harm_or_suicidal_ideation→Activity, death_or_grief→Skull, discrimination→Ban, language→Hash; legacy substance_abuse→Pill, abuse→HeartCrack; default→AlertTriangle.

## Goals / Non-Goals

- **Goals**: Extend the API to supply distinct category identifiers per book; render a compact row of category icons on the flip-card back; reuse the same icon set as the content warnings list; when there are no warnings, omit the row or show a neutral indicator.
- **Non-Goals**: Showing severity, subcategory-level icons, or a "View warnings" link on the back. Capping is for layout only; no "and more" affordance.

## Decisions

### 1. API: second query and merge

- Keep the existing `/api/recent-scans` query for `scans` + `books` unchanged. Run a second query: `content_warnings` where `book_id in (list of book ids from first query)`, selecting `book_id`, `category_id`, `category`. In application code, aggregate by `book_id`: for each book, collect distinct `(category_id ?? category)` (non-null), then attach `warningCategoryIds: string[]` to each `book` in the response. Books with no rows get `warningCategoryIds: []`.
- **Rationale**: Avoids N+1 and keeps the first query simple. Two round-trips (or one batched `in` query) is acceptable for a small set of book ids (≤10).

### 2. Icon mapping: extract and reuse

- Extract a small helper `getCategoryIcon(categoryId: string, className?: string)` that returns the same React node as `CategoryIcon` in content-warnings-list. Place it in `lib/utils/category-icons.tsx` or `components/category-icon.tsx`. `ContentWarningsList` can later be refactored to use it; for this change, only the flip-card and the new module need it. The flip-card imports `getCategoryIcon` (or `CategoryIcon`) and renders `getCategoryIcon(id)` for each `id` in `warningCategoryIds`.
- **Rationale**: Single source of truth for category→icon; no drift between list and flip-card.

### 3. Back layout and cap

- Insert the icons row between the last metadata line (timeAgo) and the `mt-auto pt-2` actions block. Use a horizontal flex row, `flex-wrap`, small icons (e.g. `h-3.5 w-3.5`), `gap-1`. Cap at 6 icons; if there are more, show the first 6 only. No "+N" or "and more" to keep the back minimal.
- **Rationale**: Back is small; 6 icons give a useful signal without clutter.

### 4. No-warnings state

- When `warningCategoryIds.length === 0`: omit the icons row. Optionally, we could show a small "Comfort Read" or CheckCircle with `aria-label="No content warnings"`. The spec leaves it implementer choice; we'll omit for minimalism unless we add a one-line "Comfort Read" that matches the book page.

### 5. Tooltip

- Each icon SHOULD have a `title` or `aria-label` with the category user label (e.g. from `getCategoryById` or a small map). If we don’t have taxonomy in the flip-card, a simple `categoryIdToLabel` map for the known ids is enough.

### 6. Backward compatibility

- If the API response does not include `warningCategoryIds` (old deployment or error), the client SHALL treat it as `[]` and omit the icons row. No runtime error.

## Risks / Trade-offs

- **Extra query**: One more `content_warnings` read per request`; for ≤10 books it’s a few dozen rows. Acceptable.
- **Stale warnings**: Icons reflect current `content_warnings`. If a book is re-analyzed and warnings change, the next `/api/recent-scans` load will show the new set. No extra invalidation.

## Open Questions

- None.
