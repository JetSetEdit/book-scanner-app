# referral-ux Specification (Phase 2 Additions)

## ADDED Requirements

### Requirement: Display referral welcome modal

The system SHALL display a welcome modal when a user arrives via a referral link, explaining the referral relationship and encouraging the first scan.

#### Scenario: Show welcome modal on referral link click

- **GIVEN** user A has a referral code
- **WHEN** user B clicks A's referral link (`/share/[code]`)
- **THEN** the system sets a referral cookie (`subtext_ref`)
- **AND** redirects user B to the homepage
- **AND** a welcome modal displays with:
  - Message: "You've been invited to Subtext!"
  - Explanation: "Scan your first book to unlock 3 bonus scans for your friend"
  - "Start Scanning" button that links to `/scan`
  - "Continue to Subtext" button that dismisses the modal
- **AND** the modal auto-dismisses after 10 seconds (user can dismiss earlier)
- **AND** the modal does not reappear if the user has previously dismissed it (localStorage flag)

#### Scenario: Prevent modal re-showing after dismiss

- **GIVEN** user B has clicked a referral link and dismissed the welcome modal
- **WHEN** user B returns to the homepage later
- **THEN** the welcome modal does not appear again
- **AND** the referral cookie is still set (for bonus claiming on first scan)

#### Scenario: Handle invalid referral code

- **GIVEN** a user clicks an invalid referral link (`/share/invalid-code`)
- **WHEN** the system processes the link
- **THEN** the system redirects to homepage without setting a cookie
- **AND** no welcome modal is displayed

#### Scenario: Handle self-referral

- **GIVEN** user A has a referral code
- **WHEN** user A clicks their own referral link
- **THEN** the system redirects to homepage without setting a cookie
- **AND** no welcome modal is displayed

### Requirement: Provide platform-specific sharing options

The system SHALL provide enhanced sharing options with platform-specific links and pre-filled messages for popular social platforms.

#### Scenario: Display platform share options

- **GIVEN** a user has generated a referral code
- **WHEN** the user views the "Share Subtext" section in Settings
- **THEN** a share button or dropdown displays with options:
  - WhatsApp
  - Twitter/X
  - Instagram
  - Copy Link (generic)
- **AND** each option includes the referral link

#### Scenario: Share via WhatsApp

- **GIVEN** a user has a referral link
- **WHEN** the user selects "Share via WhatsApp"
- **THEN** a new window/tab opens with WhatsApp web (`https://wa.me/?text=[message]`)
- **AND** the message is pre-filled with: "Check out Subtext! Scan books to see content warnings before you read. Use my link: [referral_url]"
- **AND** the message is URL-encoded correctly

#### Scenario: Share via Twitter/X

- **GIVEN** a user has a referral link
- **WHEN** the user selects "Share via Twitter/X"
- **THEN** a new window/tab opens with Twitter/X compose (`https://twitter.com/intent/tweet?text=[message]`)
- **AND** the tweet text is pre-filled with: "Check out Subtext! Scan books to see content warnings before you read. Use my link: [referral_url]"
- **AND** the message is URL-encoded correctly

#### Scenario: Share via Instagram

- **GIVEN** a user has a referral link
- **WHEN** the user selects "Share via Instagram"
- **THEN** the referral link and a suggested caption are copied to clipboard
- **AND** a toast notification displays: "Link and caption copied! Paste in Instagram"
- **AND** the suggested caption includes: "Check out Subtext! Scan books to see content warnings before you read. Use my link: [referral_url]"

#### Scenario: Copy link with message

- **GIVEN** a user has a referral link
- **WHEN** the user selects "Copy Link"
- **THEN** the referral link and message are copied to clipboard
- **AND** a toast notification displays: "Link copied to clipboard!"
- **AND** the copied text includes: "Check out Subtext! Scan books to see content warnings before you read. Use my link: [referral_url]"

## MODIFIED Requirements

### Requirement: Referral link sharing (enhanced with platform options)

The existing referral link sharing functionality SHALL be enhanced with platform-specific share options and pre-filled messages.

#### Scenario: Enhanced share button with platform menu

- **GIVEN** a user has generated a referral code
- **WHEN** the user clicks the share button in the "Share Subtext" section
- **THEN** a dropdown menu appears with platform-specific options:
  - WhatsApp (with WhatsApp icon)
  - Twitter/X (with Twitter/X icon)
  - Instagram (with Instagram icon)
  - Copy Link (with copy icon)
- **AND** each option includes the referral link in the pre-filled message
- **AND** the user can easily select their preferred sharing method
