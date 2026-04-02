## ADDED Requirements

### Requirement: Public beta policy keeps sponsored content disabled

During public beta, sponsored content (all placements: results-footer, bookshelf-sidebar, post-scan-panel, weekly-email) SHALL remain disabled by policy. The default configuration SHALL have the ads feature flag set to false. Enabling sponsored content is a deliberate, post-beta decision when trust is established and editorial guidelines for sponsors are in place. The system SHALL NOT show sponsored cards when the feature flag is false.

#### Scenario: Public beta default is no ads

- **GIVEN** the application is in public beta and configuration has not been overridden
- **WHEN** the user views the book page, collection page, or any surface where ad placements exist
- **THEN** no sponsored content is shown
- **AND** the monetization config has adsEnabled set to false by default
- **AND** turning on ads requires an explicit configuration change and is intended only after beta when policy allows
