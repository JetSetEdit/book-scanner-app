## ADDED Requirements

### Requirement: Homepage visual design

The iOS app homepage SHALL display a visually striking design that communicates the Subtext brand identity and app purpose. The homepage SHALL include a large brand logo/initial, app name, tagline, description text, prominent search bar, and bottom navigation tabs. The design SHALL use a warm, book-focused color palette and serif typography to evoke a literary aesthetic.

#### Scenario: Homepage displays brand identity

- **WHEN** the user opens the app
- **THEN** the homepage displays a large "S" logo/initial in the center
- **AND** the app name "Subtext" is displayed prominently below the logo
- **AND** the tagline "The hidden context of every story." is displayed
- **AND** a description of the app's purpose is shown
- **AND** all text uses serif typography for brand consistency

#### Scenario: Search bar is prominent

- **WHEN** the homepage is displayed
- **THEN** a search bar is visible near the top of the screen
- **AND** the search bar displays a magnifying glass icon
- **AND** the search bar shows placeholder text "Search by title, author, ISBN, genre"
- **AND** the search bar has a rounded, semi-transparent appearance
- **AND** the search bar is easily tappable (at least 44pt height)

#### Scenario: Bottom navigation is accessible

- **WHEN** the homepage is displayed
- **THEN** a bottom tab bar is visible with four tabs: Home, Scan, Bookshelf, Settings
- **AND** the Home tab is visually indicated as selected (highlight color, indicator)
- **AND** each tab displays an icon and label
- **AND** tabs are easily tappable and spaced appropriately

### Requirement: Color system

The iOS app SHALL use a cohesive color palette throughout the homepage and establish a color system for reuse across all screens. The color palette SHALL include background, primary, secondary, and highlight colors that evoke books and reading.

#### Scenario: Color palette is applied

- **WHEN** the homepage is displayed
- **THEN** the background uses a warm beige/cream color (paper-like)
- **AND** primary text and logo use a dark brown/charcoal color
- **AND** secondary text and icons use a medium brown color
- **AND** selected states and accents use a warm brown/orange highlight color
- **AND** colors are consistent across all homepage elements

#### Scenario: Colors meet accessibility standards

- **WHEN** text is displayed on colored backgrounds
- **THEN** contrast ratios meet WCAG AA standards (at least 4.5:1 for normal text)
- **AND** color is not the only indicator of interactive elements
- **AND** text remains readable in all color combinations

### Requirement: Typography system

The iOS app SHALL use a typography system that combines serif fonts for brand identity with system fonts for UI elements. Serif typography SHALL be used for the app name, tagline, and key brand elements to create a literary, book-focused aesthetic.

#### Scenario: Serif typography for brand

- **WHEN** brand elements are displayed
- **THEN** the app name "Subtext" uses a large serif font (44pt, bold)
- **AND** the tagline uses serif typography (30pt, semibold)
- **AND** the large logo initial uses serif typography (120pt, black weight)
- **AND** serif fonts create a cohesive brand identity

#### Scenario: Typography is readable

- **WHEN** text is displayed on the homepage
- **THEN** body text is at least 16pt for readability
- **AND** text scales appropriately on different screen sizes
- **AND** font weights provide clear hierarchy (bold for titles, medium for body)
- **AND** line spacing ensures comfortable reading

### Requirement: Navigation structure

The iOS app SHALL provide bottom tab navigation with four main sections: Home, Scan, Bookshelf, and Settings. The navigation SHALL clearly indicate the currently selected tab and provide easy access to all main app sections.

#### Scenario: Tab navigation displays

- **WHEN** the homepage is displayed
- **THEN** four tabs are visible at the bottom: Home, Scan, Bookshelf, Settings
- **AND** each tab displays an icon and text label
- **AND** the Home tab is visually indicated as selected
- **AND** tabs are evenly spaced and easily tappable

#### Scenario: Tab selection indicator

- **WHEN** a tab is selected
- **THEN** the tab uses the highlight color for icon and text
- **AND** a capsule-shaped indicator appears above the tab (24pt wide, 3pt tall)
- **AND** unselected tabs use the secondary color
- **AND** the selection state is clearly visible
