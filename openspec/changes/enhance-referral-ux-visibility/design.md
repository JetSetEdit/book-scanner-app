# Design: Referral System UX Enhancements

## Context

The current referral system is functional but lacks visibility. Users don't see:
- Active bonus scans clearly
- When bonuses expire
- Referral success history
- Clear confirmation when bonuses are claimed

This proposal adds comprehensive UX improvements to make the referral system more engaging and transparent.

## Goals / Non-Goals

### Goals
- Make bonus scan status persistently visible
- Show clear breakdown of base vs bonus scans
- Provide referral history and success metrics
- Give immediate feedback when bonuses are claimed
- Improve sharing flow with better copy and platform-specific options
- Warn users about bonus expiration

### Non-Goals
- Changing referral mechanics (bonus amounts, expiration, etc.)
- Adding new referral features (only UX improvements)
- Leaderboards or public referral stats (private only)
- Email notifications (in-app only for MVP)

## Decisions

### 1. Bonus Status Visibility

**Decision**: Add persistent badge in navigation AND prominently on scan page
- **Why**: Users need to see bonus status without navigating to settings, and scan page is where they actually use bonuses
- **Locations**: 
  - Navigation bar (always visible, persistent awareness)
  - Scan page above "Enter ISBN" field (immediate context when using scans)
- **Format**: "Bonus: +3" or "Bonus: +3 (2d left)"
- **Update frequency**: Real-time when bonuses are claimed, checked on page load
- **Visual**: Subtle badge that doesn't overwhelm, but clearly visible

**Alternatives considered**:
- Settings-only display: Too hidden, users forget about bonuses
- Toast-only: Disappears, no persistent visibility
- Navigation-only: Misses the context where users actually use bonuses
- Separate dashboard page: Too much navigation overhead

### 2. Referral Dashboard

**Decision**: Enhanced "Share Subtext" section in Settings with progressive disclosure
- **Summary view (default)**:
  - Scan breakdown: "Base: 5 | Bonus: 3 | Total: 8"
  - Quick stats: "2 successful referrals"
- **Expanded view (via "View Details" button)**:
  - Full referral stats: "X successful referrals | Y bonus scans earned"
  - Pending referrals: "Z clicks (pending first scan)"
  - Referral history: List of successful referrals with dates
  - Expiration info: Only shown when actually expiring (not always)
- **Why**: 
  - Centralized view of all referral activity
  - Clear value proposition without information overload
  - Progressive disclosure prevents overwhelming users
  - Motivates continued sharing

### 3. Referral Welcome Page

**Decision**: Modal overlay (not full page) when clicking referral link
- **Content**: 
  - "You've been invited by [referrer name]!"
  - "Scan your first book to unlock 3 bonus scans for your friend"
  - Call-to-action: "Scan whenever you're ready" (subtle, not pushy)
  - Dismiss button: "Continue to Subtext"
- **Behavior**:
  - Auto-dismiss after 10 seconds (optional, user can dismiss earlier)
  - User can proceed naturally to homepage
  - Doesn't interrupt flow if they want to scan immediately
- **Why**: Makes referral relationship clear without being jarring or creating decision fatigue

**Alternatives considered**:
- Keep redirect: Less clear, users don't understand the relationship
- Full page: Too jarring, interrupts natural flow
- No welcome: Users don't understand referral relationship

### 4. Bonus Claim Notification

**Decision**: Show toast notification when bonus is successfully claimed
- **Message**: "🎉 Bonus claimed! You've earned 3 bonus scans"
- **For referrer**: "🎉 Your friend scanned their first book! You earned 3 bonus scans"
- **Why**: Immediate positive feedback reinforces the reward

### 5. Enhanced Sharing Copy

**Decision**: Update copy to be more specific with multi-level tease:
- Current: "When someone clicks your link and scans their first book, you'll earn bonus scans!"
- New: "Earn 3 bonus scans for each friend who scans their first book with your link. (+ unlock more when they invite others)"
- **Why**: 
  - Specific numbers are more motivating than vague promises
  - Teases the 2-level system without overexplaining
  - Creates curiosity about additional rewards

### 6. Rate Limit Feedback Enhancement

