# Tasks: Improve knowledge base coherence

## 1. Specification and documentation

- [x] 1.1 Add `openspec/specs/knowledge-base/spec.md` from this change's delta (after approval and archive merge).
- [x] 1.2 Ensure `docs/KNOWLEDGE_BASE_VERIFICATION.md` exists and is referenced in the knowledge-base spec or project docs for ongoing verification.

## 2. Navigation consistency

- [x] 2.1 Change Privacy page back link from "Back to Home" (→ `/`) to "Back to Knowledge base" (→ `/help`) so it matches FAQ, Terms, Transparency, and Press.
- [x] 2.2 Confirm FAQ, Terms, Transparency, and Press each have a back control to `/help` with a consistent label (e.g. "Knowledge base" or "Help & policies").

## 3. Label and title alignment

- [x] 3.1 On the Transparency page, align visible identity with hub label "How we work": add a breadcrumb (e.g. "Knowledge base > How we work") or a subheading so users see the same label as on the hub.
- [x] 3.2 Review hub section titles and descriptions in `app/help/page.tsx` so they match or clearly correspond to each destination page heading/title.

## 4. Verification and optional copy

- [x] 4.1 (Optional) Add one short sentence to FAQ (e.g. under "Why might two similar books get different warnings?") stating that for a small set of well-known classics and a few named titles we may use established literary or genre context when descriptions are vague, so public wording matches the codebase (canon whitelist, named-title reputation).
- [x] 4.2 Run a quick check that no knowledge base page claims "we never infer from author or genre" without the optional caveat, or add the caveat and re-verify.

## 5. Validation

- [x] 5.1 Manually verify: from footer "Help & policies" → hub → each of How we work, Privacy, Terms, Press, FAQ → back control returns to hub in every case.
- [x] 5.2 Run `openspec validate improve-knowledge-base-coherence --strict --no-interactive` and fix any issues before marking proposal complete.
