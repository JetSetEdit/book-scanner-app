## 1. API Endpoint for Referral Stats (Phase 1 - Priority 3)

- [x] 1.1 Create `app/api/referral/stats/route.ts`:
  - `GET` endpoint that returns referral statistics for current user
  - Returns:
    - `activeBonusScans`: number of active (non-expired) bonus scans
    - `totalBonusScansEarned`: total bonus scans earned all-time
    - `successfulReferrals`: count of referrals that resulted in bonus (bonus_granted events)
    - `pendingReferrals`: count of clicks without first scan yet
    - `expiringBonuses`: array of bonuses expiring soon with expiration dates:
      - `expiringIn2Days`: bonuses expiring within 2 days
      - `expiringIn1Day`: bonuses expiring within 1 day (for urgent warnings)
    - `baseLimit`: base scan limit (from env/config)
    - `effectiveLimit`: base + active bonus scans
  - **Caching**: Implement 5-minute TTL cache to avoid query load
  - **Real-time updates**: Event-driven updates when bonuses are claimed (bypass cache)

## 2. Navigation Badge Component (Phase 1 - Priority 1)

- [x] 2.1 Create `components/bonus-scan-badge.tsx`:
  - Displays active bonus scans count
  - Shows expiration warning if expiring soon (2-day threshold: "Bonus: +3 (2d left)")
  - Format: "Bonus: +3" or "Bonus: +3 (2d left)"
  - Clickable to navigate to Settings referral section
  - Only shows when activeBonusScans > 0
  - Subtle design that doesn't overwhelm

- [x] 2.2 Integrate badge into `components/navbar.tsx`:
  - Fetch stats from `/api/referral/stats` (with 5-minute cache)
  - Display badge next to scan credits or in navigation
  - Update on page load and when bonuses are claimed (real-time)

- [x] 2.3 Integrate badge into scan page (`app/scan/page.tsx`):
  - Display prominently above "Enter ISBN" field
  - Same component as navigation badge
  - Provides immediate context when using scans

## 3. Enhanced Referral Dashboard (Phase 1 - Priority 4)

- [x] 3.1 Update `components/share-subtext-button.tsx` with progressive disclosure:
  - Fetch stats from `/api/referral/stats` (cached)
  - **Summary view (default)**:
    - Scan breakdown: "Base: 5 | Bonus: 3 | Total: 8"
    - Quick stats: "2 successful referrals"
  - **Expanded view (via "View Details" button)**:
    - Full referral stats: "X successful referrals | Y bonus scans earned"
    - Pending referrals: "Z clicks (pending first scan)"
    - Referral history: List of successful referrals with dates
    - Expiration warnings: Only shown when actually expiring (not always)
      - 2-day warning: "3 bonus scans expire in 2 days"
      - 1-day warning: "⚠️ 3 bonus scans expire tomorrow" (highlighted in red/orange)

- [x] 3.2 Add referral history section (in expanded view):
  - List of successful referrals (date, bonus earned)
  - Pending referrals (clicked but not scanned yet)
  - Expired bonuses (historical view, optional)

## 4. Referral Welcome Page (Phase 2)

- [ ] 4.1 Create `components/referral-welcome-modal.tsx`:
  - Modal overlay (not full page) for better UX
  - Welcome message: "You've been invited by [referrer name]!"
  - Explanation: "Scan your first book to unlock 3 bonus scans for your friend"
  - Call-to-action: "Scan whenever you're ready" (subtle, not pushy)
  - Dismiss button: "Continue to Subtext"
  - Auto-dismiss after 10 seconds (optional, user can dismiss earlier)
  - Track interaction: Monitor % of users who click vs dismiss

- [ ] 4.2 Update `app/share/[code]/route.ts`:
  - Set referral cookie as before
  - Show modal overlay instead of immediate redirect
  - User can proceed naturally to homepage
  - Doesn't interrupt flow if they want to scan immediately

## 5. Bonus Claim Notifications (Phase 1 - Priority 2)

