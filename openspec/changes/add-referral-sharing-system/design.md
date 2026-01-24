# Design: Referral Sharing System

## Context

The current rate limiting system is IP-based and stored in-memory. Users get a daily limit of scans (default 5, VIPs get 50). There's an existing VIP invite system using codes and cookies, but it's one-time use and doesn't create a viral loop.

## Goals / Non-Goals

### Goals
- Enable users to share Subtext via unique referral links
- Reward both the referrer and the person who clicks (multi-level rewards)
- Integrate bonus scans into the existing IP-based rate limiting system
- Track referral relationships to prevent abuse
- Simple, shareable links that work via direct navigation

### Non-Goals
- User accounts or authentication (stays IP/device-based)
- Unlimited referral bonuses (there will be limits)
- Complex referral trees beyond 2 levels (A → B → C)
- Email-based referrals or social media integration (just links)

## Decisions

### 1. Referral Code Generation

**Decision**: Generate unique codes based on user identifier (IP+UA fingerprint hash) with readable format
- **Why**: User-based (IP+UA fingerprint) prevents bonus leakage on shared networks, deterministic (same user_id = same code)
- **Format**: Readable format `{deterministic_prefix}-{random_suffix}` (e.g., `jordan-x9k2`)
  - Prefix: Derived from user_id hash (deterministic, creates readable name-like identifier)
  - Suffix: Random alphanumeric (4-5 chars) for uniqueness
- **Storage**: Database table `referral_links` with `code`, `referrer_user_id` (IP+UA fingerprint hash), `created_at`

**Alternatives considered**:
- Random UUIDs: Less user-friendly, harder to share, not memorable
- Opaque codes only: Less personal, harder to remember
- IP-only: Causes bonus leakage on shared networks
- DeviceId-based: Requires client-side storage, less reliable
- User accounts: Too complex, breaks current anonymous model

### 2. Referral Link Structure

**Decision**: `/share/{code}` route with readable format (e.g., `/share/jordan-x9k2`)
- **Why**: 
  - Simple, works via direct link sharing (social media, messaging)
  - Readable format feels personal and intentional, not spammy
  - Easier to remember and screenshot-friendly
- **Flow**: 
  1. Click link → Set referral cookie → Redirect to homepage → Track 'click' event
  2. User performs first scan → Track 'first_scan' event → Award bonuses → Track 'bonus_granted' events
- **Code format**: `{readable_prefix}-{random_suffix}` (e.g., `jordan-x9k2`, `alex-7m3p`)

**Alternatives considered**:
- Query parameter (`/?ref=code`): Less clean URLs, harder to share
- Separate landing page: Unnecessary complexity
- Opaque codes only: Less user-friendly, harder to remember

### 3. Bonus Scan Rewards

**Decision**: 
- **Reward trigger**: Bonus is awarded when the referred user performs their **first scan**, not on click
- First-level referral: When B clicks A's link and performs first scan, A gets X bonus scans
- Second-level referral: When C clicks B's link (B was referred by A) and performs first scan, both A and B get X bonus scans each
- Maximum 2 levels deep (A → B → C: A and B both get bonuses when C performs first scan)
- Diminishing returns: Level 1 = X scans, Level 2 = X scans (same for simplicity, can adjust later)

**Why**: 
- Rewards meaningful usage, not just clicks (filters bots and abuse)
- Keeps value honest - bonus only granted when someone actually uses Subtext
- Prevents infinite referral chains
- Rewards both immediate and indirect referrals

**Configuration**:
- `REFERRAL_BONUS_SCANS` env var (default: 3)
- `REFERRAL_MAX_LEVELS` = 2 (hardcoded)
- `REFERRAL_MAX_BONUS_PER_DAY` = optional cap (e.g., 50 bonus scans per day per referrer)

### 4. Rate Limit Integration

**Decision**: Bonus scans are stored **per user (deviceId/IP combination)**, not just per IP
- **Why**: Prevents bonus leakage across shared IPs (office, café, etc.)
- **Implementation**: 
  - Track bonus scans in database linked to user identifier (deviceId or IP+UA fingerprint)
  - Rate limiter reads: `base_limit + user_bonus_scans`
  - New function `grantBonusScans(userId, amount)` that stores in database
- **Storage**: Database table `user_bonus_scans` with `user_id`, `bonus_amount`, `expires_at`

**Alternatives considered**:
- IP-only tracking: Causes bonus leakage on shared networks
- Cookie-based: Less reliable, doesn't persist across devices
- In-memory only: Lost on restart, not suitable for production

### 5. Event Tracking

**Decision**: Database table `referral_events` tracks all referral-related events:
- `event_type`: 'click', 'first_scan', 'bonus_granted'
- `user_id`: Identifier for the user (IP + UA fingerprint or deviceId)
- `referrer_code`: The referral code involved
- `referrer_user_id`: User who created the code
- `parent_referrer_user_id`: For multi-level, the upstream referrer
- `event_at`: Timestamp
- `metadata`: JSONB for additional context (IP, UA, etc.)

**Why**: 
- Event sourcing pattern provides better observability
- Easier abuse detection (can query for patterns)
- Cleaner analytics (see full user journey)
- Tracks meaningful actions (first_scan) not just clicks

### 6. Preventing Abuse

**Decision**: 
- Same user (IP+UA fingerprint) cannot click their own referral link
- Each user can only claim bonus from a referral code once
- Bonus scans expire after N days (configurable, default: 7 days) or at daily reset
- Optional daily cap: `REFERRAL_MAX_BONUS_PER_DAY` limits how many bonus scans one referrer can earn per day
- Delay reward until first scan (filters bots and non-users)

**Why**: 
- Prevents gaming the system while keeping it simple
- Delay until first scan ensures quality referrals
- Daily cap prevents abuse while allowing legitimate growth
- Expiration prevents hoarding and keeps system active

## Risks / Trade-offs

### Risk: IP-based tracking is unreliable
- **Mitigation**: Accept that some users behind NATs will share IPs. This is acceptable for a referral bonus system.

### Risk: Bonus scans could be exploited
- **Mitigation**: Limit to 2 levels, track all clicks, prevent self-referrals

### Risk: In-memory rate limiter loses bonus scans on restart
- **Mitigation**: Acceptable trade-off for MVP. Can migrate to database-backed later if needed.

### Trade-off: No user accounts
- **Benefit**: Simpler, no auth required
- **Cost**: Can't track referrals across devices/IPs for same user

## Migration Plan

1. Create database tables (migration)
2. Add bonus scan functions to rate limiter
3. Create API routes
4. Create share page/component
5. Test referral flow end-to-end
6. Deploy and monitor

## Open Questions

1. **How many bonus scans?** Default to 3, but should be configurable via env var
2. **Expiration?** Bonus scans expire after 7 days OR at daily reset (whichever comes first) - prevents hoarding
3. **Maximum bonuses per day?** Optional cap (e.g., 50) to prevent abuse - start without, add if needed
4. **UI placement?** Share button in navbar? Settings page? Both? **Recommendation**: Settings page primary, optional navbar button
5. **Link format?** Use readable format like `/share/jordan-x9k2` instead of just code for better UX
6. **User identification?** Use IP+UA fingerprint or require deviceId? **Recommendation**: Start with IP+UA, can add deviceId later
