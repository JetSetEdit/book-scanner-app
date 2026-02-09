## 1. API: Include sss_level in recent-scans response

- [x] 1.1 In `app/api/recent-scans/route.ts`, add `sss_level` to the `books` select in the Supabase query (e.g. `book:books ( id, title, author, cover_url, sss_level )`).
- [x] 1.2 In the formatted response mapping, include `sssLevel: scan.book?.sss_level ?? null` (or `sss_level`) on each `book` object so every scan's book has the field (nullable).
- [ ] 1.3 Verify the API returns `sss_level` for books that have it and null for books that do not (e.g. manual curl or browser Network tab).

## 2. UI: Display SSS on flip-card back

- [x] 2.1 In `components/recent-scans.tsx`, add `sss_level` (or `sssLevel`) to the `RecentScan` interface `book` type (optional, nullable).
- [x] 2.2 On the flip-card back (BackFace), render the SSS label using the same mapping as book-details/collection: S0_NO_INPUT → "Not yet assessed" (muted), S1_GENTLE → "S1 Gentle" (green), S2_MILD → "S2 Mild" (yellow), S3_MODERATE → "S3 Moderate" (orange), S4_INTENSE → "S4 Intense" (red). Place the SSS pill between the relative time and the warning category icons row (or between warning icons and actions if that fits layout better).
- [x] 2.3 When `sss_level` is null or missing, show "Not yet assessed" with muted styling or omit the SSS row; do not throw or break.
- [x] 2.4 Ensure existing behaviour (title, author, timeAgo, warningCategoryIds icons, View book, Show cover) is unchanged.

## 3. Validation

- [x] 3.1 Run `openspec validate add-sss-to-recent-scans --strict --no-interactive` and fix any issues.
- [ ] 3.2 Smoke-test: load homepage, confirm Recently Scanned cards show SSS on the back when flipped; confirm books with and without sss_level render correctly.
