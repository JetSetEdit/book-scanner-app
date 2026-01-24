# Change: Rebuild iOS App with Incremental Integration

## Why

The previous iOS port attempt tried to implement everything at once (barcode scanning, streaming APIs, complex state management, CoreData), which led to compilation errors and complexity. A fresh start with incremental integration will:

- Start with the simplest possible working app
- Connect one API endpoint at a time, verifying each works
- Build confidence by getting one feature working before adding the next
- Reduce complexity by avoiding advanced features (streaming, CoreData) until basics work
- Make debugging easier by isolating each integration point

## What Changes

- **Fresh iOS Project**: Start with minimal SwiftUI app (single view, basic navigation)
- **Incremental API Integration**: Connect one endpoint at a time, starting with simplest (GET /api/recent-scans)
- **Progressive Feature Addition**: Add features one by one:
  1. Display recent scans (read-only, no scanning yet)
  2. Manual ISBN entry and basic scan
  3. Book detail view
  4. Barcode scanning (native camera)
  5. Progress display (simplified, no streaming initially)
  6. Offline caching (CoreData) - last step
- **Simplified Architecture**: Avoid complex patterns until basics work
- **Test-Driven Integration**: Verify each API call works before moving to next

## Impact

- **Affected specs**: New incremental iOS integration capability
- **Affected code**: 
  - Fresh iOS project structure (can coexist with existing attempt)
  - Backend APIs remain unchanged (iOS app consumes same APIs)
- **Breaking changes**: None (this is additive, can keep old attempt for reference)
- **Approach**: Start simple, add complexity only when needed
