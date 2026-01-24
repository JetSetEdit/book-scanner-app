# Testing Guide: Referral UX Phase 2 Enhancements

This guide covers testing for the Phase 2 referral UX enhancements: **Referral Welcome Modal** and **Platform-Specific Sharing**.

## Overview

Phase 2 adds:
1. **Welcome Modal**: Appears when users click referral links, explaining the referral relationship
2. **Platform-Specific Sharing**: Enhanced share button with WhatsApp, Twitter/X, Instagram, and copy options

## Prerequisites

- Access to the production site or a preview deployment
- Two different devices/browsers (or incognito mode) to simulate different users
- Access to WhatsApp, Twitter/X, and Instagram (for platform testing)

## Test Scenarios

### 1. Referral Welcome Modal

#### 1.1 Basic Modal Display

**Steps:**
1. User A generates a referral link (Settings → Share Subtext)
2. User A shares the link with User B
3. User B clicks the referral link (`/share/[code]`)

**Expected Results:**
- ✅ User B is redirected to homepage
- ✅ Welcome modal appears with:
  - Gift icon
  - "You've been invited to Subtext!" title
  - "Scan your first book to unlock 3 bonus scans for your friend" description
  - "Continue to Subtext" button (outline style)
  - "Start Scanning" button (primary style)
- ✅ Modal is centered and responsive (mobile & desktop)

#### 1.2 Modal Dismissal

**Test Case A: Manual Dismiss**
- Click "Continue to Subtext" button
- ✅ Modal closes
- ✅ User stays on homepage
- ✅ Modal does NOT reappear on page refresh

**Test Case B: Auto-Dismiss**
- Wait 10 seconds without interacting
- ✅ Modal auto-dismisses after 10 seconds
- ✅ Modal does NOT reappear on page refresh

**Test Case C: Start Scanning**
- Click "Start Scanning" button
- ✅ Modal closes
- ✅ User navigates to `/scan` page
- ✅ Modal does NOT reappear when returning to homepage

#### 1.3 Modal Re-showing Prevention

**Steps:**
1. User B clicks referral link → modal appears
2. User B dismisses modal (any method)
3. User B refreshes page or navigates away and returns

**Expected Results:**
- ✅ Modal does NOT reappear
- ✅ localStorage flag `referral_welcome_shown_[code]` is set

**Verify localStorage:**
```javascript
// In browser console:
localStorage.getItem('referral_welcome_shown_[code]')
// Should return: "true"
```

#### 1.4 Edge Cases

**Test Case A: Invalid Referral Code**
- Navigate to `/share/invalid-code-12345`
- ✅ Redirects to homepage
- ✅ No modal appears
- ✅ No error shown to user

**Test Case B: Self-Referral**
- User A clicks their own referral link
- ✅ Redirects to homepage
- ✅ No modal appears
- ✅ No cookie set (check DevTools → Application → Cookies)

**Test Case C: Multiple Referral Clicks (Same Code)**
- User B clicks same referral link multiple times
- ✅ Modal shows only once (first time)
- ✅ Subsequent clicks don't show modal again

**Test Case D: Different Referral Codes**
- User B clicks referral link from User A → dismisses modal
- User B clicks referral link from User C (different code)
- ✅ Modal appears again (new code = new localStorage key)

**Test Case E: Private Browsing / localStorage Disabled**
- Test in incognito/private mode
- ✅ Modal still appears (graceful fallback)
- ✅ Modal can be dismissed normally

### 2. Platform-Specific Sharing

#### 2.1 Share Dropdown Menu

**Steps:**
1. Navigate to Settings page
2. Find "Share Subtext" section
3. Click "Share" button

**Expected Results:**
- ✅ Dropdown menu appears with options:
  - WhatsApp (with MessageCircle icon)
  - Twitter/X (with Twitter icon)
  - Instagram (Copy) (with Share2 icon)
  - Copy Link & Message (with Copy icon)
  - Native Share (only if `navigator.share` available)
- ✅ Menu is properly aligned and styled
- ✅ Each option has icon and label

#### 2.2 WhatsApp Sharing

**Steps:**
1. Click "WhatsApp" option from dropdown
2. (If on desktop) WhatsApp Web should open

**Expected Results:**
- ✅ New window/tab opens with `https://wa.me/?text=...`
- ✅ Message is pre-filled with:
  - "Check out Subtext! Scan books to see content warnings before you read. Use my link: [referral_url]"
- ✅ Referral URL is included and correct
- ✅ Message is URL-encoded properly

**Test on Mobile:**
- ✅ Opens WhatsApp app (if installed)
- ✅ Pre-filled message appears in compose screen

