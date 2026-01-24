## Phase 1: Minimal Working App
- [x] 1.1 Create fresh SwiftUI project (or clean existing one)
- [x] 1.2 Single view with "Hello World" or basic navigation
- [ ] 1.3 Verify app builds and runs on simulator (requires Xcode build)
- [x] 1.4 Add basic network configuration (Info.plist, App Transport Security)

## Phase 2: First API Integration (Recent Scans)
- [ ] 2.1 Create simple API client (URLSession, no fancy abstractions)
- [ ] 2.2 Implement GET /api/recent-scans (simple JSON fetch)
- [ ] 2.3 Create RecentScan model (Codable struct)
- [ ] 2.4 Display list of recent scans (hardcoded data first, then API)
- [ ] 2.5 Test with real API endpoint
- [ ] 2.6 Add error handling (network errors, empty state)

## Phase 3: Manual ISBN Entry
- [ ] 3.1 Add text field for ISBN input
- [ ] 3.2 Add ISBN validation (local, no API yet)
- [ ] 3.3 Create simple scan button
- [ ] 3.4 Implement POST /api/scan (non-streaming version first)
- [ ] 3.5 Display scan result (success/error message)
- [ ] 3.6 Test scan with real ISBN

## Phase 4: Book Detail View
- [ ] 4.1 Create Book model from API response
- [ ] 4.2 Create simple BookDetailView (title, author, cover)
- [ ] 4.3 Navigate to book detail from recent scans
- [ ] 4.4 Navigate to book detail from scan result
- [ ] 4.5 Test navigation flow

## Phase 5: Content Warnings Display
- [ ] 5.1 Create ContentWarning model
- [ ] 5.2 Fetch warnings for book (may need new endpoint or include in scan response)
- [ ] 5.3 Display warnings list in BookDetailView
- [ ] 5.4 Add severity badges/colors
- [ ] 5.5 Test with book that has warnings

## Phase 6: Native Barcode Scanning
- [ ] 6.1 Request camera permission
- [ ] 6.2 Add AVFoundation camera preview
- [ ] 6.3 Integrate Vision framework for barcode detection
- [ ] 6.4 Extract ISBN from barcode
- [ ] 6.5 Auto-trigger scan when barcode detected
- [ ] 6.6 Test with physical book barcode

## Phase 7: Progress Display (Simplified)
- [ ] 7.1 Add loading state during scan
- [ ] 7.2 Display simple progress message (no streaming initially)
- [ ] 7.3 Add timeout handling
- [ ] 7.4 Test progress display

## Phase 8: Streaming Progress (Advanced)
- [ ] 8.1 Implement Server-Sent Events parsing
- [ ] 8.2 Update progress in real-time
- [ ] 8.3 Handle stream errors gracefully
- [ ] 8.4 Test streaming with long-running scans

## Phase 9: Offline Caching (Optional)
- [ ] 9.1 Set up CoreData model (simple, just books)
- [ ] 9.2 Save scanned books to CoreData
- [ ] 9.3 Load from cache when offline
- [ ] 9.4 Test offline functionality

## Phase 10: Polish & Edge Cases
- [ ] 10.1 Handle rate limiting UI
- [ ] 10.2 Add candidate selection (if needed)
- [ ] 10.3 Improve error messages
- [ ] 10.4 Add pull-to-refresh
- [ ] 10.5 Test on physical device
- [ ] 10.6 Fix any remaining issues
