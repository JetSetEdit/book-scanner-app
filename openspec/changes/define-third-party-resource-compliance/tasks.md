## 1. Specification and design

- [x] 1.1 Ensure proposal.md, design.md, and tasks.md are complete and consistent
- [x] 1.2 Add capability **third-party-resource-compliance** via spec delta (requirements and scenarios)
- [x] 1.3 Run `openspec validate define-third-party-resource-compliance --strict --no-interactive` and fix any issues

## 2. Implementation (documentation only)

- [x] 2.1 Create or update a single source-of-truth document (e.g. `docs/THIRD_PARTY_RESOURCES.md`) that lists each third-party psychology/NLP resource considered or used (e.g. acl23-trigger-warning-assignment, EmoTrigger, CovidET, ACE-NLP, LitEmo), with: name, repo or paper link, license, permitted use (embed with attribution / inspiration-only / cite-only), and attribution or citation requirement
- [x] 2.2 If any MIT-licensed code or data is used in the repo, add or update attribution (e.g. NOTICE file or a clear "Third-party" section in the doc) so that copyright and license are stated
- [x] 2.3 Confirm no GPL-licensed code from LitEmo (or similar) is present in the codebase; document in the policy that GPL resources are methodology/ideas only
- [x] 2.4 Link or reference the new policy from existing docs (e.g. README or DATA_SOURCING_POLICY) where appropriate so contributors and AI agents see it

## 3. Validation

- [x] 3.1 Review the policy doc for completeness and consistency with design decisions (MIT ok with attribution; GPL ideas-only; unlicensed cite and seek permission if redistributing)
