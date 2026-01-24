## Context

A completely fresh iOS project has been created in `Subtext-Scanner/` directory. This is a new Xcode project that starts with the default SwiftUI + CoreData template, but we're removing CoreData dependencies to create a minimal foundation for incremental development.

## Goals / Non-Goals

### Goals
- Establish a clean, minimal iOS project foundation
- Remove CoreData template code that's not needed for Phase 1
- Create a simple welcome screen as the entry point
- Set up project structure ready for incremental feature addition
- Ensure the app builds and runs with minimal code

### Non-Goals
- Full app functionality (that comes in later phases)
- Complex architecture (start simple)
- CoreData integration (add later if needed for offline caching)
- API integration (Phase 2)

## Decisions

### Decision: New project directory
**Rationale**: Creating `Subtext-Scanner/` as a fresh project avoids carrying over any issues, build cache, or project file problems from the previous attempt. Provides a true clean slate.

**Alternatives considered**:
- Cleaning existing project: Risk of lingering references or cache issues
- Renaming existing project: Could cause Xcode project file issues

### Decision: Remove CoreData from entry point
**Rationale**: Phase 1 is about getting a minimal working app. CoreData adds complexity we don't need yet. We can add it back in Phase 9 if offline caching is needed.

**Alternatives considered**:
- Keeping CoreData but not using it: Adds unnecessary dependencies
- Setting up CoreData properly now: Premature optimization, adds complexity

### Decision: WelcomeView as entry point
**Rationale**: Simple, clear entry point that can be enhanced with Phase 1 design. Makes it obvious the app is working and ready for next phase.

**Alternatives considered**:
- Using ContentView: Still has CoreData template code
- Creating complex navigation: Too much for Phase 1

## Architecture

### Current Structure
```
Subtext-Scanner/
└── Subtext Scanner/
    ├── Subtext Scanner/
    │   ├── Subtext_ScannerApp.swift  # Launches WelcomeView()
    │   ├── WelcomeView.swift         # Simple welcome screen
    │   ├── ContentView.swift         # (To be removed - CoreData template)
    │   └── Persistence.swift         # (To be removed - CoreData)
    └── Subtext Scanner.xcodeproj/
```

### Target Structure (After Cleanup)
```
Subtext-Scanner/
└── Subtext Scanner/
    ├── Subtext Scanner/
    │   ├── Subtext_ScannerApp.swift  # Entry point
    │   ├── WelcomeView.swift         # Phase 1 welcome screen
    │   └── Info.plist               # Network configuration
    └── Subtext Scanner.xcodeproj/
```

## Cleanup Steps

1. Remove `ContentView.swift` (CoreData template, not used)
2. Remove `Persistence.swift` (CoreData setup, not needed)
3. Remove `.xcdatamodeld` directory (CoreData model, not needed)
4. Enhance `WelcomeView.swift` with Phase 1 design
5. Add `Info.plist` for network configuration
6. Verify `Subtext_ScannerApp.swift` has no CoreData imports

## Verification

After cleanup, the project should:
- Build without errors
- Run on simulator showing welcome screen
- Have no CoreData imports or references
- Be ready for Phase 2 (API integration)

## Open Questions

- Should we keep the old `Subtext Scanner/` directory for reference, or remove it?
- Do we need any project configuration changes in Xcode (deployment target, capabilities)?
- Should WelcomeView match the design from `rebuild-ios-incremental` proposal?