- [x] 5.1 Create `components/bonus-claim-notification.tsx`:
  - Toast notification component
  - Shows when bonus is successfully claimed
  - **For referred user**: "🎉 Bonus claimed! You've earned 3 bonus scans" (simple, clear)
  - **For referrer (direct)**: "🎉 Your friend scanned their first book! You earned 3 bonus scans"
  - **For referrer (multi-level)**: "🎉 Friend of friend scanned! You earned 3 bonus scans (2 levels deep)"
  - Auto-dismiss after 5 seconds
  - Non-intrusive (doesn't block UI)

- [x] 5.2 Integrate into scan flow:
  - Update `app/api/scan/route.ts` to return bonus claim info in response
  - Include breakdown for multi-level: `{ direct: 3, multiLevel: 3, total: 6 }`
  - Update scan page to show notification when bonus is claimed
  - Update `lib/services/referral-service.ts` to return breakdown in claim result

## 6. Improved Copy and Messaging (Phase 1 - Priority 5)

- [x] 6.1 Update `components/share-subtext-button.tsx` copy:
  - Change: "When someone clicks your link and scans their first book, you'll earn bonus scans!"
  - To: "Earn 3 bonus scans for each friend who scans their first book with your link. (+ unlock more when they invite others)"
  - Teases multi-level system without overexplaining

- [x] 6.2 Update rate limit messages in `app/api/scan/route.ts` and `app/scan/page.tsx`:
  - When limit reached: "You've used your 5 base scans. You have 0 bonus scans active right now. Refer a friend to earn 3 more bonus scans!"
  - Show badge/indicator at this moment to make value proposition crystal clear
  - Add link to Settings referral section

## 7. Enhanced Sharing Flow

- [ ] 7.1 Add platform-specific share options:
  - WhatsApp share link
  - Twitter/X share link
  - Instagram (copy link with suggested caption)
  - Generic "Copy & Share" with pre-filled message

- [ ] 7.2 Update `components/share-subtext-button.tsx`:
  - Add dropdown or button group for platform options
  - Pre-fill share messages with referral link
  - Example: "Check out Subtext! Scan books to see content warnings. Use my link: [url]"

## 8. Multi-Level Referral Clarity (Phase 2)

- [ ] 8.1 Update bonus claim notification (already in task 5.1):
  - Split notifications for clarity (see task 5.1 for details)
  - Update `lib/services/referral-service.ts` to return breakdown in claim result

- [ ] 8.2 Update referral dashboard (optional enhancement):
  - Show breakdown of bonus sources (direct vs multi-level) in expanded view
  - Add tooltip explaining multi-level system
  - Keep it simple to avoid confusion

## 9. Bonus Expiration Warnings (Phase 2)

- [ ] 9.1 Add expiration warnings to dashboard:
  - **2-day warning**: "3 bonus scans expire in 2 days" (gentle nudge)
  - **1-day warning**: "⚠️ 3 bonus scans expire tomorrow" (highlighted in red/orange, urgent)
  - Only show when actually expiring (not always)
  - Escalating urgency with visual distinction

- [ ] 9.2 Add expiration warning to navigation badge:
  - Show "(2d left)" when expiring within 2 days (gentle nudge)
  - Update badge color/style when expiring within 1 day (urgent)
  - Visual distinction helps users prioritize

## 10. Testing & Validation

- [ ] 10.1 Test navigation badge visibility:
  - Shows when bonuses active
  - Hides when no bonuses
  - Updates when bonus claimed

- [ ] 10.2 Test referral dashboard:
  - Stats display correctly
  - Breakdown shows accurate numbers
  - Expiration warnings appear at right time

- [ ] 10.3 Test welcome page:
  - Displays correctly
  - Redirects work
  - Referral cookie still set

- [ ] 10.4 Test notifications:
  - Bonus claim notification appears
  - Multi-level breakdown shows correctly
  - Notifications don't spam

- [ ] 10.5 Test sharing flow:
  - Platform links work
  - Pre-filled messages correct
  - Copy functionality works
