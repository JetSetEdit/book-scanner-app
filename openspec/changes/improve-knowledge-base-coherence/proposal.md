# Change: Improve knowledge base coherence

## Why

The knowledge base (help hub, FAQ, transparency, privacy, terms, press) exists and is linked from the footer as "Help & policies", but it does not yet have a single specification or consistent structure. Users need a clear, predictable place to find "how we work", policies, and answers. Today: the hub at `/help` lists five sections; some child pages link back to the hub ("Back to Knowledge base") while others (e.g. Privacy) link "Back to Home"; the transparency page title is "Our Roadmap" while the hub labels it "How we work". Improving coherence—single entry point, consistent back-navigation, aligned labels, and verification discipline—will make the knowledge base easier to understand and maintain.

## What Changes

- **New capability: knowledge-base** – Define the knowledge base as a first-class capability with requirements for a single hub, consistent back-navigation from every child page to the hub, aligned section labels with page titles/headings, and maintenance of a verification doc so claims stay accurate against the codebase.
- **Navigation consistency** – Every knowledge base child page (FAQ, Privacy, Terms, Transparency, Press) SHALL offer a back control to the knowledge base hub (`/help`), not to home. (Privacy currently goes "Back to Home"; change to "Back to Knowledge base" → `/help`.)
- **Label alignment** – Hub section labels SHALL match or clearly correspond to the destination page so users know where they are. Resolve any mismatch (e.g. transparency: hub "How we work" vs page title "Our Roadmap") via breadcrumb, subheading, or consistent title.
- **Verification discipline** – Keep `docs/KNOWLEDGE_BASE_VERIFICATION.md` (or equivalent) as the single place to confirm knowledge base claims against the codebase; update it when claims or behaviour change. Optionally add a short FAQ caveat for canon/named-title exceptions so public wording matches the code.

## Impact

- **Affected specs:** New capability `knowledge-base` (ADDED only; no existing spec).
- **Affected code:**
  - `app/help/page.tsx` – Hub; ensure section labels and descriptions align with child pages.
  - `app/faq/page.tsx`, `app/transparency/page.tsx`, `app/privacy/page.tsx`, `app/terms/page.tsx`, `app/press/page.tsx` – Back link to `/help` with consistent label (e.g. "Knowledge base" or "Help & policies").
  - `app/privacy/page.tsx` – Change "Back to Home" to back to knowledge base hub.
  - `app/transparency/page.tsx` – Align visible title/heading with hub label "How we work" (e.g. breadcrumb or subheading).
  - `docs/KNOWLEDGE_BASE_VERIFICATION.md` – Referenced in spec; keep updated when content or code changes.
  - Optional: `docs/FAQ.md` and `app/faq/page.tsx` – One-sentence caveat for canon/named-title inference.
- **Breaking changes:** None.
- **References:** Conversation summary (knowledge base hub at `/help`, footer "Help & policies", verification doc); `docs/KNOWLEDGE_BASE_VERIFICATION.md`.
