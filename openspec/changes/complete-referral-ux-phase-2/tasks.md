## 1. Referral Welcome Modal Component

- [x] 1.1 Create `components/referral-welcome-modal.tsx`:
  - Modal overlay component using shadcn/ui Dialog component
  - Welcome message: "You've been invited to Subtext!"
  - Explanation: "Scan your first book to unlock 3 bonus scans for your friend"
  - Call-to-action button: "Start Scanning" (links to `/scan`)
  - Dismiss button: "Continue to Subtext" (closes modal)
  - Auto-dismiss after 10 seconds (optional, user can dismiss earlier)
  - Uses localStorage flag to prevent re-showing after dismiss: `referral_welcome_shown_[code]`
  - Responsive design (mobile and desktop)

- [x] 1.2 Update homepage (`app/page.tsx`) to detect referral and show modal:
  - On mount, check for `subtext_ref` cookie
  - If cookie exists and modal not previously shown (check localStorage), show welcome modal
  - Clear cookie from check after showing modal (or use separate flag)
  - Handle edge cases: invalid cookie, already dismissed, etc.

- [x] 1.3 Update `app/share/[code]/route.ts` (if needed):
  - Ensure cookie is set correctly (already done)
  - Redirect to homepage (already done)
  - Consider adding query param `?ref=shown` to indicate modal should appear (optional, cookie detection preferred)

- [x] 1.4 Test welcome modal flow:
  - Click referral link → cookie set → redirect → modal appears
  - Dismiss modal → localStorage flag set → modal doesn't reappear
  - Auto-dismiss after 10 seconds works
  - "Start Scanning" button navigates to `/scan`
  - "Continue to Subtext" button closes modal and stays on homepage

## 2. Enhanced Sharing Flow

- [x] 2.1 Update `components/share-subtext-button.tsx` with platform dropdown:
  - Replace single "Share" button with dropdown/menu
  - Options: WhatsApp, Twitter/X, Instagram, Copy Link
  - Use shadcn/ui DropdownMenu component
  - Each option has icon and label

- [x] 2.2 Add platform-specific share functions:
  - `handleWhatsAppShare()`: Opens `https://wa.me/?text=[message]` in new window
  - `handleTwitterShare()`: Opens `https://twitter.com/intent/tweet?text=[message]` in new window
  - `handleInstagramShare()`: Copies link + suggested caption to clipboard, shows toast
  - `handleCopyLink()`: Copies link + message to clipboard, shows toast
  - All functions use pre-filled message template with referral URL

- [x] 2.3 Create message template:
  - Template: "Check out Subtext! Scan books to see content warnings before you read. Use my link: [referral_url]"
  - Replace `[referral_url]` with actual referral link
  - URL-encode message for platform URLs
  - Keep message concise and clear

- [x] 2.4 Test platform-specific sharing:
  - WhatsApp link opens correctly with pre-filled message
  - Twitter/X link opens correctly with pre-filled tweet
  - Instagram copy works (link + caption copied)
  - Generic copy works (link + message copied)
  - All links include correct referral URL

## 3. Integration & Testing

- [ ] 3.1 Test full referral flow:
  - User A generates referral link
  - User A shares link via platform-specific option
  - User B clicks link → welcome modal appears
  - User B dismisses modal or clicks "Start Scanning"
  - User B performs first scan → bonus claimed
  - User A receives bonus notification (already implemented in Phase 1)

- [ ] 3.2 Test edge cases:
  - Invalid referral code → no modal shown
  - Self-referral → no modal shown
  - Modal already dismissed → doesn't show again
  - Cookie expires → modal doesn't show
  - Multiple referral clicks → modal shows once per code

- [ ] 3.3 Test platform sharing on different devices:
  - Mobile: WhatsApp, Instagram work correctly
  - Desktop: Twitter/X, copy-to-clipboard work correctly
  - All platforms: Links open in new window/tab

- [ ] 3.4 Verify accessibility:
  - Modal is keyboard accessible (ESC to close, tab navigation)
  - Screen reader announces modal content
  - Focus management (focus trap in modal)
  - ARIA labels on buttons and modal

## 4. Documentation

- [ ] 4.1 Update referral system documentation:
  - Document welcome modal behavior
  - Document platform-specific sharing options
  - Update user-facing docs if needed

- [ ] 4.2 Add code comments:
  - Document modal detection logic
  - Document platform share URL formats
  - Document localStorage flag usage
