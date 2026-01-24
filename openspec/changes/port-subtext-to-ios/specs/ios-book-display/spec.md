## ADDED Requirements

### Requirement: Book detail view

The iOS app SHALL display a comprehensive book detail view showing book metadata (title, author, cover image, ISBN), content warnings, and navigation options. The view SHALL fetch book data from the API or display cached data from CoreData. The view SHALL match the information and layout structure of the web app's book detail page.

#### Scenario: Display book information

- **WHEN** the user navigates to a book detail view (from scan result or history)
- **THEN** the book cover image is displayed at the top
- **AND** book title, author, and ISBN are shown prominently
- **AND** if available, book description or summary is displayed
- **AND** content warnings are listed below the book information

#### Scenario: Content warnings display

- **WHEN** the book has content warnings
- **THEN** warnings are grouped by category or displayed in a list
- **AND** each warning shows severity (mild, moderate, severe) with appropriate visual indicators
- **AND** warning descriptions are displayed in full
- **AND** users can filter warnings by severity if preference is enabled

#### Scenario: No warnings found

- **WHEN** the book has been analyzed but no content warnings were identified
- **THEN** a message is displayed indicating "No content warnings identified"
- **AND** the book information is still fully displayed
- **AND** the user can still view all book metadata

### Requirement: Content warnings filtering and preferences

The iOS app SHALL allow users to filter content warnings by severity (show/hide mild warnings) and display preferences. Preferences SHALL be stored in UserDefaults and persist across app launches. The filtering SHALL apply to the book detail view and any other views displaying warnings.

#### Scenario: Filter mild warnings

- **WHEN** the user has "Hide mild warnings" preference enabled
- **THEN** only moderate and severe warnings are displayed in the book detail view
- **AND** a count indicator shows total warnings vs. displayed warnings (e.g., "Showing 5 of 8 warnings")
- **AND** the user can toggle the filter to show all warnings

#### Scenario: Preference persistence

- **WHEN** the user changes warning display preferences
- **THEN** the preference is saved to UserDefaults
- **AND** the preference persists across app launches
- **AND** the preference applies to all book detail views

### Requirement: Recent scans history

The iOS app SHALL display a list of recently scanned books, showing book covers, titles, and scan timestamps. The list SHALL be fetched from the `/api/recent-scans` endpoint and cached locally in CoreData for offline access. Tapping a book in the history SHALL navigate to the book detail view.

#### Scenario: Display recent scans

- **WHEN** the user opens the recent scans view
- **THEN** a list of recently scanned books is displayed
- **AND** each item shows the book cover, title, and relative timestamp (e.g., "2 hours ago")
- **AND** the list is sorted by most recent first
- **AND** if no scans exist, an empty state message is shown

#### Scenario: Navigate from history

- **WHEN** the user taps a book in the recent scans list
- **THEN** navigation occurs to the book detail view
- **AND** the book detail is loaded from API or CoreData cache
- **AND** if the book is cached, it displays immediately while fresh data loads in background

#### Scenario: Offline access to history

- **WHEN** the user opens recent scans without network connectivity
- **THEN** cached books from CoreData are displayed
- **AND** an indicator shows that data is from cache
- **AND** pull-to-refresh is disabled or shows offline message

### Requirement: Share book functionality

The iOS app SHALL provide iOS Share Sheet integration to share book information and links. Users SHALL be able to share book details, content warnings summary, or a link to the book page on the web app.

#### Scenario: Share book via Share Sheet

- **WHEN** the user taps a share button on the book detail view
- **THEN** the iOS Share Sheet is presented
- **AND** the user can share to Messages, Mail, Notes, or other apps
- **AND** the shared content includes book title, author, and link to web app book page
- **AND** if content warnings exist, a summary is included in the share content