#### 2.3 Twitter/X Sharing

**Steps:**
1. Click "Twitter/X" option from dropdown

**Expected Results:**
- ✅ New window/tab opens with `https://twitter.com/intent/tweet?text=...`
- ✅ Tweet text is pre-filled with:
  - "Check out Subtext! Scan books to see content warnings before you read. Use my link: [referral_url]"
- ✅ Referral URL is included and correct
- ✅ Message is URL-encoded properly
- ✅ Twitter compose window appears

#### 2.4 Instagram Sharing

**Steps:**
1. Click "Instagram (Copy)" option from dropdown

**Expected Results:**
- ✅ Toast notification appears: "Link and caption copied! Paste in Instagram"
- ✅ Clipboard contains:
  - "Check out Subtext! Scan books to see content warnings before you read. Use my link: [referral_url]"
- ✅ Referral URL is included and correct

**Verify Clipboard:**
```javascript
// In browser console (after clicking):
navigator.clipboard.readText().then(text => console.log(text))
// Should show the full message with referral URL
```

#### 2.5 Copy Link & Message

**Steps:**
1. Click "Copy Link & Message" option from dropdown

**Expected Results:**
- ✅ Toast notification appears: "Link and message copied to clipboard!"
- ✅ Clipboard contains full message with referral URL
- ✅ Can paste into any platform (email, SMS, etc.)

#### 2.6 Native Share (Mobile)

**Steps:**
1. On mobile device, click "Native Share" option (if available)

**Expected Results:**
- ✅ Native share sheet appears
- ✅ Includes referral link
- ✅ Includes pre-filled message text
- ✅ Can share to any installed app

### 3. Full Referral Flow Integration

#### 3.1 Complete User Journey

**Scenario: User A refers User B**

**Steps:**
1. **User A:**
   - Navigate to Settings
   - Generate referral link
   - Click "Share" → Select "WhatsApp" (or any platform)
   - Share link with User B

2. **User B:**
   - Click referral link from User A
   - ✅ Welcome modal appears
   - Click "Start Scanning" (or dismiss modal)
   - Navigate to Scan page
   - Scan first book (any ISBN)

3. **Verify Results:**
   - ✅ User B receives toast: "🎉 Bonus claimed! You've earned 3 bonus scans"
   - ✅ User A receives toast: "🎉 Your friend scanned their first book! You earned 3 bonus scans"
   - ✅ User A's bonus scan badge updates (if viewing app)
   - ✅ User A's referral dashboard shows +1 successful referral

#### 3.2 Multi-Level Referral Flow

**Scenario: User A → User B → User C**

**Steps:**
1. User A refers User B (User B scans first book)
2. User B refers User C
3. User C clicks User B's referral link
4. User C scans first book

**Expected Results:**
- ✅ User B receives: "🎉 Your friend scanned their first book! You earned 3 bonus scans"
- ✅ User A receives: "🎉 Friend of friend scanned! You earned 3 bonus scans (2 levels deep)"
- ✅ Both users' bonus scan counts update correctly

### 4. Accessibility Testing

#### 4.1 Keyboard Navigation

