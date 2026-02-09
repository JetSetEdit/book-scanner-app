## ADDED Requirements

### Requirement: One-tap fallback to manual ISBN on any camera error

When the barcode scanner cannot use the camera (permission denied, no camera, or other failure), the UI SHALL offer a single, primary fallback action to switch to manual ISBN entry (e.g. "Paste ISBN instead" or "Enter ISBN manually"). This action SHALL be available both when the failure is due to permission and when it is due to other camera errors. Activating it SHALL close the scanner and allow the user to enter an ISBN manually.

#### Scenario: Camera permission denied

- **GIVEN** the user has opened the camera scanner and permission was denied (or not yet granted)
- **WHEN** the permission-error state is shown
- **THEN** a CTA to switch to manual entry (e.g. "Paste ISBN instead") is visible
- **AND** activating it closes the scanner and reveals or focuses the manual ISBN input

#### Scenario: Camera not found or other error

- **GIVEN** the camera failed for a reason other than permission (e.g. no device, hardware error)
- **WHEN** the camera-error state is shown
- **THEN** a CTA to switch to manual entry is the primary fallback
- **AND** activating it closes the scanner and allows manual ISBN entry
