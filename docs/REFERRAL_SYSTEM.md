# Referral Sharing System

## Overview

The referral system allows users to share Subtext with others and earn bonus scans when their referrals perform their first scan. This creates a viral growth loop where sharing benefits everyone.

## How It Works

1. **Generate Referral Link**: Each user gets a unique, readable referral link (e.g., `/share/jordan-x9k2`)
2. **Share Link**: User shares their link via social media, messaging, etc.
3. **Click Tracking**: When someone clicks the link, a referral cookie is set
4. **First Scan Reward**: When the referred user performs their first scan, bonus scans are awarded
5. **Multi-Level Rewards**: If the referred user also shares and someone clicks their link, both the original referrer and intermediate referrer get bonuses (max 2 levels)

## Features

- **Readable Links**: Format like `jordan-x9k2` (deterministic prefix + random suffix)
- **User-Based Tracking**: Uses IP+UA fingerprint to prevent bonus leakage on shared networks
- **Event Sourcing**: Tracks all referral events ('click', 'first_scan', 'bonus_granted') for observability
- **Abuse Prevention**: 
  - Self-referrals blocked
  - Duplicate claims prevented
  - Bonus awarded only on first scan (not just click)
  - Optional daily cap per referrer

## Configuration

Environment variables (all optional, defaults shown):

```bash
# Bonus scans per referral (default: 3)
REFERRAL_BONUS_SCANS=3

# How long bonuses last in days (default: 7)
REFERRAL_BONUS_EXPIRY_DAYS=7

# Optional: Daily cap per referrer (prevents abuse)
REFERRAL_MAX_BONUS_PER_DAY=50
```

## Database Schema

### `referral_links`
- `code` (text, PK) - Unique referral code
- `referrer_user_id` (text) - User identifier (IP+UA fingerprint hash)
- `created_at` (timestamptz)

### `referral_events`
- Event sourcing table tracking: 'click', 'first_scan', 'bonus_granted'
- Includes user_id, referrer_code, referrer_user_id, parent_referrer_user_id
- Metadata JSONB for additional context

### `user_bonus_scans`
- Tracks bonus scans awarded to users
- Includes expiration date (awarded_at + N days)
- Linked to referral_events for tracking

## API Endpoints

### `GET /api/referral/generate`
Returns user's referral code and share URL.

**Response:**
```json
{
  "code": "jordan-x9k2",
  "shareUrl": "https://www.subtextscanner.com.au/share/jordan-x9k2"
}
```

### `GET /share/[code]`
Handles referral link clicks:
- Validates code exists
- Prevents self-referral
- Sets referral cookie (`subtext_ref`)
- Records 'click' event
- Redirects to homepage

### Referral Claim (Automatic)
- Triggered automatically in `/api/scan` route
- Checks for referral cookie on first successful scan
- Awards bonuses to referrer(s)
- Records 'first_scan' and 'bonus_granted' events
- Clears referral cookie after claiming

## Rate Limit Integration

Bonus scans are added to the user's effective daily limit:
- Base limit (e.g., 5) + Bonus scans (e.g., 3) = Effective limit (e.g., 8)
- Bonus scans expire after N days (default: 7)
- Stored in database, not in-memory (survives restarts)

## UI

**Settings Page**: "Share Subtext" section
- Displays referral link
- Copy-to-clipboard button
- Shows bonus scans earned (if any)
- Native share button (mobile)

## Abuse Prevention

1. **Self-Referral Blocked**: Same user_id cannot click own link
2. **Duplicate Claims**: Each user can only claim bonus from a code once
3. **Delay Until First Scan**: Bonus only awarded when referred user actually uses Subtext
4. **Optional Daily Cap**: `REFERRAL_MAX_BONUS_PER_DAY` limits abuse
5. **Expiration**: Bonuses expire after N days, preventing hoarding

## Testing

To test the referral system:

1. **Generate referral code**: Visit Settings page, see your link
2. **Click referral link**: Open link in incognito/private window
3. **Perform first scan**: Scan a book in the new session
4. **Verify bonus**: Check that referrer's effective limit increased

## Future Enhancements

- Optional: Landing page at `/share/[code]` with welcome message
- Optional: Cleanup job for expired bonuses (currently filtered in queries)
- Optional: Analytics dashboard for referral stats
- Optional: Daily cap enforcement (currently just configurable)
