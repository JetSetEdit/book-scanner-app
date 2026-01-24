# Change: Port Subtext Scanner to iPhone

## Why

The web app provides a comprehensive book scanning experience with AI-powered content warnings, but users would benefit from a native iOS app that:
- Leverages native camera and barcode scanning capabilities for better performance
- Provides offline access to previously scanned books
- Offers a more native, polished mobile experience
- Enables push notifications for scan completion and other updates
- Integrates with iOS features like Share Sheet and Shortcuts

The existing Xcode project (`Subtext Scanner`) is currently just a template and needs to be built out with the full functionality from the web app.

## What Changes

- **iOS App Development**: Build out the SwiftUI app in `Subtext Scanner/` directory with core scanning and book display functionality
- **API Integration**: Create iOS networking layer to communicate with existing Next.js API endpoints (`/api/scan`, `/api/recent-scans`, etc.)
- **Native Barcode Scanning**: Use AVFoundation and Vision framework for native iOS barcode scanning (replacing web-based camera scanner)
- **Book Display Views**: Create SwiftUI views for displaying book details, content warnings, and scan history
- **Local Storage**: Use CoreData (already scaffolded) to cache scanned books for offline access
- **Rate Limiting UI**: Display scan credit status and rate limit information
- **Navigation**: Implement SwiftUI navigation between scan, book detail, and history views

## Impact

- **Affected specs**: New iOS-specific capabilities (scanning, book display, API integration)
- **Affected code**: 
  - `Subtext Scanner/` directory (Swift/SwiftUI code)
  - Existing API endpoints remain unchanged (iOS app consumes same APIs as web)
- **New dependencies**: None for backend (iOS app uses existing APIs)
- **Breaking changes**: None (this is additive - web app continues to work)
