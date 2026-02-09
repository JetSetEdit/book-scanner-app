## ADDED Requirements

### Requirement: Ads are feature-flagged and placement-controlled

The system SHALL support a monetization config that includes a feature flag for ads (adsEnabled), a list of enabled placements (e.g. results-footer, bookshelf-sidebar, post-scan-panel, weekly-email), and safety rules that block ads in the scan flow, inside warning severity sections, and inside support resources. Ads SHALL render only when the feature flag and the specific placement are enabled.

#### Scenario: Ads disabled by flag

- **GIVEN** adsEnabled is false in config
- **WHEN** the user views the book page, collection page, or scan page
- **THEN** no sponsored content is shown
- **AND** no ad network or third-party script is loaded for ads

#### Scenario: Ads only in allowed surfaces

- **GIVEN** adsEnabled is true and a placement (e.g. results-footer) is enabled
- **WHEN** the user views the corresponding surface (e.g. book page below analysis and support)
- **THEN** a single sponsored card may be shown in that placement only
- **AND** no ad is shown during active scan/loading, inside warning blocks, or inside support resource sections

---

### Requirement: Sponsored content is clearly labeled

Any sponsored or ad content SHALL be presented in a component that displays a clear "Sponsored" label (or equivalent) and SHALL not use animation or audio. There SHALL be at most one sponsored slot per surface. Sponsored content SHALL NOT be tied to or placed inside warning severity or support resource sections.

#### Scenario: Sponsored card is labeled

- **GIVEN** a placement is enabled and a sponsored card is rendered
- **WHEN** the user views the card
- **THEN** the card is visibly labeled as "Sponsored"
- **AND** the card does not auto-play animation or audio
- **AND** trust copy is available (e.g. "Sponsored content never affects warning outcomes or age recommendations")

---

### Requirement: Freemium daily limits and paywall

The system SHALL support a freemium model where the free tier has a limited number of Quick scans per day and no (or limited) Deep scans; a paid tier SHALL allow more Quick scans and Deep scans. Before starting a scan, the system SHALL check whether the user is within their daily limit for the requested scan type; if not, the system SHALL show a paywall modal and SHALL NOT start the scan. The paywall SHALL use copy that explains the limit (e.g. "Free tier complete") and the tagline "Free triage. Pay for depth."

#### Scenario: User within free limit starts scan

- **GIVEN** the user is on the free tier and has not exceeded the daily Quick scan limit
- **WHEN** they initiate a Quick scan
- **THEN** the scan is allowed to start
- **AND** no paywall is shown

#### Scenario: User over free limit sees paywall

- **GIVEN** the user is on the free tier and has reached the daily Quick scan limit
- **WHEN** they attempt to start another Quick scan
- **THEN** a paywall modal is shown with explanatory copy and "Free triage. Pay for depth."
- **AND** the scan does not start until the user upgrades or limit resets

#### Scenario: Tagline on scan/pricing surface

- **GIVEN** the user is on the scan page or a surface that explains Quick vs Deep
- **WHEN** they view the explanation
- **THEN** the tagline "Free triage. Pay for depth." is visible to set pricing expectation
- **AND** it is clear that free tier offers triage and paid tier offers depth
