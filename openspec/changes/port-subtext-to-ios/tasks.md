## 1. Project Setup & Architecture
- [x] 1.1 Review and update Xcode project configuration (deployment target, capabilities)
- [x] 1.2 Set up project structure (Views, Models, Services, Utilities)
- [ ] 1.3 Configure Info.plist with required permissions (camera, network) - **Note: Requires Xcode project file access**
- [x] 1.4 Set up CoreData model for local book caching

## 2. API Integration Layer
- [x] 2.1 Create API service class to handle HTTP requests to Next.js backend
- [x] 2.2 Implement scan endpoint integration (`/api/scan` with streaming support)
- [x] 2.3 Implement recent scans endpoint (`/api/recent-scans`)
- [x] 2.4 Implement book detail fetching (or use web view for book pages)
- [x] 2.5 Handle rate limiting responses and display to user
- [x] 2.6 Implement error handling and retry logic

## 3. Native Barcode Scanning
- [x] 3.1 Implement AVFoundation camera capture session
- [x] 3.2 Integrate Vision framework for barcode detection
- [x] 3.3 Create barcode scanner view with camera preview
- [x] 3.4 Handle ISBN-13 and ISBN-10 barcode formats
- [x] 3.5 Add manual ISBN entry fallback
- [x] 3.6 Handle camera permissions and error states

## 4. Scan Flow & Progress
- [x] 4.1 Create scan input view (camera + manual entry)
- [x] 4.2 Implement streaming progress updates from API (Server-Sent Events)
- [x] 4.3 Create progress indicator UI matching web app stages
- [x] 4.4 Handle candidate selection UI (when multiple books match ISBN)
- [x] 4.5 Implement scan result handling and navigation

## 5. Book Display Views
- [x] 5.1 Create book detail view with metadata (title, author, cover)
- [x] 5.2 Implement content warnings list view
- [x] 5.3 Add severity filtering and display (mild, moderate, severe)
- [x] 5.4 Create navigation to book detail from scan results
- [x] 5.5 Add share functionality for book pages

## 6. Recent Scans & History
- [x] 6.1 Create recent scans list view
- [x] 6.2 Implement CoreData persistence for scan history
- [x] 6.3 Add navigation to book detail from history items
- [x] 6.4 Implement pull-to-refresh for recent scans

## 7. Rate Limiting & Credits
- [x] 7.1 Display scan credit status in UI
- [x] 7.2 Show rate limit warnings when credits exhausted
- [ ] 7.3 Handle referral bonus display (if applicable) - **Partial: Basic structure in place**

## 8. Settings & Preferences
- [ ] 8.1 Create settings view - **Deferred: Can use UserDefaults directly for now**
- [x] 8.2 Implement user preferences storage (UserDefaults)
- [x] 8.3 Add preference toggles (show mild warnings, etc.)

## 9. Error Handling & Edge Cases
- [x] 9.1 Handle network errors gracefully
- [x] 9.2 Implement offline mode (show cached books)
- [x] 9.3 Handle book not found scenarios
- [ ] 9.4 Add error reporting UI - **Deferred: Basic error display implemented**

## 10. Testing & Polish
- [ ] 10.1 Test on physical iPhone devices - **Requires device testing**
- [ ] 10.2 Test camera scanning with various barcode formats - **Requires device testing**
- [ ] 10.3 Test API integration with real backend - **Requires backend connection**
- [ ] 10.4 Verify UI matches web app functionality - **Requires visual review**
- [x] 10.5 Add loading states and animations
- [ ] 10.6 Test error scenarios and edge cases - **Requires comprehensive testing**
