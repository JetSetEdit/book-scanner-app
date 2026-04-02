# Design: Sponsored content policy and Support Subtext

## Context

Subtext is in public beta. The positioning-and-monetization work (add-positioning-and-monetization-strategy) added feature-flagged ad placements (results footer, bookshelf sidebar, etc.) and a SponsoredCard component with placeholder content. Stakeholder feedback recommends **not activating** those slots during public beta and treating sponsored content as a last resort, while offering a clear "Support Subtext" path (e.g. Ko-fi) so the product can be funded without ads.

## Goals / Non-Goals

- **Goals:** (1) Document the policy that sponsored content remains off during public beta and that enabling it is a deliberate post-beta decision. (2) Add a prominent "Support Subtext" link so users can support the product via community funding (Ko-fi or similar). (3) Keep the existing ad placeholder UI and config in place for future use without changing default behavior.
- **Non-Goals:** Implementing payment or Ko-fi integration in-app (link only); changing Amazon Associates; building institutional or premium features in this change.

## Decisions

- **Public beta policy:** Sponsored content (all placements) SHALL remain disabled by default. The config SHALL have `adsEnabled: false`. Turning ads on is an explicit, post-beta decision when (a) trust is established and (b) editorial guidelines for sponsors are clear. No code change is required to "turn off" ads—they are already off; we document this as policy and reflect it in a spec requirement.
- **Support Subtext:** A single, prominent link in the footer (e.g. "Support Subtext") SHALL link to a configurable URL (e.g. Ko-fi, Patreon, or a /support page). Implementation: add the link to the footer next to existing links (Learn how we work, Terms, Privacy, Feedback); URL and label from config or variant so they can be updated without code change.
- **When to reconsider ads:** If sustainable funding is needed later, preferred order is: (1) Amazon Associates (already in place), (2) Support Subtext / community funding, (3) institutional pilots (schools/libraries), (4) premium features (Deep Scan credits, exports, API). Sponsored content slots are last resort; re-enable only after beta and with clear editorial boundaries.

## Risks / Trade-offs

- **Policy only:** This change documents policy and adds a link; it does not remove or alter the ad UI. If someone flips `adsEnabled` to true, ads will show. Mitigation: document in config and in handover/spec so the default and rationale are clear.
- **Support URL:** If the URL is hardcoded initially, it can be moved to config in a follow-up. Prefer config or variant from the start if trivial.

## Migration Plan

- No data migration. Config already has `adsEnabled: false`. Footer gains one link.

## Open Questions

- Exact destination URL for "Support Subtext" (Ko-fi, Patreon, or /support page) to be set at implementation time.
- Whether to add a short support page (/support) that explains how to support and links out, or link directly to Ko-fi.
