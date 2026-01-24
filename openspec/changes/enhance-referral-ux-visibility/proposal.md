# Change: Enhance referral system UX and visibility

## Why

The referral system works technically, but users lack visibility into:
- How many bonus scans they have active
- When bonuses were earned and when they expire
- Referral success and history
- Clear feedback when bonuses are claimed

This reduces engagement and makes the referral incentive less effective. Users need transparent, persistent visibility into their referral rewards to understand the value and be motivated to share.

## What Changes

- **Persistent bonus indicator**: Badge/indicator in navigation showing active bonus scans
- **Referral dashboard**: Enhanced Settings section showing:
  - Breakdown of base vs bonus scans
  - Referral history (successful referrals, pending clicks)
  - Total bonus scans earned
  - Expiration warnings
- **Referral success confirmation**: Welcome screen when clicking referral link
- **Improved copy**: More specific messaging about bonus amounts and multi-level rewards
- **Rate limit feedback**: Enhanced messages when hitting limits that encourage referrals
- **Bonus claim notifications**: Toast/notification when bonus is successfully claimed
- **Enhanced sharing flow**: Better mobile sharing with pre-filled messages

## Impact

- **Affected specs**: `referral-sharing` capability (enhancements)
- **Affected code**:
  - New API endpoint: `/api/referral/stats` for referral history
  - Enhanced `ShareSubtextButton` component with dashboard
  - New `ReferralWelcomePage` component for `/share/[code]`
  - Updated rate limit display components
  - Navigation badge component
  - Enhanced sharing flow with platform-specific messages
