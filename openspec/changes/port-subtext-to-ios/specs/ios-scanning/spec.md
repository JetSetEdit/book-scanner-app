## ADDED Requirements

### Requirement: Native iOS barcode scanning

The iOS app SHALL provide native barcode scanning using AVFoundation and Vision framework to detect ISBN-13 and ISBN-10 barcodes from book covers. The scanner SHALL display a live camera preview with a scanning overlay, automatically detect barcodes in the camera frame, and extract ISBN values. The scanner SHALL request camera permissions when first launched and handle permission denial gracefully by offering manual ISBN entry as an alternative.

#### Scenario: Successful barcode scan

- **WHEN** the user opens the scanner and points the camera at a book barcode
- **AND** camera permissions are granted
- **THEN** the camera preview is displayed with a scanning overlay
- **AND** when a valid ISBN barcode is detected, the ISBN is automatically extracted
- **AND** the scan process is initiated with the detected ISBN
- **AND** the camera view dismisses and shows scan progress

#### Scenario: Camera permission denied

- **WHEN** the user opens the scanner for the first time
- **AND** camera permission is denied
- **THEN** a message is displayed explaining why camera access is needed
- **AND** a button is shown to open iOS Settings to grant permission
- **AND** manual ISBN entry is available as an alternative
- **AND** the app continues to function without camera access

#### Scenario: Manual ISBN entry

- **WHEN** the user chooses to enter ISBN manually or camera is unavailable
- **THEN** a text input field is displayed
- **AND** the user can type or paste an ISBN
- **AND** ISBN validation occurs before allowing scan submission
- **AND** invalid ISBNs show an error message with format requirements

### Requirement: Scan progress display

The iOS app SHALL display real-time progress updates during the scan process, showing the current stage (Finding book information, Analyzing content, etc.) and recent status messages. Progress SHALL be received via Server-Sent Events (SSE) from the `/api/scan` endpoint and displayed in a user-friendly format matching the web app's progress stages.

#### Scenario: Scan progress updates

- **WHEN** a scan is initiated (via barcode or manual entry)
- **THEN** a progress view is displayed showing the current stage
- **AND** status messages are updated in real-time as they arrive from the API
- **AND** the progress indicator shows which of the 4 main stages is active
- **AND** recent status messages are displayed in a list below the progress indicator

#### Scenario: Scan completion

- **WHEN** the scan completes successfully
- **THEN** the progress view transitions to show success state
- **AND** navigation automatically occurs to the book detail view
- **AND** if the book already exists, navigation occurs immediately without showing progress

#### Scenario: Scan error

- **WHEN** a scan fails (network error, invalid ISBN, rate limit, etc.)
- **THEN** an error message is displayed with clear explanation
- **AND** the user can retry the scan or return to the scanner
- **AND** rate limit errors show remaining credits and reset time

### Requirement: Candidate selection for ambiguous ISBNs

The iOS app SHALL display a candidate selection interface when multiple books match the scanned ISBN. The interface SHALL show book covers, titles, authors, and sources for each candidate, allowing the user to select the correct book. After selection, the scan SHALL proceed with the selected candidate.

#### Scenario: Multiple candidates found

- **WHEN** a scan returns multiple candidate books for the ISBN
- **THEN** a list of candidates is displayed with covers, titles, and authors
- **AND** each candidate shows its source (Google Books, Open Library)
- **AND** the user can tap a candidate to select it
- **AND** after selection, the scan proceeds with the selected book
- **AND** the candidate list dismisses and progress view appears

### Requirement: Rate limit display and handling

The iOS app SHALL display the user's current scan credit status, showing remaining scans for the day and total limit. When rate limit is reached, the app SHALL clearly indicate this and prevent further scans until credits reset. Rate limit information SHALL be fetched from the scan API response and displayed in the scanner interface.

#### Scenario: Rate limit status display

- **WHEN** the scanner view is displayed
- **THEN** the current scan credit status is shown (e.g., "3 of 5 scans remaining")
- **AND** if bonus scans are active, they are included in the total
- **AND** a progress bar or indicator shows remaining credits visually

#### Scenario: Rate limit reached

- **WHEN** the user attempts to scan but has no remaining credits
- **THEN** the scan button is disabled
- **AND** a message is displayed indicating rate limit reached
- **AND** the reset time is shown (e.g., "Resets at 12:00 AM")
- **AND** referral options are displayed if applicable
