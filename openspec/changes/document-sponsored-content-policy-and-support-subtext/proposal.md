# Change: Document sponsored content policy and add Support Subtext

## Why

Stakeholder feedback (see context below) recommends **not activating sponsored content during public beta** and treating it as a last resort. Reasons:

1. **Mission tension** – Subtext exists to give unbiased information about book content. Paid placement on results pages undermines perceived neutrality; teachers, librarians, and parents are sensitive to ed-tech that doubles as lead-gen or ad platforms.
2. **Trust before monetization** – Early users are evangelists; associating Subtext with sponsored content before trust is established can reduce recommendations. The credibility hit is hard to reverse.
3. **Preferred alternatives** – Sustainable funding is still needed; the recommendation is to prefer (a) Amazon Associates (already in place), (b) a prominent "Support Subtext" path (e.g. Ko-fi) for community support, (c) institutional pilots (schools/libraries), and (d) premium features (Deep Scan credits, bulk exports, API) over turning on ad slots in Year 1.

The existing placeholder ad UI (e.g. "Family Reading Conversation Guide" with example.com/guide on the book page) is useful for testing the slot and can be turned on later if needed; this change formalizes the **policy** to keep it off during public beta and adds the **Support Subtext** option so users have a clear way to support the product without ads.

## What Changes

- **Policy documentation** – Formalize that during public beta, sponsored content (results-footer, bookshelf-sidebar, post-scan-panel, weekly-email) SHALL remain disabled by policy. Default config SHALL have `adsEnabled: false`. Enabling ads is a deliberate, post-beta decision when trust and editorial guidelines are established.
- **Support Subtext** – Add a prominent "Support Subtext" link in the footer (and optionally elsewhere) that points to community support (e.g. Ko-fi, Patreon, or a dedicated support page). This gives users a clear, non-ad way to support the product and aligns with "powered by community" positioning.
- **Spec and implementation** – Add requirements to monetization-guardrails for the public-beta policy; add a new support-subtext capability with a requirement for the visible Support link. Implement the footer link and document the policy in config or docs.

## Impact

- **Affected specs:** monetization-guardrails (ADDED requirement: public beta policy); new capability support-subtext (ADDED).
- **Affected code:**
  - `lib/config/monetization.ts` – Ensure default remains `adsEnabled: false`; optional comment or doc reference to this policy.
  - `components/footer.tsx` – Add "Support Subtext" link (e.g. next to Transparency, Terms, Privacy) pointing to configurable URL (Ko-fi or support page).
  - Optional: `lib/config/variants.ts` or a small support config for the Support URL and label.
- **Breaking changes:** None.
- **References:** Stakeholder feedback on subtextscanner.com.au/book/9781627792127 (placeholder sponsored card); recommendation to keep ads off in public beta and add Support Subtext / Ko-fi.
