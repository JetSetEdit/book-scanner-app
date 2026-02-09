## ADDED Requirements

### Requirement: PWA install prompt delayed until after first successful scan

The PWA install prompt (beforeinstallprompt) SHALL NOT be shown until the user has completed at least one successful scan (navigated to a book page or results after a completed scan). The system SHALL use a client-side signal (e.g. localStorage key set on first scan success) to gate the prompt. Existing behaviour for "already installed" and "user dismissed in last 7 days" SHALL remain.

#### Scenario: New user has not yet scanned

- **GIVEN** the user has not completed a successful scan (signal not set)
- **AND** the browser has fired beforeinstallprompt
- **WHEN** the app renders the PWA install component
- **THEN** the install dialog is not shown
- **AND** the deferred prompt may be stored for use after first scan

#### Scenario: User completes first successful scan

- **GIVEN** the user completes a scan that results in redirect to book page or results
- **WHEN** the scan completion is handled on the client
- **THEN** the "first successful scan" signal is set (e.g. localStorage)
- **AND** on subsequent page loads the PWA install prompt MAY be shown (subject to 7-day dismiss and install state)

#### Scenario: User already dismissed install recently

- **GIVEN** the user previously dismissed the install prompt and fewer than 7 days have passed
- **WHEN** the app renders the PWA install component
- **THEN** the install dialog is not shown (existing behaviour)
