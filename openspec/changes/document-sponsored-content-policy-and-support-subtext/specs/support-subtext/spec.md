## ADDED Requirements

### Requirement: Prominent Support Subtext link for community funding

The application SHALL display a prominent "Support Subtext" link (or equivalent label from config) that allows users to support the product via community funding (e.g. Ko-fi, Patreon, or a dedicated support page). The link SHALL be visible in the footer on all pages that show the footer, and SHALL point to a configurable URL so the destination can be updated without code change.

#### Scenario: User sees Support Subtext in footer

- **GIVEN** the user is on any page that renders the site footer (e.g. home, book page, collection, scan, settings)
- **WHEN** they view the footer
- **THEN** a "Support Subtext" link (or configured label) is visible alongside other footer links (e.g. Learn how we work, Terms, Privacy, Feedback)
- **AND** the link points to the configured support URL (e.g. Ko-fi page or /support)
- **AND** the link is clearly identifiable as a way to support the product, not as a legal or transparency link
