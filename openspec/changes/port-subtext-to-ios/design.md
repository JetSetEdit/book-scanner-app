## Context

The web app (`subtextscanner.com.au`) is a Next.js application that provides book scanning via ISBN/barcode, AI-powered content warning generation, and book detail pages. The existing `Subtext Scanner` Xcode project is a basic SwiftUI template with CoreData scaffolding that needs to be built out.

## Goals / Non-Goals

### Goals
- Native iOS app that replicates core web app functionality (scanning, book display, content warnings)
- Leverage native iOS capabilities (camera, barcode scanning, offline storage)
- Seamless integration with existing Next.js API endpoints
- Offline access to previously scanned books via CoreData
- Native iOS UI/UX patterns (SwiftUI, navigation, animations)

### Non-Goals
- Replacing the web app (both will coexist)
- Implementing AI analysis on-device (uses existing backend APIs)
- Full feature parity in v1 (focus on core scanning and display)
- iPad-specific optimizations (iPhone-first, iPad compatibility)
- App Store submission in this phase (focus on development and testing)

## Decisions

### Decision: Use existing API endpoints
**Rationale**: The Next.js backend already provides all necessary functionality via REST APIs. The iOS app will consume the same endpoints as the web app, ensuring consistency and avoiding duplicate logic.

**Alternatives considered**:
- GraphQL API: Would require backend changes, adds complexity
- Native-only backend: Duplicates existing functionality unnecessarily

### Decision: CoreData for local caching
**Rationale**: CoreData is already scaffolded in the project and provides robust local storage for offline access to scanned books. This enables users to view previously scanned books without network connectivity.

**Alternatives considered**:
- UserDefaults: Too limited for complex book data
- SQLite directly: More manual work, CoreData provides better Swift integration

### Decision: Native barcode scanning (AVFoundation + Vision)
**Rationale**: Native iOS barcode scanning provides better performance, accuracy, and user experience than web-based camera scanning. Vision framework supports ISBN formats natively.

**Alternatives considered**:
- WebView with web camera scanner: Poor performance, limited control
- Third-party barcode library: Unnecessary when native APIs suffice

### Decision: Streaming progress updates via Server-Sent Events
**Rationale**: The web app uses SSE for real-time scan progress. iOS can consume SSE streams to show the same progress stages, maintaining feature parity.

**Alternatives considered**:
- Polling: Less efficient, higher battery usage
- WebSocket: Overkill for one-way progress updates

### Decision: SwiftUI for UI
**Rationale**: SwiftUI is the modern iOS UI framework, already used in the template, and provides declarative, maintainable code. Matches iOS design patterns.

**Alternatives considered**:
- UIKit: More verbose, less modern
- React Native: Would require significant project restructuring

## Architecture

### High-Level Structure
```
Subtext Scanner/
├── Views/
│   ├── ScanView.swift          # Main scanning interface
│   ├── BookDetailView.swift    # Book information and warnings
│   ├── RecentScansView.swift    # Scan history
│   └── SettingsView.swift      # User preferences
├── Models/
│   ├── Book.swift               # Book data model
│   ├── ContentWarning.swift    # Warning data model
│   └── ScanResult.swift         # Scan response model
├── Services/
│   ├── APIService.swift         # HTTP client for backend APIs
│   ├── BarcodeScanner.swift     # Native barcode scanning
│   └── CoreDataService.swift    # Local storage management
└── Utilities/
    ├── ISBNValidator.swift      # ISBN validation
    └── Extensions.swift          # Swift extensions
```

### API Integration Pattern
- **Base URL**: Configurable (default: `https://subtextscanner.com.au`)
- **Endpoints**: Same as web app (`/api/scan`, `/api/recent-scans`, etc.)
- **Authentication**: None required (same as web app)
- **Error Handling**: Network errors, rate limits, validation errors
- **Caching**: CoreData for books, UserDefaults for preferences

### Data Flow
1. User scans barcode → ISBN extracted
2. ISBN validated locally
3. API call to `/api/scan` with streaming progress
4. Progress updates displayed in real-time
5. Scan result received → Book saved to CoreData
6. Navigate to BookDetailView
7. Book detail fetches from API or CoreData cache

## Risks / Trade-offs

### Risk: API compatibility
**Mitigation**: iOS app uses same API contracts as web app. Any API changes should be backward-compatible or versioned.

### Risk: Offline data staleness
**Mitigation**: CoreData cache is for viewing only. Fresh scans always hit API. Add timestamp to cached data and show "last updated" indicator.

### Risk: Camera permissions
**Mitigation**: Request permissions gracefully, provide clear explanation, offer manual entry fallback.

### Risk: Rate limiting UX
**Mitigation**: Display rate limit status prominently, show referral options, handle gracefully with clear messaging.

## Migration Plan

### Phase 1: Core Scanning (MVP)
- Barcode scanning + manual entry
- API integration for scan endpoint
- Basic book display
- Progress indicators

### Phase 2: Full Features
- Content warnings display
- Recent scans history
- Settings and preferences
- Offline caching

### Phase 3: Polish
- Error handling improvements
- UI/UX refinements
- Performance optimization
- Testing and bug fixes

## Open Questions

- Should the app support deep linking to book pages (e.g., `subtextscanner://book/9781234567890`)?
- Should we implement push notifications for scan completion (requires backend changes)?
- Should the app support sharing scanned books via iOS Share Sheet?
- Do we need App Store assets and metadata in this phase, or focus on development first?
