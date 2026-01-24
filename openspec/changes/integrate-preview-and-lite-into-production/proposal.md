# Change: Integrate preview and lite into production

## Why

Production (main) is missing features and the variant system that exist on the **preview** and **lite** branches. We need to bring the relevant work from both into main so production has: content explanation, scan recording on rescan, auto-scroll carousel, Settings with aesthetic themes, BookTok theme, Ethics reframe and variant config, and the lite variant (so a separate Lite deployment can use `NEXT_PUBLIC_VARIANT=lite`). Production will continue to use `NEXT_PUBLIC_VARIANT=public`; the lite variant remains an option for a different Vercel project or preview.

## What Changes

- **From preview** (vs main): Content explanation ("How we generate these" on book details); scan recording when re-scanning an already-analyzed book; auto-scrolling carousel for Recently Scanned; Settings page with aesthetic themes; BookTok-inspired theme (warmer parchment, oxblood, forest Comfort Read, gold How Subtext Works, link/button tweaks); Ethics reframe and rephrasing (Roadmap/ToS/Privacy, How Subtext Works, User Privacy; frontend AI→automated/system); variant config (`lib/config/variants.ts`, `getVariantConfig` usage).
- **From lite** (vs preview): The lite variant — `VariantId` includes `'lite'`, `getVariantId()` returns `'lite'` when `NEXT_PUBLIC_VARIANT=lite`; `VARIANTS.lite` with flags (`showHowWeGenerate`, `showTransparencyLink`, `showFeaturesGrid`, `showBookTokSummary`, `showReasoningInWarnings`, `showAffiliate`); navbar uses `getVariantConfig().name` (so production shows "Subtext", lite shows "Book Scanner"); footer, book-details, content-warnings-list, and beta-onboarding-modal respect variant flags and copy. Production does not change its build-time variant; the lite variant is available for a separate Lite deployment.
- **Integration**: Merge `lite` into `main` (lite is a superset of preview, so one merge brings both). Resolve any conflicts; ensure production env keeps `NEXT_PUBLIC_VARIANT=public` or unset.

## Impact

- Affected specs: `release-integration` (new capability)
- Affected code: All files that differ between main and lite (variants, navbar, footer, book-details, content-warnings-list, beta-onboarding-modal, page, layout, Settings, aesthetic-themes, recent-scans, content-warning-explanation, globals, terms, privacy, transparency, scan, etc.). See `git diff main..lite --stat`.
- Relationships: Delivers to production the behavior specified in `add-content-warning-explanation`, `add-subtext-lite-variant` (for the lite variant and variant-driven navbar), and `recent-scans` (record scan, auto-scroll carousel). This change is an integration/release; it does not alter the underlying requirements of those changes.
