# Change: Add referral sharing system with bonus scans

## Why

Users want to share Subtext with others, and a referral system incentivizes sharing while rewarding both the sharer and new users. This creates a viral growth loop where sharing benefits everyone involved.

## What Changes

- **New referral link generation**: Users can generate a unique, readable referral link (e.g., `/share/jordan-x9k2`)
- **Event tracking**: System tracks referral events ('click', 'first_scan', 'bonus_granted') for observability
- **Bonus scan rewards** (awarded on first scan, not click): 
  - When someone clicks your link and performs their first scan, you get X bonus scans
  - When that person shares their link and someone clicks it and performs first scan, both you and the intermediate person get X bonus scans
  - Maximum 2 levels deep (prevents infinite chains)
- **Database tracking**: New `referral_links` and `referral_events` tables to track the referral chain
- **UI component**: "Share Subtext" component (not "Referral") that shows referral link and earned bonus scans
- **Rate limit integration**: Bonus scans are stored per user (IP+UA fingerprint) and added to daily scan limit
- **Abuse prevention**: Delay reward until first scan, prevent self-referrals, optional daily cap, bonus expiration

## Impact

- **Affected specs**: New capability `referral-sharing`
- **Affected code**: 
  - New API routes: `/api/referral/generate`, `/api/referral/claim`, `/share/[code]`
  - Rate limiter: Add function to grant bonus scans
  - Database: New tables for referral tracking
  - UI: New share component/page
  - Rate limit system: Integration with bonus scan grants