**Modal:**
- ✅ Tab key navigates between buttons
- ✅ Enter/Space activates focused button
- ✅ ESC key closes modal
- ✅ Focus is trapped within modal (can't tab to background)

**Share Dropdown:**
- ✅ Tab key opens/closes dropdown
- ✅ Arrow keys navigate menu items
- ✅ Enter activates selected item

#### 4.2 Screen Reader

**Modal:**
- ✅ Screen reader announces: "You've been invited to Subtext!"
- ✅ Description is announced: "Scan your first book to unlock 3 bonus scans for your friend"
- ✅ Buttons have proper ARIA labels:
  - "Continue to Subtext"
  - "Start scanning books"

**Share Dropdown:**
- ✅ Menu items are announced with platform names
- ✅ Icons are properly labeled or hidden from screen readers

### 5. Cross-Device Testing

#### 5.1 Mobile Devices

**Test on iOS Safari:**
- ✅ Modal displays correctly
- ✅ Share dropdown works
- ✅ Native Share API works (if available)
- ✅ WhatsApp link opens WhatsApp app
- ✅ Instagram copy works

**Test on Android Chrome:**
- ✅ Modal displays correctly
- ✅ Share dropdown works
- ✅ Native Share API works
- ✅ WhatsApp link opens WhatsApp app
- ✅ Twitter link opens Twitter app (if installed)

#### 5.2 Desktop Browsers

**Test on Chrome:**
- ✅ Modal displays correctly
- ✅ Share dropdown works
- ✅ WhatsApp opens WhatsApp Web
- ✅ Twitter opens Twitter compose in new tab
- ✅ Copy functions work

**Test on Safari:**
- ✅ Modal displays correctly
- ✅ Share dropdown works
- ✅ All platform links work
- ✅ Copy functions work

**Test on Firefox:**
- ✅ Modal displays correctly
- ✅ Share dropdown works
- ✅ All platform links work
- ✅ Copy functions work

### 6. Performance Testing

#### 6.1 Modal Load Time

- ✅ Modal appears within 1 second of page load
- ✅ No layout shift when modal appears
- ✅ Smooth animations (fade in, zoom in)

#### 6.2 Share Dropdown Performance

- ✅ Dropdown opens instantly (< 100ms)
- ✅ No lag when selecting options
- ✅ Platform links open quickly

### 7. Error Handling

#### 7.1 Network Errors

**Test:**
- Disable network after clicking referral link
- ✅ Modal still appears (uses query param, not API)
- ✅ User can dismiss and continue

#### 7.2 Clipboard Errors

**Test:**
- Block clipboard access in browser settings
- Click "Instagram (Copy)" or "Copy Link & Message"
- ✅ Error toast appears: "Failed to copy link"
- ✅ App doesn't crash

#### 7.3 Popup Blocker

**Test:**
- Enable popup blocker
- Click "WhatsApp" or "Twitter/X"
- ✅ Popup is blocked (browser behavior)
- ✅ App doesn't crash
- ✅ User can try again or use copy option

## Test Checklist

### Referral Welcome Modal
- [ ] Modal appears on referral link click
- [ ] Modal displays correct content
- [ ] "Continue to Subtext" button works
- [ ] "Start Scanning" button navigates to /scan
- [ ] Auto-dismiss after 10 seconds works
- [ ] Modal doesn't reappear after dismiss
- [ ] Invalid code doesn't show modal
- [ ] Self-referral doesn't show modal
- [ ] Different codes show modal again
- [ ] Works in private browsing mode

### Platform-Specific Sharing
- [ ] Dropdown menu appears
- [ ] All platform options visible
- [ ] WhatsApp opens with pre-filled message
- [ ] Twitter/X opens with pre-filled tweet
- [ ] Instagram copies link + caption
- [ ] Copy Link & Message works
- [ ] Native Share works (mobile)
- [ ] All messages include referral URL
- [ ] Messages are URL-encoded correctly

### Integration
- [ ] Full referral flow works (A → B)
- [ ] Multi-level referral works (A → B → C)
- [ ] Bonus notifications appear correctly
- [ ] Bonus scan counts update
- [ ] Referral dashboard updates

### Accessibility
- [ ] Keyboard navigation works
- [ ] Screen reader announces content
- [ ] Focus management works
- [ ] ARIA labels present

### Cross-Device
- [ ] Works on iOS Safari
- [ ] Works on Android Chrome
- [ ] Works on desktop Chrome
- [ ] Works on desktop Safari
- [ ] Works on desktop Firefox

## Quick Test Script

```bash
# 1. Generate referral link
# Navigate to: https://www.subtextscanner.com.au/settings
# Copy referral link from "Share Subtext" section

# 2. Test welcome modal
# Open referral link in new incognito window
# Verify modal appears
# Test dismiss and auto-dismiss

# 3. Test sharing
# Go back to Settings
# Click Share dropdown
# Test each platform option

# 4. Test full flow
# Share link to another device/browser
# Click link → scan book → verify bonuses
```

## Known Limitations

1. **Instagram**: No direct link (requires manual paste) - this is expected behavior
2. **Popup Blockers**: May block WhatsApp/Twitter links - users can use copy option
3. **Private Browsing**: localStorage may not persist - modal will show again, but this is acceptable
4. **Native Share**: Only available on mobile devices with supporting browsers

## Troubleshooting

### Modal doesn't appear
- Check URL has `?ref=[code]` query param
- Check browser console for errors
- Verify localStorage is accessible
- Check if modal was already dismissed for this code

### Share links don't work
- Check popup blocker settings
- Verify network connection
- Check browser console for errors
- Try copy option as fallback

### Clipboard doesn't work
- Check browser permissions for clipboard
- Verify HTTPS connection (required for clipboard API)
- Try different browser
- Use manual copy as fallback

## Reporting Issues

When reporting issues, include:
1. Browser and version
2. Device type (mobile/desktop)
3. Steps to reproduce
4. Expected vs actual behavior
5. Browser console errors (if any)
6. Screenshots/videos if helpful
