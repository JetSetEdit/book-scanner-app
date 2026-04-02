# Tasks: Document sponsored content policy and Support Subtext

## 1. Policy and spec

- [x] 1.1 Add requirement to monetization-guardrails: during public beta, sponsored content SHALL remain disabled by policy; default config SHALL have adsEnabled false (delta in `specs/monetization-guardrails/spec.md`).
- [x] 1.2 Add support-subtext capability with requirement: app SHALL show a prominent "Support Subtext" link (e.g. in footer) to community support (configurable URL); scenario for visibility (delta in `specs/support-subtext/spec.md`).
- [x] 1.3 In `lib/config/monetization.ts` (or adjacent doc), add a short comment or reference that during public beta sponsored content is off by policy; ensure default remains `adsEnabled: false`.

## 2. Support Subtext link

- [x] 2.1 Add config or variant entry for Support Subtext label and URL (e.g. "Support Subtext", Ko-fi URL or /support).
- [x] 2.2 In `components/footer.tsx`, add "Support Subtext" link alongside Learn how we work, Terms, Privacy, Feedback, using the configured URL and label.
- [x] 2.3 Verify link is visible on all pages that show the footer (home, book, collection, scan, settings, etc.).

## 3. Validation

- [x] 3.1 Run `openspec validate document-sponsored-content-policy-and-support-subtext --strict --no-interactive` and fix any issues.
- [x] 3.2 Manual check: footer shows Support Subtext link; ad slots remain off with default config.
