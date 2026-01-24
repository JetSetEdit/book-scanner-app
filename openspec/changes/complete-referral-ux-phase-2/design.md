# Design: Referral UX Phase 2 - Welcome Experience & Enhanced Sharing

## Context

Phase 1 added visibility and transparency to the referral system. Phase 2 completes the user journey by improving:
1. The first-time experience when clicking a referral link
2. The sharing flow to make it easier to share on different platforms

## Goals / Non-Goals

### Goals
- Provide clear context when users arrive via referral link
- Make sharing easier with platform-specific options
- Improve conversion from referral click to first scan
- Maintain non-intrusive UX (modal, not full page)

### Non-Goals
- Changing referral mechanics (bonus amounts, expiration, etc.)
- Adding social media authentication or OAuth
- Creating referral leaderboards or public stats
- Email-based referral notifications

## Decisions

### 1. Referral Welcome Modal

**Decision**: Modal overlay (not full page) that appears when clicking referral link
- **Content**:
  - Welcome message: "You've been invited to Subtext!"
  - Explanation: "Scan your first book to unlock 3 bonus scans for your friend"
  - Call-to-action: "Start Scanning" button (links to `/scan`)
  - Dismiss button: "Continue to Subtext" (closes modal, proceeds to homepage)
- **Behavior**:
  - Auto-dismiss after 10 seconds (optional, user can dismiss earlier)
  - Sets referral cookie as before (via `/share/[code]` route)
  - Modal appears on homepage after redirect
  - User can proceed naturally without interruption
- **Why**: 
  - Makes referral relationship clear without being jarring
  - Less intrusive than full page redirect
  - Maintains natural flow while providing context
  - Auto-dismiss respects user agency

**Alternatives considered**:
- Full page welcome: Too jarring, interrupts natural flow
- No welcome: Users don't understand referral relationship
- Toast notification: Too easy to miss, no context
- Query parameter approach: Requires client-side detection, less clean

### 2. Referral Link Flow

**Decision**: Update `/share/[code]` to set cookie and redirect, then show modal on homepage
- **Flow**:
  1. User clicks `/share/[code]`
  2. Route validates code, sets cookie, records click event
  3. Redirects to homepage with query param `?ref=[code]` (or use cookie detection)
  4. Homepage detects referral cookie and shows welcome modal
- **Why**: 
  - Keeps server-side cookie setting logic
  - Client-side modal detection is cleaner than server-side rendering
  - Allows modal to be dismissed and not shown again (localStorage flag)

**Alternatives considered**:
- Server-side modal rendering: More complex, harder to manage state
- Separate welcome page: Extra navigation step, breaks flow
- Cookie-only detection: Requires client-side cookie reading, less reliable

### 3. Platform-Specific Sharing

**Decision**: Add dropdown/menu with platform-specific share options
- **Options**:
  - **WhatsApp**: `https://wa.me/?text=[message]` with pre-filled message
  - **Twitter/X**: `https://twitter.com/intent/tweet?text=[message]` with pre-filled tweet
  - **Instagram**: Copy link with suggested caption (no direct link, requires manual paste)
  - **Generic**: Copy link with pre-filled message for any platform
- **Message template**: "Check out Subtext! Scan books to see content warnings before you read. Use my link: [referral_url]"
- **Why**: 
  - Reduces friction for sharing on popular platforms
  - Pre-filled messages increase consistency and clarity
  - Platform-specific URLs work better than generic Web Share API
  - Instagram requires manual copy (no direct link), but we provide caption

**Alternatives considered**:
- Web Share API only: Less reliable, doesn't work on desktop
- Email sharing: Not commonly used for referrals, adds complexity
- SMS sharing: Platform-specific, less universal
- Social media OAuth: Too complex, requires authentication

### 4. Referrer Information

**Decision**: Use referral code as identifier (no need to fetch referrer name)
- **Welcome message**: "You've been invited to Subtext!" (generic, friendly)
- **Why**: 
  - Keeps it simple, no additional API calls
  - Referrer name/identifier not critical for conversion
  - Avoids privacy concerns about sharing names
  - Generic message is friendlier and less personal

**Alternatives considered**:
- Fetch referrer name from database: Requires new API endpoint, adds complexity
- Use referral code in message: Less friendly, more technical
- Personalized message: Requires referrer info, privacy concerns

## Implementation Approach

### Phase 2 Tasks (in order)

1. **Referral Welcome Modal** (2-3 days)
   - Create `components/referral-welcome-modal.tsx`
   - Update homepage to detect referral cookie and show modal
   - Add localStorage flag to prevent re-showing after dismiss
   - Test auto-dismiss and manual dismiss

2. **Enhanced Sharing Flow** (1-2 days)
   - Update `components/share-subtext-button.tsx` with platform dropdown
   - Add platform-specific share functions
   - Create pre-filled message templates
   - Test all platform links

3. **Integration & Testing** (1 day)
   - Test full referral flow: share → click → welcome → scan → bonus
   - Verify cookie setting and modal display
   - Test platform-specific sharing on different devices

## Technical Considerations

### Modal Detection

**Option A: Query Parameter** (simpler)
- `/share/[code]` redirects to `/?ref=[code]`
- Homepage checks `searchParams.get('ref')` and shows modal
- Clear param after showing modal

**Option B: Cookie Detection** (more robust)
- `/share/[code]` sets cookie and redirects to `/`
- Homepage checks for `subtext_ref` cookie on mount
- Show modal if cookie exists and not previously dismissed
- Use localStorage flag: `referral_welcome_shown_[code]` to prevent re-showing

**Recommendation**: Option B (cookie detection) - more robust, doesn't expose code in URL

### Platform Share URLs

- **WhatsApp**: `https://wa.me/?text=${encodeURIComponent(message)}`
- **Twitter/X**: `https://twitter.com/intent/tweet?text=${encodeURIComponent(message)}`
- **Instagram**: Copy to clipboard with suggested caption (no direct link)
- **Generic**: Copy link + message to clipboard

### Message Template

```
Check out Subtext! Scan books to see content warnings before you read. Use my link: [referral_url]
```

## Risks / Trade-offs

### Risk: Modal annoyance
- **Mitigation**: Auto-dismiss after 10 seconds, easy dismiss button, localStorage flag prevents re-showing

### Risk: Platform share URLs may break
- **Mitigation**: Test on multiple platforms, provide fallback to copy-to-clipboard

### Trade-off: Generic vs personalized welcome message
- **Benefit**: Simpler, no API calls, privacy-friendly
- **Cost**: Less personal, potentially lower conversion

## Open Questions

1. **Auto-dismiss timing**: 10 seconds good, or should it be shorter/longer? (Start with 10s, can adjust)
2. **Modal re-showing**: Should modal show again if user returns later? (No, use localStorage flag)
3. **Platform priority**: Which platforms to prioritize? (WhatsApp, Twitter/X, Instagram, Generic)
