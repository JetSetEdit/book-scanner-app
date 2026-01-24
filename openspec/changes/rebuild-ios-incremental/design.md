## Context

The previous iOS port attempt tried to implement everything simultaneously (barcode scanning, streaming APIs, CoreData, complex state management), leading to compilation errors and difficulty debugging. This proposal takes an incremental approach: start with the simplest possible working app and add features one at a time.

## Goals / Non-Goals

### Goals
- Get a working iOS app that can display data from the backend
- Build incrementally - one feature at a time
- Verify each integration point works before moving to the next
- Keep code simple and debuggable
- Learn what works and what doesn't at each step

### Non-Goals
- Full feature parity in first iteration
- Complex architecture patterns (start simple)
- Streaming APIs initially (use simple request/response first)
- Offline caching initially (add later if needed)
- Perfect error handling initially (basic is fine to start)

## Decisions

### Decision: Start with read-only endpoint
**Rationale**: `/api/recent-scans` is a simple GET request that returns JSON. No authentication, no streaming, no complex state. Perfect for first integration.

**Alternatives considered**:
- Starting with scan endpoint: Too complex (streaming, rate limits, multiple states)
- Starting with barcode scanning: Requires camera permissions, more moving parts

### Decision: Non-streaming scan initially
**Rationale**: The scan endpoint supports both streaming (SSE) and non-streaming responses. Start with simple POST/JSON response to get basic scanning working, then add streaming later.

**Alternatives considered**:
- Streaming from the start: More complex, harder to debug
- Polling: Inefficient, adds unnecessary complexity

### Decision: Manual ISBN entry before barcode scanning
**Rationale**: Text input is simpler than camera integration. Get the scan flow working with manual entry first, then add barcode scanning as enhancement.

**Alternatives considered**:
- Barcode scanning first: Requires camera permissions, more setup, harder to test

### Decision: Simple models, no CoreData initially
**Rationale**: Start with in-memory models and Codable structs. Add CoreData only if offline functionality is needed and after everything else works.

**Alternatives considered**:
- CoreData from the start: Adds complexity, harder to debug, not needed initially

### Decision: One view at a time
**Rationale**: Build one complete view (recent scans list) before moving to the next (book detail). Each view should work end-to-end before adding the next.

**Alternatives considered**:
- Building all views simultaneously: Harder to test, more things can break

## Architecture

### Phase 1: Minimal Structure
```
iOS App/
├── App.swift              # Entry point
├── ContentView.swift      # Single view (recent scans list)
└── Models/
    └── RecentScan.swift   # Simple Codable struct
```

### Phase 2: Add API Client
```
iOS App/
├── Services/
│   └── APIClient.swift    # Simple URLSession wrapper
└── Models/
    └── RecentScan.swift   # From API response
```

### Phase 3: Add Scanning
```
iOS App/
├── Views/
│   ├── ScanView.swift     # Manual ISBN entry
│   └── BookDetailView.swift
└── Services/
    └── APIClient.swift    # Add scan method
```

### Progressive Complexity
- Start: Single view, hardcoded data
- Then: Single view, API data
- Then: Two views, navigation
- Then: Add scanning
- Then: Add barcode camera
- Then: Add streaming
- Finally: Add offline caching

## Integration Order

1. **Recent Scans (GET)** - Simplest, read-only
2. **Manual Scan (POST)** - Write operation, but simple request/response
3. **Book Detail** - Display data, no new API calls needed
4. **Content Warnings** - May need new endpoint or use existing data
5. **Barcode Scanning** - Native iOS feature, no API changes
6. **Streaming Progress** - Advanced feature, add after basics work
7. **Offline Caching** - Nice-to-have, add last

## Testing Strategy

### For Each Phase
1. Hardcode data first (verify UI works)
2. Replace with API call (verify network works)
3. Test error cases (network down, invalid data)
4. Move to next phase only when current phase works

### Verification Checklist
- [ ] App builds without errors
- [ ] App runs on simulator
- [ ] API call succeeds
- [ ] Data displays correctly
- [ ] Error handling works
- [ ] Navigation works (if applicable)

## Risks / Trade-offs

### Risk: Over-engineering too early
**Mitigation**: Start with absolute minimum. Add complexity only when current approach doesn't work.

### Risk: Not learning from previous attempt
**Mitigation**: Keep previous attempt code for reference, but start fresh to avoid carrying over problems.

### Risk: Missing features users expect
**Mitigation**: This is intentional - build incrementally. Users can use web app for full features while iOS app is being built.

## Success Criteria

### Phase 1 Success
- App builds and runs
- Can see a list (even if hardcoded)

### Phase 2 Success
- Recent scans load from API
- List displays correctly
- Errors handled gracefully

### Phase 3 Success
- Can enter ISBN manually
- Scan completes successfully
- Result displays

### Overall Success
- Core features work (scan, view books, see warnings)
- App is usable for basic book scanning
- Code is maintainable and debuggable

## Open Questions

- Should we keep the existing iOS project or start completely fresh?
- Do we need a new endpoint for fetching book details, or can we use scan result?
- Should we support both streaming and non-streaming scan modes, or pick one?
