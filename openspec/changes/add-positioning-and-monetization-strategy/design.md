# Design: Positioning and monetization strategy

## Context

Subtext is repositioning around a concrete value proposition for teachers and parents (suitability check in under a minute; Quick vs Deep) without rebuilding the product. Strategy docs also define trust-safe monetization: ads only in low-friction surfaces, and freemium (free triage, pay for depth). Sole-trader operation; trust and clarity are non-negotiable.

## Goals / Non-Goals

- **Goals:** (1) Homepage copy and structure that communicate the new value prop and support conversion (scan start, completion, return usage). (2) Monetization (ads + freemium) that does not undermine trust: no ads in scan flow or warning/support blocks; clear "Sponsored" labeling; freemium limits and paywall with clear copy. (3) Implementation that can be phased (copy first, then ads, then freemium).
- **Non-Goals:** Rebuilding the scan engine; implementing weekly email template or sponsor campaigns in this change; A/B testing infrastructure; full paywall/payment integration (paywall modal and limits logic are in scope; payment provider is out of scope).

## Decisions

- **Copy source of truth:** Use the paste-ready hero, proof section, and tagline from subtext_value_prop_proposal_alt.txt and subtext_landing_template_proposal.txt. Problem/solution/trust/FAQ content from subtext_master_strategy_email and landing template.
- **Ad placements:** Follow subtext_ad_placement_patch.md. Allowed surfaces: results footer (book page, below analysis and support), bookshelf sidebar (collection page), post-scan panel (after results render on scan page), weekly email (content only, no new component in this change). Block in: active scan/loading, warning severity sections, support resources. Feature flag controls whether any ads render.
- **SponsoredCard:** Single reusable component; always shows "Sponsored" label; no animation/audio; one slot per surface. Data model: placement id, title, description, CTA label, CTA URL, optional image/advertiser; can be hardcoded or from config initially.
- **Freemium:** Plan types (e.g. free, plus); daily limits (e.g. free: N Quick scans, 0 Deep; plus: higher Quick + Deep). Before starting a scan, call entitlement check; if over limit, show paywall modal with copy ("Free tier complete" / "Free triage. Pay for depth."). Scan counts can be stored server-side (e.g. by IP or session for anonymous; by user when auth exists) or derived from existing scan API usage; exact storage is implementation detail.
- **Rollout order:** (1) Homepage copy and structure. (2) Results-footer ad (optional, behind flag). (3) Bookshelf sidebar ad. (4) Freemium limits + paywall. (5) Optional post-scan panel and email sponsorship.

## Risks / Trade-offs

- **Copy change risk:** Homepage copy is user-facing; review before deploy. Mitigation: implement in a branch, preview on Vercel.
- **Freemium without auth:** Daily limits by IP/session can be gamed; acceptable for initial phase. Mitigation: document as limitation; add auth-based limits later if needed.
- **Ad content:** SponsoredCard content (title, URL) must be trusted (direct/deal). Mitigation: config or admin-controlled; no third-party script in initial implementation.

## Migration Plan

- No data migration required for copy or ad placements.
- Freemium: if scan-count storage is added, backfill is not required for "free" users at launch; counts can start from zero.

## Open Questions

- Exact daily limits for free tier (e.g. 3 Quick scans/day) to be set at implementation time.
- Whether post-scan panel and weekly email sponsorship are in first implementation or a follow-up.
