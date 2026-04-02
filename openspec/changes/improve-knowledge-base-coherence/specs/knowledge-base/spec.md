# knowledge-base – Spec delta

## ADDED Requirements

### Requirement: Single entry point for knowledge base

The system SHALL provide a single knowledge base hub page (e.g. at `/help`) that lists all knowledge base content: how Subtext works (transparency), privacy policy, terms of service, press resources, and FAQ. The main app footer SHALL link to this hub with a single label (e.g. "Help & policies") so users have one clear entry point. The hub SHALL present a short, clear description of what the knowledge base contains and how it is organized.

#### Scenario: User opens knowledge base from footer

- **WHEN** the user is on any page that shows the footer
- **THEN** the footer SHALL include a link to the knowledge base hub (e.g. "Help & policies" → `/help`)
- **AND** following that link SHALL show the hub page listing all knowledge base sections with titles and short descriptions

#### Scenario: Hub lists all knowledge base sections

- **GIVEN** the user is on the knowledge base hub page
- **WHEN** the page is displayed
- **THEN** the hub SHALL list at least: How we work (transparency), Privacy Policy, Terms of Service, Press, and FAQ
- **AND** each listed section SHALL link to the corresponding child page
- **AND** the hub SHALL display a brief overall description (e.g. how we work, policies, press, and common questions)

### Requirement: Consistent back-navigation to knowledge base hub

Every knowledge base child page (FAQ, Privacy, Terms, Transparency, Press) SHALL offer a back control (e.g. button or link) that navigates to the knowledge base hub (`/help`) with a consistent label (e.g. "Knowledge base" or "Back to Knowledge base"). Child pages SHALL NOT offer "Back to Home" as the primary back target when the user reached them from the knowledge base; the primary back target SHALL be the hub so the knowledge base feels like one coherent place.

#### Scenario: User returns from child page to hub

- **GIVEN** the user is on a knowledge base child page (FAQ, Privacy, Terms, Transparency, or Press)
- **WHEN** the user activates the back control (e.g. "Back to Knowledge base")
- **THEN** the app SHALL navigate to the knowledge base hub (`/help`)
- **AND** the back control label SHALL be consistent across all five child pages

#### Scenario: No child page uses "Back to Home" as primary back target

- **GIVEN** any knowledge base child page
- **WHEN** the page is displayed
- **THEN** the primary back control SHALL point to the knowledge base hub (`/help`), not to the app home (`/`)

### Requirement: Aligned labels between hub and child pages

The knowledge base hub section labels SHALL match or clearly correspond to the destination page title or main heading so users know where they are. If the hub uses a label (e.g. "How we work") that differs from the child page main title (e.g. "Our Roadmap"), the child page SHALL expose the hub label (e.g. via breadcrumb or subheading) so the relationship is clear.

#### Scenario: Hub label visible on child page

- **GIVEN** the hub lists a section with label "How we work" linking to the transparency page
- **WHEN** the user opens that page
- **THEN** the page SHALL show the hub label "How we work" (e.g. in a breadcrumb like "Knowledge base > How we work" or as a subheading) in addition to any page-specific title
- **AND** the same principle SHALL apply for other sections where hub label and page title might differ

#### Scenario: Hub section titles correspond to destination

- **GIVEN** the knowledge base hub
- **WHEN** each section is displayed
- **THEN** the section title and short description SHALL correspond to the linked page so that after navigation the user sees a matching or clearly related heading/title

### Requirement: Verification of knowledge base claims

Claims made in knowledge base content (FAQ, transparency, privacy, terms, press) SHALL be verifiable against the codebase. The project SHALL maintain a verification document (e.g. `docs/KNOWLEDGE_BASE_VERIFICATION.md`) that records which claims have been checked and any exceptions (e.g. canon whitelist, named-title reputation). The verification doc SHALL be updated when knowledge base copy or relevant code changes so that public wording remains accurate.

#### Scenario: Verification doc exists and is updated

- **WHEN** a substantive claim in the knowledge base (FAQ, transparency, privacy, terms, or press) is added or changed
- **THEN** the verification doc SHALL be updated to confirm the claim against the codebase or to record an exception
- **AND** when relevant code behaviour changes, the verification doc SHALL be updated so that documented verdicts (true, mostly true, inaccurate) remain current

#### Scenario: Exceptions documented

- **GIVEN** the codebase has behaviour that qualifies a general claim (e.g. "we never infer from author or genre" is qualified by canon whitelist and named-title reputation)
- **WHEN** the knowledge base makes that general claim
- **THEN** the verification doc SHALL record the exception
- **AND** the public copy SHOULD include a short caveat (e.g. in the FAQ) so users see the nuance, or the general claim SHOULD be softened to match the code
