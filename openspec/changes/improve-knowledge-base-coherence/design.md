# Design: Improve knowledge base coherence

## Context

The knowledge base is the set of pages that explain how Subtext works, policies (privacy, terms), press resources, and FAQ. It is reached from the footer via a single link ("Help & policies") to a hub at `/help`, which lists five sections. Child pages are implemented as separate routes; some already link back to the hub, but Privacy links to home. There is no OpenSpec capability for the knowledge base, and no single contract for navigation or label consistency. A verification doc (`docs/KNOWLEDGE_BASE_VERIFICATION.md`) already exists to keep claims accurate against the codebase.

## Goals / Non-Goals

- **Goals:** (1) One clear entry point (hub) and consistent back-navigation so the knowledge base feels like one place. (2) Labels that match between hub and child pages so users are not confused. (3) A spec that defines the knowledge base and verification discipline so future changes stay consistent.
- **Non-Goals:** Full-text search over the knowledge base; moving content into a CMS; changing the actual legal or policy wording beyond alignment and optional caveats.

## Decisions

- **Single entry point:** The hub at `/help` remains the only footer link to the knowledge base. All child pages (FAQ, Privacy, Terms, Transparency, Press) SHALL offer a back control to `/help` with a consistent label (e.g. "Knowledge base"). This avoids "Back to Home" on policy pages so the mental model is "I'm inside the knowledge base."
- **Label alignment:** Hub section labels SHALL match or clearly correspond to the destination page. For Transparency, the page currently uses "Our Roadmap" as the main heading while the hub uses "How we work"; we resolve this by adding a breadcrumb or subheading (e.g. "Knowledge base > How we work") so the hub label appears on the child page.
- **Verification doc:** Keep `docs/KNOWLEDGE_BASE_VERIFICATION.md` as the source of truth for "does this claim match the code?" and reference it in the capability so that when content or code changes, the doc is updated.
- **Optional FAQ caveat:** Add one sentence to the FAQ about canon/named-title exceptions so the public claim "we don't infer from author or genre" is accurate (exceptions are documented).

## Risks / Trade-offs

- **Minimal scope:** We do not add search or in-page jump links in this change to keep the proposal small; those can be a follow-up if needed.
- **Privacy "Back to Home":** Some users may have bookmarked or learned "Privacy has Back to Home." Changing to "Back to Knowledge base" is a small UX change and improves consistency; no migration needed.

## Migration Plan

No data or API migration. Copy and link changes only. Rollback: revert the back-link and label changes if needed.

## Open Questions

- None for this change. Future: consider in-page "Jump to section" for long FAQ or Transparency pages.
