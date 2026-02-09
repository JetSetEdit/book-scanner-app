# Tasks: Add positioning and monetization strategy

## 1. Homepage positioning (copy and structure)

- [x] 1.1 Add copy constants or config for value prop, hero, problem, solution, trust, proof cards, FAQ, and tagline (sourced from feedback docs).
- [x] 1.2 Update homepage hero: headline "Know what's really in a book before assigning, recommending, or buying." (or approved variant); subhead with 60-second suitability for teachers and parents; primary CTA "Scan a title now"; secondary CTA "See example scans"; microcopy for Quick vs Deep.
- [x] 1.3 Add problem section with three pain points: shelf/BookTok mismatch, classroom suitability uncertainty, parents need context before buying.
- [x] 1.4 Add solution section: Quick Scan (15–30s) first-pass triage, Deep Scan (90–120s) higher-confidence, clear "why" explanations.
- [x] 1.5 Add trust strip: public beta, transparent methodology, indicative guidance (not official board), privacy-first.
- [x] 1.6 Add "How it works" (3 steps): search/scan → review warnings + age + context → decide (assign, recommend, buy, skip).
- [x] 1.7 Add proof section "Why people use Subtext" with three cards: classroom fit check, BookTok reality check, clear-why context.
- [x] 1.8 Add FAQ section with high-conversion questions: accuracy, Quick vs Deep, human judgment, official rating, data handling.
- [x] 1.9 Add final CTA block: "Run your first scan" with subline "Free triage. Pay for depth."

## 2. Monetization config and ad component

- [x] 2.1 Add monetization config (e.g. lib/config/monetization.ts): adsEnabled, placements (resultsFooter, bookshelfSidebar, postScanPanel, weeklyEmail), safety (blockInScanFlow, blockInWarnings, blockInSupportResources); types for AdPlacement and SponsoredItem.
- [x] 2.2 Add SponsoredCard component: "Sponsored" label, title, description, CTA link; compact variant; aria-label and data-testid; no animation/audio.
- [x] 2.3 Add results-footer placement: on book page (app/book/[isbn]/page.tsx), below analysis and support resources; render only when adsEnabled and placements.resultsFooter; single SponsoredCard (content from config or placeholder).
- [x] 2.4 Add bookshelf-sidebar placement: on collection page (app/collection/page.tsx); sticky sidebar when enabled; single compact SponsoredCard.
- [ ] 2.5 Optional: Add post-scan panel placement on scan page after results are visible; single compact SponsoredCard.

## 3. Freemium guardrails

- [x] 3.1 Add entitlements module (e.g. lib/entitlements.ts): plan type, getDailyLimits(plan), canRunScan({ plan, scanType, usedQuick, usedDeep }); document storage for used counts (e.g. by IP/session or existing scan API).
- [x] 3.2 On scan page (or scan start flow), before starting a scan: check canRunScan; if false, show paywall modal with title/subtitle ("Free tier complete", "Free triage. Pay for depth.") and do not start scan.
- [x] 3.3 Surface tagline "Free triage. Pay for depth." on scan or pricing surface where Quick vs Deep is explained.
- [x] 3.4 Increment or read daily scan usage when a scan is started/completed so limits are enforced (implementation depends on storage choice).

## 4. Validation and docs

- [ ] 4.1 Manual verification: homepage renders all new sections; CTAs and links work; ad placements appear only when enabled and in correct positions; paywall appears when limit reached.
- [x] 4.2 Add trust copy where appropriate: "Sponsored content never affects warning outcomes or age recommendations" (e.g. near SponsoredCard or in transparency page).
- [x] 4.3 Document rollout order and feature flags in proposal or README so future work (weekly email sponsorship, payment integration) is clear.
