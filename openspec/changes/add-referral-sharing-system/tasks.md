## 1. Database Schema

- [x] 1.1 Create migration for `referral_links` table:
  - `code` (text, primary key) - unique referral code (readable format: `{prefix}-{suffix}`)
  - `referrer_user_id` (text) - user identifier (IP+UA fingerprint hash)
  - `created_at` (timestamptz) - when code was generated
  - Index on `referrer_user_id` for lookups

- [x] 1.2 Create migration for `referral_events` table:
  - `id` (uuid, primary key)
  - `event_type` (text) - 'click', 'first_scan', 'bonus_granted'
  - `user_id` (text) - user identifier (IP+UA fingerprint hash)
  - `referrer_code` (text, foreign key → referral_links.code)
  - `referrer_user_id` (text) - user who created the code
  - `parent_referrer_user_id` (text, nullable) - upstream referrer for multi-level
  - `event_at` (timestamptz)
  - `metadata` (jsonb) - additional context (IP, UA, etc.)
  - Indexes on `user_id`, `referrer_code`, `referrer_user_id`, `event_type`, `event_at`

- [x] 1.3 Create migration for `user_bonus_scans` table:
  - `id` (uuid, primary key)
  - `user_id` (text) - user identifier (IP+UA fingerprint hash)
  - `bonus_amount` (integer) - number of bonus scans
  - `awarded_at` (timestamptz) - when bonus was granted
  - `expires_at` (timestamptz) - when bonus expires (awarded_at + N days)
  - `source_event_id` (uuid, nullable) - link to referral_events.id for tracking
  - Indexes on `user_id`, `expires_at` (for cleanup queries)

## 2. Rate Limiter Integration

- [x] 2.1 Create `lib/services/referral-bonus-service.ts`:
  - `getUserIdentifier(req: NextRequest): string` - generates IP+UA fingerprint hash
  - `grantBonusScans(userId: string, amount: number, expiresInDays: number = 7): Promise<void>`
    - Stores bonus in `user_bonus_scans` table
    - Sets expiration date (awarded_at + N days)
  - `getActiveBonusScans(userId: string): Promise<number>`
    - Queries `user_bonus_scans` for non-expired bonuses
    - Sums all active bonuses for the user
  - `cleanupExpiredBonuses(): Promise<void>` - removes expired entries

- [x] 2.2 Update `checkRateLimit` and `checkRateLimitWithCost` in `lib/utils/rate-limiter.ts`:
  - Add optional `userId` parameter
  - Query database for user's active bonus scans
  - Calculate effective limit = base limit + bonus scans
  - Pass userId through from API routes

- [x] 2.3 Update scan API route to:
  - Get userId from request (IP+UA fingerprint)
  - Pass userId to rate limit check functions
  - Include bonus scans in effective limit calculation

## 3. API Routes

- [x] 3.1 Create `app/api/referral/generate/route.ts`:
  - `GET` endpoint that generates or retrieves referral code for current IP
  - Returns `{ code: string, shareUrl: string }`
  - Creates code if doesn't exist, returns existing if already generated

- [x] 3.2 Referral claim integrated into scan flow (no separate endpoint needed):
  - Claim happens automatically on first scan when referral cookie is present
  - Integrated into `app/api/scan/route.ts` after successful scan
  - Awards bonus scans to referrer (and parent if multi-level)
  - Records events in `referral_events` table

- [x] 3.3 Create `app/share/[code]/route.ts`:
  - `GET` endpoint that handles referral link clicks
  - Validates code exists in `referral_links` table
  - Gets user identifier (IP+UA fingerprint)
  - Prevents self-referral (user_id === referrer_user_id)
  - Sets referral cookie (`subtext_ref`) with code (expires in 30 days)
  - Records 'click' event in `referral_events` table
  - Redirects to homepage (no query param - cleaner UX)

## 4. Referral Claim Logic

- [x] 4.1 Create `lib/services/referral-service.ts`:
  - `generateReferralCode(userId: string): Promise<string>` - generates readable code (prefix-suffix format)
    - Uses deterministic hash of userId for prefix (e.g., "jordan")
    - Adds random suffix (e.g., "x9k2")
    - Returns format like "jordan-x9k2"
  - `getOrCreateReferralCode(userId: string): Promise<string>` - gets existing or creates new
  - `claimReferralBonus(clickerUserId: string, code: string): Promise<{ success: boolean, bonusAwarded: number, recipients: string[] }>`
    - Validates code exists
    - Prevents self-referral
    - Checks if clicker was already referred (finds parent referrer for multi-level)
    - Awards bonuses to referrer(s) (max 2 levels)
    - Records 'first_scan' and 'bonus_granted' events
    - Returns success status and bonus amounts

- [x] 4.2 Integrate referral claim into scan flow (`app/api/scan/route.ts`):
  - Check for referral cookie (`subtext_ref`) on scan request
  - On first successful scan, call `claimReferralBonus()`
  - Clear referral cookie after claiming (one-time use)
  - Include bonus info in response (optional: show "You earned X bonus scans!" message)

## 5. UI Components

- [x] 5.1 Create `components/share-subtext-button.tsx` (NOT called "referral"):
  - Fetches user's referral code via `GET /api/referral/generate`
  - Displays shareable link in readable format
  - Copy-to-clipboard functionality with success feedback
  - Shows current bonus scans: "You've unlocked +X bonus scans from sharing Subtext"
  - Shows expiration info if applicable
  - Optional: Shows total referrals made (for motivation)

- [ ] 5.2 Create `app/share/[code]/page.tsx` (optional welcome page):
  - **Note**: Skipped for MVP - redirect route handles clicks directly
  - Welcome message: "You've been invited to try Subtext!"
  - Brief explanation: "Scan books to see content warnings"
  - Call-to-action button: "Start Scanning"
  - Note: "Your friend will get bonus scans when you scan your first book"

- [x] 5.3 Add "Share Subtext" section to settings page:
  - Primary location for share functionality
  - Shows referral link, copy button, and stats
  - Optional: Add small share button to navbar (less prominent)

## 6. Testing & Validation

- [ ] 6.1 Test referral code generation (same IP = same code)
- [ ] 6.2 Test referral click flow (A shares → B clicks → B gets bonus)
- [ ] 6.3 Test multi-level flow (A shares → B clicks → B shares → C clicks → A and B both get bonus)
- [ ] 6.4 Test abuse prevention (self-referral blocked, duplicate claims blocked)
- [ ] 6.5 Test bonus scan expiration (resets at daily reset)
- [ ] 6.6 Test integration with rate limiter (bonus scans increase effective limit)

## 7. Configuration

- [x] 7.1 Add environment variables:
  - `REFERRAL_BONUS_SCANS` (default: 3) - bonus scans per referral
  - `REFERRAL_BONUS_EXPIRY_DAYS` (default: 7) - how long bonuses last
  - `REFERRAL_MAX_BONUS_PER_DAY` (optional) - daily cap per referrer (e.g., 50)
  - `REFERRAL_MAX_LEVELS` (default: 2) - maximum referral chain depth

- [x] 7.2 Document referral system in README/docs:
  - How it works
  - Configuration options
  - Abuse prevention measures

- [x] 7.3 Update `env.example` with new env vars

- [ ] 7.4 Create cleanup job (optional):
  - **Note**: Can be added later if needed. Expired bonuses are filtered in queries.
  - Scheduled task to remove expired bonus scans from `user_bonus_scans`
  - Can run daily or weekly
