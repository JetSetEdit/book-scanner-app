## ADDED Requirements

### Requirement: API service for backend communication

The iOS app SHALL provide a centralized API service class that handles all HTTP communication with the Next.js backend. The service SHALL support the same endpoints as the web app (`/api/scan`, `/api/recent-scans`, etc.), handle authentication if needed, parse JSON responses, and provide error handling. The base URL SHALL be configurable (defaulting to `https://subtextscanner.com.au`).

#### Scenario: Successful API request

- **WHEN** the app makes an API request (e.g., scan, recent scans)
- **THEN** the request is sent to the correct endpoint with proper headers
- **AND** JSON response is parsed into Swift models
- **AND** the parsed data is returned to the caller
- **AND** network errors are caught and handled gracefully

#### Scenario: Network error handling

- **WHEN** an API request fails due to network issues (no connectivity, timeout, etc.)
- **THEN** an appropriate error is returned to the caller
- **AND** the error message is user-friendly (e.g., "Unable to connect. Please check your internet connection.")
- **AND** the app does not crash or show technical error details to users
- **AND** cached data is used when available for offline functionality

#### Scenario: API error response

- **WHEN** the API returns an error response (400, 404, 429, 500, etc.)
- **THEN** the error code and message are extracted from the response
- **AND** rate limit errors (429) are handled specially with remaining credits and reset time
- **AND** validation errors (400) show specific field-level messages when available
- **AND** server errors (500) show a generic message without exposing technical details

### Requirement: Streaming scan progress via Server-Sent Events

The iOS app SHALL consume Server-Sent Events (SSE) from the `/api/scan` endpoint to receive real-time progress updates during book scanning. The app SHALL parse SSE messages, extract status updates and progress information, and update the UI in real-time. The streaming connection SHALL handle connection errors, reconnection attempts, and cleanup on completion or cancellation.

#### Scenario: Receive streaming progress updates

- **WHEN** a scan is initiated and the API returns an SSE stream
- **THEN** the app establishes and maintains the SSE connection
- **AND** status messages are received and parsed as they arrive
- **AND** the UI is updated in real-time with each status message
- **AND** progress stages are identified and displayed appropriately

#### Scenario: Stream completion

- **WHEN** the scan completes and the SSE stream closes
- **THEN** the final result is extracted from the stream
- **AND** the connection is properly closed
- **AND** navigation occurs to the book detail view with the scan result
- **AND** the book data is saved to CoreData for offline access

#### Scenario: Stream error or interruption

- **WHEN** the SSE connection fails or is interrupted during a scan
- **THEN** the error is handled gracefully
- **AND** the user is notified of the interruption
- **AND** the app attempts to fetch the final result via a standard API call if possible
- **AND** if recovery fails, an error is shown with retry option

### Requirement: CoreData caching for offline access

The iOS app SHALL use CoreData to cache scanned books locally, enabling offline access to previously scanned books. When a book is scanned or viewed, it SHALL be saved to CoreData with all relevant metadata. When displaying books, the app SHALL check CoreData first for instant display, then fetch fresh data from the API in the background if network is available.

#### Scenario: Save scanned book to cache

- **WHEN** a scan completes successfully
- **THEN** the book data is saved to CoreData
- **AND** content warnings are associated with the book
- **AND** scan timestamp is recorded
- **AND** if the book already exists in cache, it is updated with fresh data

#### Scenario: Load book from cache

- **WHEN** the user navigates to a book detail view
- **THEN** CoreData is queried first for the book
- **AND** if found, cached data is displayed immediately
- **AND** a background API request fetches fresh data if network is available
- **AND** the UI updates when fresh data arrives

#### Scenario: Offline book access

- **WHEN** the user views a book without network connectivity
- **THEN** the book is loaded from CoreData cache
- **AND** an indicator shows that data is cached (e.g., "Last updated 2 hours ago")
- **AND** all cached book information and warnings are displayed
- **AND** the user can browse cached books normally

### Requirement: Rate limit tracking and display

The iOS app SHALL track and display the user's scan credit status, including base credits, bonus credits from referrals, remaining credits, and reset time. Rate limit information SHALL be extracted from API responses and displayed in the scanner interface. The app SHALL prevent scans when credits are exhausted and show appropriate messaging.

#### Scenario: Display rate limit status

- **WHEN** the scanner view is displayed
- **THEN** current scan credits are fetched from the API or last known status
- **AND** the status is displayed (e.g., "3 of 5 scans remaining")
- **AND** if bonus scans are active, they are included (e.g., "3 of 8 scans remaining (5 base + 3 bonus)")
- **AND** a visual indicator (progress bar) shows remaining credits

#### Scenario: Rate limit enforcement

- **WHEN** the user attempts to scan but has 0 remaining credits
- **THEN** the scan button is disabled
- **AND** a message indicates rate limit reached
- **AND** the reset time is displayed (e.g., "Resets at 12:00 AM")
- **AND** referral information is shown if applicable

#### Scenario: Rate limit update after scan

- **WHEN** a scan completes successfully
- **THEN** the rate limit status in the API response is extracted
- **AND** the UI is updated with new remaining credits
- **AND** if credits reach 0, the scan button is disabled for subsequent scans
