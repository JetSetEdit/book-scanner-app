# Design: Subtext Lite variant

## Context

- The app already has variants (`public`, `libraries`, `schools`) driven by `NEXT_PUBLIC_VARIANT`. Build-time only; no runtime switching.
- Variants supply `name`, `tagline`, `meta`, `homepage`, `features`, `footer`, and `wording` (e.g. `analysisSource`, `reasoningSubject`). There is no `flags` object today.
- Lite must be unbranded, minimal, and avoid AI/automated language so it can be shared as a generic "book scanner" for beta.

## Goals / Non-Goals

- **Goals**: One codebase; variant-driven behavior; deploy Lite via a separate Vercel project with `NEXT_PUBLIC_VARIANT=lite`; no new routes or env beyond `NEXT_PUBLIC_VARIANT`.
- **Non-Goals**: Runtime switching, A/B testing, or a separate repo. Legal pages (Terms, Privacy) may still name "Subtext" as the entity.

## Decisions

### 1. Extend `VariantConfig` with optional `flags`

Add `flags?: { showHowWeGenerate?: boolean, showTransparencyLink?: boolean, showFeaturesGrid?: boolean, showBookTokSummary?: boolean, showReasoningInWarnings?: boolean, showAffiliate?: boolean }`. When `undefined`, treat as `true` so existing variants need no changes. Lite sets each to `false` where we want to hide.

**Alternatives**: Separate `VariantConfig` type for lite (more branching in code); feature toggles in a different layer (more infra). Chosen: optional flags keep one config shape and minimal `if (v.flags?.showX !== false)` in components.

### 2. Lite copy: short, neutral, no "Subtext" / "AI" / "automated"

- `name`: "Book Scanner"
- `tagline`: "Content warnings for books."
- `meta`: `{ title: "Book Scanner", description: "Scan books to see content warnings. No account required." }`
- `homepage`: One-line headline and subhead; no "Subtext analyzes" or "automated".
- `footer.trustStatement`: One line, e.g. "Content warnings are advisory. Use your judgment."
- `footer.betaDisclaimer`: "Beta—results may vary." or empty.
- `footer.comfortReadPrefix`: "No content warnings detected (Beta)" or "Verified (Beta)".
- `footer.betaModalSummary`: Optional; when set, beta onboarding uses it instead of the default "automated analysis" copy. Lite sets a short, neutral string.
- `wording`: `analysisSource: "generated"`, `analysisSourceTitleCase: "Generated"`, `warningLabel: "content"`, `reasoningSubject: "Our"`. In lite, `showReasoningInWarnings: false` means the reasoning/“Why?” UI is hidden, so `reasoningSubject` matters less.
- Affiliate: `flags.showAffiliate: false` in lite; footer does not render the "Subtext is a participant in the Amazon…" paragraph. We can introduce `footer.affiliateStatement` as optional later if we need lite-specific affiliate text; for now, hide.

### 3. Where each flag is applied

- `showHowWeGenerate`: `book-details.tsx` — do not render the "How we generate these" `Collapsible` when false.
- `showTransparencyLink`: `footer.tsx` — do not render the "Learn how we work" link when false.
- `showFeaturesGrid`: `app/page.tsx` — do not render the 3-column features block when false.
- `showBookTokSummary`: `book-details.tsx` — do not render `BooktokWarningsSummary` and the "Dynamic Reader Summary" (generateSummary) block when false.
- `showReasoningInWarnings`: `content-warnings-list.tsx` — do not render the "Why?" / reasoning disclosure and the "Confidence is based on automated verification…" copy when false; use a short, neutral tooltip or omit.
- `showAffiliate`: `footer.tsx` — do not render the affiliate paragraph when false.

### 4. Navbar app name

The navbar currently may hardcode "Subtext" or "Subtext Preview". It SHALL use `getVariantConfig().name` for the text next to the logo so lite shows "Book Scanner". Logo (`BookSpineLogo`) can stay; it is abstract.

### 5. Deployment

Lite is a separate Vercel project (or preview) with `NEXT_PUBLIC_VARIANT=lite`. No new env keys. Same DB and APIs.

## Risks / Trade-offs

- **More branches in UI**: `flags` add conditionals. Mitigation: only a handful of components; all follow `v.flags?.showX !== false`.
- **Terms/Privacy**: May still say "Subtext". If we need them fully unbranded, we can add variant-aware copy or a `legalEntityName` later. Out of scope for this change.

## Open Questions

- Subdomain or URL for the Lite deployment (e.g. `lite.subtextscanner.com.au` vs `book-scanner-preview.vercel.app`). Left to deployment configuration.
