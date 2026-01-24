## 1. Merge and branch hygiene

- [x] 1.1 Merge branch `lite` into `main`. Resolve any conflicts; for files that implement preview/lite features, prefer the lite version. Preserve main-only bug fixes where they do not conflict.
- [x] 1.2 Confirm the merge builds and the test suite passes (or fix regressions).

## 2. Production configuration

- [ ] 2.1 Confirm the production Vercel project has `NEXT_PUBLIC_VARIANT=public` or unset (not `lite`).

## 3. Smoke and verification

- [x] 3.1 Run a production build (`NEXT_PUBLIC_VARIANT=public` or unset) and verify: content explanation ("How we generate these") on a book details page; scan recording when re-scanning an already-analyzed book; auto-scrolling carousel in Recently Scanned on the homepage; Settings page with aesthetic theme selection and Apply; BookTok-style visual tweaks (e.g. Comfort Read, How Subtext Works); navbar shows "Subtext" (from `getVariantConfig().name`).
- [x] 3.2 Run a build with `NEXT_PUBLIC_VARIANT=lite` and verify: navbar shows "Book Scanner"; features grid, "How we generate these", "Learn how we work", affiliate, BookTok/Dynamic Reader summaries, and reasoning/confidence in the warnings list are hidden or reduced as per add-subtext-lite-variant; beta modal uses neutral copy.
- [x] 3.3 Deploy to production (or tag for deploy) and perform a short smoke check. If a separate Lite deployment exists, verify it still works with `NEXT_PUBLIC_VARIANT=lite`.