**Decision**: When hitting daily limit, show referral encouragement with badge visibility:
- Current: "Daily scan credit limit reached"
- Enhanced: "You've used your 5 base scans. You have 0 bonus scans active right now. Refer a friend to earn 3 more bonus scans!"
- **Why**: 
  - Turns limit into opportunity, encourages sharing
  - Shows current bonus status (0) to make value proposition crystal clear
  - Creates immediate connection between limit and referral solution

### 7. Multi-Level Referral Clarity

**Decision**: Split notifications for clarity:
- **For referred user**: "You earned 3 bonus scans!" (simple, clear)
- **For referrer (direct)**: "Friend scanned! You earned 3 bonus scans"
- **For referrer (multi-level)**: "Friend of friend scanned! You earned 3 bonus scans (2 levels deep)"
- **Why**: 
  - Avoids confusion about whose bonuses are being shown
  - Clear relationship mapping
  - Makes multi-level rewards transparent without overwhelming

### 8. Bonus Expiration Warnings

**Decision**: Escalating urgency with two thresholds:
- **2-day warning**: Gentle nudge in badge "Bonus: +3 (2d left)" and dashboard
- **1-day warning**: Highlighted in red/orange in dashboard "⚠️ 3 bonus scans expire tomorrow"
- **Why**: 
  - Creates escalating urgency without spam
  - 2-day gives planning time, 1-day creates urgency
  - Visual distinction helps users prioritize

### 9. Enhanced Sharing Flow

**Decision**: Add platform-specific share options:
- Pre-filled messages for common platforms
- WhatsApp, Instagram, Twitter/X share links
- "Copy & Share" with suggested message
- **Why**: Reduces friction, makes sharing easier

## Implementation Approach

### Phase 1: Core Visibility (MVP) - Reordered for Quick Wins
1. **Navigation badge** (1-2 days) - Highest ROI, simplest, persistent awareness
2. **Bonus claim notification** (1 day) - Immediate feedback, small component
3. **API endpoint** `/api/referral/stats` (1-2 days) - Unblocks dashboard work
4. **Enhanced dashboard** (2-3 days) - Most complex but high value, progressive disclosure
5. **Rate limit enhancement** (1 day) - Copy changes + badge visibility in message

### Phase 2: Engagement Features
1. Referral welcome page (modal overlay, auto-dismiss)
2. Referral history/stats (expanded view in dashboard)
3. Expiration warnings (2-day and 1-day thresholds)
4. Multi-level referral clarity (split notifications)

### Phase 3: Sharing Enhancements
1. Platform-specific share options
2. Pre-filled share messages
3. Scan page badge (duplicate of nav badge for context)

## Technical Considerations

### API Endpoint: `/api/referral/stats`
Returns:
- Active bonus scans count
- Total bonus scans earned (all time)
- Successful referrals count
- Pending referrals (clicks without first scan)
- Expiring bonuses (with expiration dates)

**Caching Strategy**: Hybrid approach
- Cache stats with 5-minute TTL to avoid query load
- Real-time update ONLY when bonus is claimed (event-driven)
- Balances performance with engagement feedback

### Database Queries
- Aggregate `referral_events` for stats
- Query `user_bonus_scans` for active/expiring bonuses
- Count successful referrals (bonus_granted events)

### Component Structure
- `BonusScanBadge` - Navigation badge component
- `ReferralDashboard` - Enhanced settings section
- `ReferralWelcomePage` - Welcome screen for `/share/[code]`
- `BonusClaimNotification` - Toast notification component

## Risks / Trade-offs

### Risk: Information overload
- **Mitigation**: Progressive disclosure, show summary first, details on expand

### Risk: Performance impact of stats queries
- **Mitigation**: Cache stats, update on claim events, not on every page load

### Trade-off: Welcome page vs redirect
- **Benefit**: Clearer UX, better engagement
- **Cost**: Extra click, slight friction

## Open Questions

1. ~~**Welcome page design**: Full page or modal overlay?~~ **RESOLVED**: Modal overlay
2. ~~**Badge placement**: Navigation bar or scan page only?~~ **RESOLVED**: Both (nav + scan page)
3. ~~**Stats refresh**: Real-time or cached with periodic updates?~~ **RESOLVED**: Hybrid (cached + event-driven)
4. ~~**Expiration threshold**: Warn at 2 days, 1 day, or both?~~ **RESOLVED**: Both (escalating urgency)
5. **Welcome page tracking**: What % of users click "Start Scanning" vs dismiss? (to be monitored)
