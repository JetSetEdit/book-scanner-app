## ADDED Requirements

### Requirement: Incremental iOS app development

The iOS app SHALL be built incrementally, starting with the simplest possible working implementation and adding features one at a time. Each phase SHALL be fully working before moving to the next phase. The development approach SHALL prioritize getting basic functionality working over implementing advanced features.

#### Scenario: Phase 1 - Minimal working app

- **WHEN** the iOS project is created or cleaned
- **THEN** the app builds without errors
- **AND** the app runs on iOS simulator
- **AND** displays at least one view (even if with placeholder data)
- **AND** basic navigation structure is in place

#### Scenario: Phase 2 - First API integration

- **WHEN** the app displays recent scans
- **THEN** it fetches data from GET /api/recent-scans endpoint
- **AND** displays the list of recent scans with book covers and titles
- **AND** handles network errors gracefully (shows error message)
- **AND** shows empty state when no scans are available

#### Scenario: Phase 3 - Manual ISBN scanning

- **WHEN** the user enters an ISBN manually
- **AND** taps the scan button
- **THEN** the app sends POST request to /api/scan endpoint
- **AND** displays the scan result (success or error)
- **AND** navigates to book detail view on success
- **AND** shows appropriate error message on failure

#### Scenario: Phase 4 - Book detail view

- **WHEN** the user taps a book from recent scans or scan result
- **THEN** the app navigates to book detail view
- **AND** displays book title, author, cover image
- **AND** displays book description if available
- **AND** navigation back to previous view works correctly

#### Scenario: Phase 5 - Content warnings display

- **WHEN** the book detail view is displayed
- **AND** the book has content warnings
- **THEN** the warnings are displayed in a list
- **AND** each warning shows severity (mild, moderate, severe) with visual indicators
- **AND** warning descriptions are readable
- **AND** if no warnings exist, appropriate message is shown

#### Scenario: Phase 6 - Native barcode scanning

- **WHEN** the user opens the scanner view
- **AND** camera permission is granted
- **THEN** camera preview is displayed
- **AND** when a valid ISBN barcode is detected, the ISBN is extracted
- **AND** scan is automatically triggered with detected ISBN
- **AND** if permission is denied, manual entry option is available

#### Scenario: Phase 7 - Progress display

- **WHEN** a scan is in progress
- **THEN** a loading indicator is displayed
- **AND** a progress message is shown (e.g., "Scanning...")
- **AND** the UI is disabled to prevent duplicate scans
- **AND** when scan completes, progress indicator is removed

#### Scenario: Phase 8 - Streaming progress (advanced)

- **WHEN** a scan is in progress with streaming enabled
- **THEN** progress updates are received via Server-Sent Events
- **AND** progress messages are displayed in real-time
- **AND** progress stages are indicated (finding book, analyzing, etc.)
- **AND** stream errors are handled gracefully

### Requirement: Simple API integration pattern

The iOS app SHALL use a simple, straightforward API client pattern. Each API endpoint SHALL be integrated one at a time, with the integration verified to work before moving to the next endpoint. Complex abstractions and patterns SHALL be avoided until simpler approaches prove insufficient.

#### Scenario: Simple GET request

- **WHEN** the app needs to fetch recent scans
- **THEN** it uses URLSession with a simple GET request
- **AND** parses JSON response into Codable models
- **AND** handles errors with try/catch
- **AND** updates UI on main thread

#### Scenario: Simple POST request

- **WHEN** the app needs to scan a book
- **THEN** it uses URLSession with POST request and JSON body
- **AND** waits for complete response (no streaming initially)
- **AND** parses JSON response into ScanResult model
- **AND** handles rate limit errors (429 status) appropriately

### Requirement: Progressive feature addition

Features SHALL be added in order of increasing complexity. Each feature SHALL be fully implemented and tested before the next feature is started. Features that depend on others SHALL be added after their dependencies.

#### Scenario: Feature dependency order

- **GIVEN** the incremental development approach
- **WHEN** adding features
- **THEN** read-only features (recent scans) are added before write features (scanning)
- **AND** manual input (ISBN entry) is added before camera input (barcode scanning)
- **AND** simple request/response is added before streaming
- **AND** in-memory data is used before offline caching

#### Scenario: Feature verification before next

- **WHEN** a feature is implemented
- **THEN** it is tested to work correctly
- **AND** error cases are handled
- **AND** UI is functional
- **AND** only then is the next feature started
