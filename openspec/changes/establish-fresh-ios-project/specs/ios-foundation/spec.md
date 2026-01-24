## ADDED Requirements

### Requirement: Fresh iOS project foundation

The iOS app SHALL be built on a fresh Xcode project foundation that is free of unnecessary dependencies and template code. The project SHALL start with minimal code (app entry point and welcome screen) and build incrementally from there.

#### Scenario: Clean project structure

- **WHEN** the iOS project is opened in Xcode
- **THEN** the project builds without errors
- **AND** the project contains only essential files for Phase 1
- **AND** no CoreData dependencies are active in the entry point
- **AND** the app entry point launches a welcome screen

#### Scenario: Welcome screen as entry point

- **WHEN** the app launches
- **THEN** `Subtext_ScannerApp` launches `WelcomeView()`
- **AND** `WelcomeView` displays a welcome message
- **AND** no CoreData template UI is shown
- **AND** the app runs successfully on iOS Simulator

#### Scenario: Minimal dependencies

- **WHEN** the project is built
- **THEN** only SwiftUI framework is imported in active files
- **AND** CoreData framework is not imported in the app entry point
- **AND** no unused template files are compiled
- **AND** the project structure is clean and minimal

### Requirement: Project cleanup

The iOS project SHALL have all unused template code removed or archived. CoreData template files (ContentView with @FetchRequest, Persistence.swift, .xcdatamodeld) SHALL not be active in the build, though they may remain in the project for reference if needed.

#### Scenario: CoreData files removed or archived

- **WHEN** the project is built
- **THEN** `ContentView.swift` with CoreData code is not compiled (removed or excluded)
- **AND** `Persistence.swift` is not compiled (removed or excluded)
- **AND** `.xcdatamodeld` CoreData model is not included in build
- **AND** the app entry point has no CoreData imports or dependencies

#### Scenario: Clean build output

- **WHEN** the project is built
- **THEN** no warnings about unused CoreData files
- **AND** no errors about missing CoreData entities
- **AND** build succeeds with only essential files
- **AND** app runs showing welcome screen without CoreData template UI
