## 1. Variant config

- [x] 1.1 In `lib/config/variants.ts`: add `'lite'` to `VariantId`; in `getVariantId()` return `'lite'` when `NEXT_PUBLIC_VARIANT === 'lite'`.
- [x] 1.2 Extend `VariantConfig` with optional `flags?: { showHowWeGenerate?: boolean, showTransparencyLink?: boolean, showFeaturesGrid?: boolean, showBookTokSummary?: boolean, showReasoningInWarnings?: boolean, showAffiliate?: boolean }`. For `public`, `libraries`, `schools`, leave `flags` undefined (components treat undefined as true).
- [x] 1.3 Add `lite` entry to `VARIANTS` with: `name: "Book Scanner"`, `tagline`, `meta`, `homepage` (minimal one-line headline/subhead), `features` (can be stubs; grid is hidden), `footer` (short `trustStatement`, short `betaDisclaimer`, `comfortReadPrefix`, optional `betaModalSummary`), `wording` (generated/content/Our), and `flags: { showHowWeGenerate: false, showTransparencyLink: false, showFeaturesGrid: false, showBookTokSummary: false, showReasoningInWarnings: false, showAffiliate: false }`.
- [x] 1.4 In `env.example`, document `NEXT_PUBLIC_VARIANT=public|libraries|schools|lite` and note that `lite` is for the unbranded beta.

## 2. Components (flags and copy)

- [x] 2.1 **navbar**: Use `getVariantConfig().name` for the app name text next to the logo (replace any hardcoded "Subtext" / "Subtext Preview" in that spot).
- [x] 2.2 **app/page.tsx**: When `getVariantConfig().flags?.showFeaturesGrid === false`, do not render the features grid section.
- [x] 2.3 **footer**: When `flags.showTransparencyLink === false`, do not render the "Learn how we work" link. When `flags.showAffiliate === false`, do not render the affiliate paragraph. Use `footer.trustStatement`, `footer.betaDisclaimer`, `footer.comfortReadPrefix` from the variant (lite has short strings).
- [x] 2.4 **book-details**: When `flags.showHowWeGenerate === false`, do not render the "How we generate these" `Collapsible`. When `flags.showBookTokSummary === false`, do not render `BooktokWarningsSummary` and the "Dynamic Reader Summary" (generateSummary) block.
- [x] 2.5 **content-warnings-list**: When `flags.showReasoningInWarnings === false`, hide the "Why?" / reasoning disclosure and the "Confidence is based on automated verification…" paragraph (or replace with a one-line neutral tooltip). Prefer hiding over rewording for bare minimum.
- [x] 2.6 **beta-onboarding-modal**: When variant is lite, use `footer.betaModalSummary` if defined, otherwise a short fallback (e.g. "Content warnings are generated from book information. Beta—results may vary. Use your judgment.") so the modal does not say "automated analysis" or "AI".

## 3. Verification

- [ ] 3.1 Run the app with `NEXT_PUBLIC_VARIANT=lite` (e.g. in .env.local) and verify: app name "Book Scanner"; no "Subtext" in hero/footer; no features grid; no "How we generate these"; no "Learn how we work"; no affiliate; no BookTok summary / Dynamic Reader Summary on book page; no reasoning/confidence copy in warnings list; beta modal uses neutral copy. Terms/Privacy still load.
- [ ] 3.2 Switch back to `NEXT_PUBLIC_VARIANT=public` and confirm existing behavior is unchanged.
