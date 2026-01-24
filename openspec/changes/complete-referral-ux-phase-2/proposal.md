# Change: Complete referral UX enhancements - Phase 2

## Why

Phase 1 of the referral UX enhancements focused on visibility and transparency (badges, dashboard, notifications). Phase 2 completes the user journey by:

1. **Referral Welcome Experience**: When users click a referral link, they currently get an immediate redirect with no context. A welcome modal would explain the referral relationship and encourage the first scan, improving conversion.

2. **Enhanced Sharing Flow**: The current sharing flow uses generic Web Share API or copy-to-clipboard. Platform-specific share options (WhatsApp, Twitter/X, Instagram) with pre-filled messages would reduce friction and increase sharing.

These enhancements complete the referral loop: visibility (Phase 1) → welcome experience (Phase 2) → easy sharing (Phase 2).

## What Changes

- **Referral Welcome Modal**: Modal overlay component that appears when users click referral links (`/share/[code]`), explaining the referral relationship and encouraging first scan
- **Platform-Specific Sharing**: Enhanced share button with dropdown/menu offering WhatsApp, Twitter/X, Instagram, and generic copy options with pre-filled messages
- **Improved Referral Link Flow**: Update `/share/[code]` route to show modal instead of immediate redirect (while still setting cookie)

## Impact

- **Affected specs**: `referral-ux` capability (adds welcome modal and enhanced sharing requirements)
- **Affected code**:
  - New component: `components/referral-welcome-modal.tsx`
  - Updated route: `app/share/[code]/route.ts` (show modal instead of redirect)
  - Enhanced component: `components/share-subtext-button.tsx` (platform-specific share options)
  - New API endpoint (optional): `/api/referral/referrer-info` to fetch referrer name/identifier for welcome message
