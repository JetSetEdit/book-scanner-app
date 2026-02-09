## ADDED Requirements

### Requirement: Scan progress shows three clear steps to the user

During an active ISBN scan, the UI SHALL present progress as three primary steps: (1) Finding metadata, (2) Analyzing content, (3) Generating summary. The implementation SHALL map the existing backend progress stages to these three steps (e.g. stages 1–2 → steps 1–2, stages 3–4 → step 3). Granular "current step" or "recent steps" messages MAY still be shown for detail.

#### Scenario: User starts a scan

- **GIVEN** the user has submitted an ISBN and the scan is in progress
- **WHEN** the progress UI is visible
- **THEN** the primary labels reflect the three steps (Finding metadata / Analyzing content / Generating summary)
- **AND** the active step matches the current backend stage

#### Scenario: Scan moves from metadata to analysis

- **GIVEN** the scan has completed metadata fetch and started analysis
- **WHEN** the progress UI updates
- **THEN** the second step ("Analyzing content") is indicated as active
- **AND** the user can distinguish it from "Finding metadata" and "Generating summary"
