# referral-ux Specification

## ADDED Requirements

### Requirement: Display persistent bonus scan indicator

The system SHALL display a persistent indicator showing active bonus scans in the navigation bar or scan page. The indicator SHALL show the number of active bonus scans and optionally warn when bonuses are expiring soon (within 2 days).

#### Scenario: Display bonus indicator when bonuses are active

- **GIVEN** a user has 3 active bonus scans
- **WHEN** the user views any page with navigation
- **THEN** a badge or indicator displays "Bonus: +3"
- **AND** the indicator is clickable and links to Settings referral section
- **AND** the indicator updates in real-time when bonuses are claimed

#### Scenario: Display expiration warning in badge

- **GIVEN** a user has 3 bonus scans that expire in 2 days
- **WHEN** the user views any page with navigation
- **THEN** the badge displays "Bonus: +3 (2d left)"
- **AND** the badge uses a warning color (orange/yellow) to indicate expiration

#### Scenario: Hide badge when no bonuses

- **GIVEN** a user has no active bonus scans
- **WHEN** the user views any page with navigation
- **THEN** the bonus indicator is not displayed
- **AND** no badge or indicator appears

### Requirement: Provide referral statistics dashboard

The system SHALL provide a comprehensive referral dashboard in the Settings page that shows:
- Breakdown of base vs bonus scans
- Total bonus scans earned
- Successful referrals count
- Pending referrals (clicks without first scan)
- Expiration warnings for bonuses

#### Scenario: Display scan breakdown

- **WHEN** a user views the Settings page "Share Subtext" section
- **THEN** the dashboard displays:
  - "Base scans: 5"
  - "Bonus scans from referrals: 3"
  - "Total available today: 8"
- **AND** the breakdown is clearly formatted and easy to read

#### Scenario: Display referral statistics

- **WHEN** a user views the referral dashboard
- **THEN** the dashboard shows:
  - "2 successful referrals"
  - "6 bonus scans earned total"
  - "1 click pending (waiting for first scan)"
- **AND** statistics are accurate and up-to-date

#### Scenario: Display expiration warnings

- **GIVEN** a user has 3 bonus scans expiring in 2 days
- **WHEN** the user views the referral dashboard
- **THEN** a warning displays: "3 bonus scans expire in 2 days"
- **AND** the warning is visually distinct (color, icon, etc.)

### Requirement: Show referral welcome page

The system SHALL display a welcome page when a user clicks a referral link, explaining the referral relationship and encouraging the first scan.

#### Scenario: Display welcome page on referral click

- **GIVEN** user A has a referral code
- **WHEN** user B clicks A's referral link (`/share/[code]`)
- **THEN** a welcome page displays:
  - "You've been invited by [referrer name]!"
  - "Scan your first book to unlock 3 bonus scans for your friend"
  - A "Start Scanning" button that links to `/scan`
- **AND** the referral cookie is still set
- **AND** the user can proceed to scan or navigate away

### Requirement: Notify users when bonuses are claimed

The system SHALL display a notification when a referral bonus is successfully claimed, providing immediate positive feedback.

#### Scenario: Notify referred user when bonus is claimed

- **GIVEN** user B clicked user A's referral link and has referral cookie set
- **WHEN** user B performs their first scan
- **THEN** a toast notification displays: "🎉 Bonus claimed! You've earned 3 bonus scans"
- **AND** the notification auto-dismisses after 5 seconds
- **AND** the notification is non-intrusive (doesn't block UI)

#### Scenario: Notify referrer when bonus is earned

- **GIVEN** user A referred user B
- **WHEN** user B performs their first scan (claiming bonus for A)
- **THEN** if user A is currently viewing the app, a notification displays: "🎉 Your friend scanned their first book! You earned 3 bonus scans"
- **AND** the notification appears on next page load or via real-time update if possible

### Requirement: Enhance rate limit feedback with referral encouragement

The system SHALL enhance rate limit messages to encourage referrals when users hit their daily limit.

#### Scenario: Show referral encouragement at limit

- **GIVEN** a user has used all 5 base scans
- **WHEN** the user attempts another scan
- **THEN** the error message includes: "You've used your 5 base scans. Refer a friend to earn 3 more bonus scans!"
- **AND** a link to Settings referral section is provided
- **AND** the message is encouraging, not just informative

### Requirement: Clarify multi-level referral rewards

The system SHALL clearly communicate when multi-level referral bonuses are earned, showing the breakdown of direct vs indirect rewards.

#### Scenario: Show multi-level bonus breakdown

- **GIVEN** user A referred user B, and user B referred user C
- **WHEN** user C performs their first scan
- **THEN** user A receives a notification: "You earned 3 scans (direct referral) + 3 scans (friend of friend) = 6 total"
- **AND** user B receives: "You earned 3 scans (direct referral)"
- **AND** the breakdown is clear and easy to understand

### Requirement: Improve sharing flow and copy

The system SHALL provide enhanced sharing options with platform-specific links and improved, specific copy about bonus amounts.

#### Scenario: Display specific bonus amount in copy

- **WHEN** a user views the "Share Subtext" section
- **THEN** the description states: "Earn 3 bonus scans for each friend who scans their first book with your link"
- **AND** the copy is specific (mentions "3 bonus scans") not vague ("bonus scans")

#### Scenario: Provide platform-specific share options

- **WHEN** a user clicks the share button
- **THEN** options are provided for:
  - WhatsApp (with pre-filled message)
  - Twitter/X (with pre-filled tweet)
  - Instagram (copy link with suggested caption)
  - Generic "Copy & Share" with pre-filled message
- **AND** all options include the referral link

## MODIFIED Requirements

### Requirement: Referral link sharing (enhanced)

The existing referral link sharing functionality SHALL be enhanced with:
- More specific copy about bonus amounts
- Platform-specific share options
- Pre-filled share messages

#### Scenario: Enhanced share button with options

- **GIVEN** a user has generated a referral code
- **WHEN** the user clicks the share button
- **THEN** a dropdown or menu appears with platform-specific options
- **AND** each option includes a pre-filled message with the referral link
- **AND** the user can easily share to their preferred platform
