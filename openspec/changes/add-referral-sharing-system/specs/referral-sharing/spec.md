# referral-sharing Specification

## ADDED Requirements

### Requirement: Generate and retrieve referral links

The system SHALL allow users to generate a unique referral link based on their user identifier (IP+UA fingerprint hash). If a referral code already exists for a user identifier, the system SHALL return the existing code rather than creating a new one. The referral link SHALL be in the format `/share/{code}` where `code` is a readable format consisting of a deterministic prefix (derived from user identifier) and a random suffix (e.g., `jordan-x9k2`).

#### Scenario: Generate new referral code

- **WHEN** a user requests their referral code via `GET /api/referral/generate`
- **THEN** the system generates a user identifier (IP+UA fingerprint hash)
- **AND** generates a unique code with readable format: deterministic prefix (derived from user identifier hash) + random suffix (e.g., `jordan-x9k2`)
- **AND** stores the code in the `referral_links` table with `referrer_user_id` set to the user's identifier
- **AND** returns `{ code: string, shareUrl: string }` where `shareUrl` is the full URL to `/share/{code}`

#### Scenario: Retrieve existing referral code

- **GIVEN** a referral code already exists for the user's identifier (same IP+UA fingerprint = same user_id)
- **WHEN** the user requests their referral code via `GET /api/referral/generate`
- **THEN** the system returns the existing code without creating a new one (deterministic: same user_id = same code)
- **AND** returns `{ code: string, shareUrl: string }` with the existing code

### Requirement: Track referral link clicks and award bonus scans

When someone clicks a referral link, the system SHALL track the click, validate it's not a self-referral, and award bonus scans to the referrer. If the clicker was also referred by someone else, the system SHALL award bonus scans to both the original referrer and the intermediate referrer (multi-level referral).

#### Scenario: First-level referral (click then first scan)

- **GIVEN** user A has a referral code
- **WHEN** user B (different IP+UA) clicks A's referral link (`/share/{code}`)
- **THEN** the system sets a referral cookie (`subtext_ref`) with the code
- **AND** redirects B to the homepage
- **AND** records a 'click' event in `referral_events` table
- **WHEN** user B performs their first scan
- **THEN** the system detects the referral cookie and claims the referral bonus
- **AND** awards X bonus scans to A (where X is configured via `REFERRAL_BONUS_SCANS`, default 3)
- **AND** records a 'first_scan' event and a 'bonus_granted' event for A
- **AND** stores bonus in `user_bonus_scans` table linked to A's user identifier (IP+UA fingerprint)
- **AND** prevents duplicate claims (same user cannot claim bonus from same code twice)

#### Scenario: Multi-level referral (2 levels deep)

- **GIVEN** user A has a referral code and user B clicked A's link and performed first scan (B has referral cookie from A)
- **AND** user B has generated their own referral code
- **WHEN** user C (different IP+UA) clicks B's referral link
- **THEN** the system records a 'click' event for C
- **WHEN** user C performs their first scan
- **THEN** the system claims the referral bonus for both levels
- **AND** awards X bonus scans to B (the immediate referrer)
- **AND** awards X bonus scans to A (the original referrer, via `parent_referrer_user_id`)
- **AND** records 'first_scan' and 'bonus_granted' events for both A and B
- **AND** stores bonuses in `user_bonus_scans` for both users
- **AND** prevents further chain propagation (maximum 2 levels)

#### Scenario: Prevent self-referral

- **GIVEN** user A has a referral code (with `referrer_user_id` = A's user identifier)
- **WHEN** user A (same user identifier: IP+UA fingerprint) clicks their own referral link
- **THEN** the system detects that `user_id === referrer_user_id`
- **AND** does not award bonus scans
- **AND** records a 'click' event but marks it as invalid (or prevents recording)
- **AND** redirects normally but does not set referral cookie

#### Scenario: Prevent duplicate claims

- **GIVEN** user B (identified by user_id: IP+UA fingerprint) has already claimed a bonus from user A's referral code
- **AND** a 'bonus_granted' event exists in `referral_events` for user B and A's code
- **WHEN** user B attempts to claim the bonus again (e.g., by performing another scan with the same referral cookie)
- **THEN** the system checks for existing 'bonus_granted' event for this user_id and code combination
- **AND** does not award additional bonus scans
- **AND** clears the referral cookie (one-time use)
- **AND** returns success but without awarding new bonuses

### Requirement: Integrate bonus scans with rate limiting

Bonus scans SHALL increase the user's effective daily scan limit. The system SHALL add bonus scans to the base limit (e.g., if base limit is 5 and user has 3 bonus scans, effective limit is 8). Bonus scans SHALL expire at the daily reset time (same as regular scans).

#### Scenario: Bonus scans increase effective limit

- **GIVEN** a user (identified by IP+UA fingerprint) has a base limit of 5 scans per day
- **AND** the user has earned 3 bonus scans from referrals (stored in `user_bonus_scans` table)
- **WHEN** the user attempts to scan a book
- **THEN** the system looks up the user's bonus scans from the database
- **AND** calculates effective limit as 8 (5 base + 3 bonus)
- **AND** checks rate limit against this effective limit
- **AND** allows the scan if the user has fewer than 8 scans today

#### Scenario: Bonus scans expire after N days

- **GIVEN** a user has 3 bonus scans that were awarded 7 days ago (or configured expiration period)
- **WHEN** the system checks bonus scans during a scan request
- **THEN** expired bonus scans are removed from `user_bonus_scans` table
- **AND** the user's effective limit returns to the base limit (5)
- **AND** the user can earn new bonus scans from new referrals
- **NOTE**: Bonus scans also expire at daily reset if they were awarded more than N days ago

### Requirement: Display referral link and stats

The system SHALL provide a UI component that displays the user's referral link and allows them to copy it. The component SHALL show how many bonus scans the user has earned from referrals (if any).

#### Scenario: Display referral link

- **WHEN** a user views the "Share Subtext" section (in settings page, not called "Referral")
- **THEN** the system displays their referral link in a readable format (e.g., `/share/jordan-x9k2`)
- **AND** shows the link in a copyable format with full URL
- **AND** provides a "Copy link" button that copies the full URL to clipboard
- **AND** displays current bonus scans with message like "You've unlocked +12 bonus scans from sharing Subtext"

#### Scenario: Show referral stats

- **WHEN** a user has earned bonus scans from referrals
- **THEN** the UI displays "You've unlocked +X bonus scans from sharing Subtext"
- **AND** shows when the bonus scans will expire (e.g., "Expires in 5 days" or "Expires at midnight")
- **AND** optionally shows total referrals made and total bonus scans earned (for motivation)
