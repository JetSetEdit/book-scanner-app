# Change: Add Subtext Lite variant (unbranded, minimal, beta-sharing)

## Why

We need a second, unbranded "book scanner" experience to share as a beta link without Subtext branding or AI/automated language. A Lite variant lets us ship one codebase and switch via `NEXT_PUBLIC_VARIANT=lite` on a separate Vercel project (e.g. book-scanner-lite.vercel.app).

## What Changes

- Add a `lite` variant to the existing variant system (`lib/config/variants.ts`): `VariantId = 'public' | 'libraries' | 'schools' | 'lite'`, selected when `NEXT_PUBLIC_VARIANT=lite`.
- **Unbranded**: App name "Book Scanner"; meta title/description and all user-facing copy avoid "Subtext". Tagline and headlines are minimal and generic.
- **Reduce AI/automated language**: Lite uses neutral wording (`analysisSource: "generated"`, `warningLabel: "content"`, `reasoningSubject: "Our"`) and hides or minimizes copy that describes "automated", "AI", or "how we work". The "How we generate these" block, the Transparency link, and the long footer trust statement are hidden in lite. Reasoning/confidence text in the warnings list is hidden or reduced via a `showReasoningInWarnings` flag.
- **Bare minimum UI**: In lite: hide the homepage features grid; hide the BookTok-style summary and the "Dynamic Reader Summary" on book details; hide the "Learn how we work" (Transparency) link and the affiliate paragraph in the footer; use a one-line footer trust and a short beta disclaimer. Beta onboarding modal uses a short, neutral summary (no "automated analysis").
- **Optional flags on VariantConfig**: `flags?: { showHowWeGenerate?: boolean, showTransparencyLink?: boolean, showFeaturesGrid?: boolean, showBookTokSummary?: boolean, showReasoningInWarnings?: boolean, showAffiliate?: boolean }`. Defaults are `true`; lite sets them to `false`. Components check these (with safe `!== false` or `=== true` where appropriate) to hide or show sections.
- **Navbar**: Use `getVariantConfig().name` for the app name in the navbar/logo area (replacing any hardcoded "Subtext" or "Subtext Preview" in that spot) so lite shows "Book Scanner".
- Terms and Privacy pages may retain "Subtext" as the legal entity where required; the app chrome and in-app copy are unbranded in lite.

## Impact

- Affected specs: `app-variants` (new capability)
- Affected code: `lib/config/variants.ts`, `app/page.tsx`, `app/layout.tsx`, `components/navbar.tsx`, `components/footer.tsx`, `components/book-details.tsx`, `components/content-warnings-list.tsx`, `components/beta-onboarding-modal.tsx` (and optionally `lib/content-warning-explanation.ts` or callers that gate on variant). `env.example` documents `NEXT_PUBLIC_VARIANT=lite`.
