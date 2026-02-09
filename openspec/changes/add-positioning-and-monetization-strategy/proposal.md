# Change: Add positioning and monetization strategy (Clawbert strategy docs)

## Why

Consolidated strategy feedback (subtext_master_strategy_email, subtext_value_prop_proposal_alt, subtext_landing_template_proposal, subtext_ad_placement_patch) recommends:

1. **Reposition without rebuilding** – The product works; the bottleneck is positioning and distribution. Primary value prop: "Know what's really in a book before assigning, recommending, or buying" for teachers and parents, with clear Quick vs Deep framing.
2. **Homepage structure** – Hero with new copy and CTAs, problem section (3 pain points), solution section (Quick/Deep + why), trust strip, how it works (3 steps), proof section ("Why people use Subtext" with 3 cards), FAQ, and final CTA with tagline "Free triage. Pay for depth."
3. **Trust-safe monetization** – Ads only in low-friction surfaces (results footer, bookshelf sidebar, post-scan panel, weekly email), never during scan flow or inside warning/support sections; optional feature flag. Freemium: free tier with limited Quick scans/day, paid tier for Deep scans and richer outputs; paywall when daily limit reached.
4. **Rollout order** – Copy and homepage first; then results-footer ad; then bookshelf; then freemium + paywall; then optional post-scan and email sponsorship.

This change captures that strategy as spec and implementation tasks so it can be implemented in phases.

## What Changes

- **Homepage positioning** – Update hero headline and subhead to the recommended value prop and support line; add primary/secondary CTAs ("Scan a title now", "See example scans"); add microcopy for Quick vs Deep. Add problem section (shelf/BookTok mismatch, classroom uncertainty, parents need context). Add solution section (Quick Scan 15–30s, Deep Scan 90–120s, clear "why" explanations). Add trust strip (public beta, transparent methodology, indicative guidance, privacy-first). Add "How it works" (3 steps). Add proof section "Why people use Subtext" with three cards (classroom fit check, BookTok reality check, clear-why context). Add FAQ (accuracy, Quick vs Deep, human judgment, official rating, data handling). Add final CTA block ("Run your first scan", "Free triage. Pay for depth.").
- **Monetization guardrails** – Introduce a monetization config (feature flags, placements, safety rules). Add a reusable SponsoredCard component with clear "Sponsored" label. Place ads only where allowed (results footer on book page, bookshelf sidebar on collection page, optional post-scan panel after results; weekly email as content only). Never show ads during active scan/loading, inside warning severity sections, or inside support resources. Add freemium model: daily limits per plan (e.g. free: limited Quick scans, paid: Deep + exports); before starting a scan, check entitlement and show paywall modal when limit reached. Use tagline "Free triage. Pay for depth." on scan/pricing surfaces.
- **Implementation order** – Tasks are ordered so copy and homepage structure ship first; ad placements and freemium follow in the recommended rollout order.

## Impact

- **Affected specs:** New capabilities: homepage-positioning, monetization-guardrails (ADDED via spec deltas).
- **Affected code:**
  - `app/page.tsx` – Hero, problem, solution, trust, how it works, proof section, FAQ, final CTA.
  - `app/book/[isbn]/page.tsx` – Optional results-footer sponsored card (below analysis/support).
  - `app/collection/page.tsx` – Optional bookshelf-sidebar sponsored card.
  - `app/scan/page.tsx` – Freemium gate and paywall when limit reached; optional post-scan panel.
  - New: config for monetization (e.g. `lib/config/monetization.ts` or equivalent), SponsoredCard component, entitlements/limits logic (e.g. `lib/entitlements.ts`).
- **Breaking changes:** None; ads and freemium are additive and feature-flagged or phased.
- **References:** feedback/subtext_ad_placement_patch.md, feedback/subtext_landing_template_proposal.txt, feedback/subtext_master_strategy_email.txt, feedback/subtext_value_prop_proposal_alt.txt.
