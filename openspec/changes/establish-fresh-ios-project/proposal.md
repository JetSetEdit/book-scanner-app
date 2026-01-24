# Change: Establish Fresh iOS Project Foundation

## Why

A completely fresh iOS project has been created in `Subtext-Scanner/` directory to start Phase 1 with a clean slate. This new project:
- Removes all complexity from the previous attempt
- Starts with minimal Xcode template (SwiftUI + CoreData template, but CoreData will be removed)
- Provides a clean foundation for incremental feature addition
- Uses `WelcomeView` as the entry point instead of default CoreData template UI

The fresh project structure allows us to build incrementally without carrying over issues from previous attempts.

## What Changes

- **New Project Location**: `Subtext-Scanner/Subtext Scanner/` (separate from previous `Subtext Scanner/`)
- **Entry Point**: `Subtext_ScannerApp.swift` launches `WelcomeView()` instead of CoreData template
- **Welcome Screen**: Simple `WelcomeView.swift` with basic welcome message (to be enhanced in Phase 1)
- **CoreData Removal**: `ContentView.swift` and `Persistence.swift` exist but are not used (will be removed/archived)
- **Clean Foundation**: Minimal project structure ready for incremental feature addition

## Impact

- **Affected specs**: New iOS foundation capability
- **Affected code**: 
  - New project in `Subtext-Scanner/` directory
  - Old project in `Subtext Scanner/` can remain for reference
- **Breaking changes**: None (new project, doesn't affect existing code)
- **Next steps**: Complete Phase 1 cleanup (remove unused CoreData files), then proceed with Phase 2 (API integration)
