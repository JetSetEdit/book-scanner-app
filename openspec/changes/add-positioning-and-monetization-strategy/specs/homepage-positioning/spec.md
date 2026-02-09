## ADDED Requirements

### Requirement: Hero communicates value prop and CTAs

The homepage hero SHALL display the primary value proposition ("Know what's really in a book before assigning, recommending, or buying" or an approved variant), a support line for teachers and parents (60-second suitability check with content warnings and context), a primary CTA (e.g. "Scan a title now"), a secondary CTA (e.g. "See example scans"), and microcopy that explains Quick Scan (fast triage) vs Deep Scan (higher-confidence analysis).

#### Scenario: First-time visitor sees value prop and CTAs

- **GIVEN** a user lands on the homepage
- **WHEN** the hero section is visible
- **THEN** the headline conveys suitability before assigning, recommending, or buying
- **AND** the subhead mentions teachers and parents and a short suitability check
- **AND** a primary CTA leads to scan/search and a secondary CTA to example scans
- **AND** Quick vs Deep is briefly explained so the user understands the tradeoff

---

### Requirement: Problem section presents three pain points

The homepage SHALL include a problem section that presents three pain points: (1) shelf/BookTok labels can be misleading vs explicit content, (2) classroom suitability is hard to assess quickly, (3) parents need context before buying and blurbs often miss suitability concerns.

#### Scenario: Visitor reads problem section

- **GIVEN** a user scrolls the homepage
- **WHEN** they reach the problem section
- **THEN** they see three distinct pain points related to shelf/BookTok mismatch, classroom risk, and parent context
- **AND** the copy is concrete and outcome-focused

---

### Requirement: Solution section explains Quick and Deep Scan

The homepage SHALL include a solution section that explains Quick Scan (15–30s, first-pass triage) and Deep Scan (90–120s, richer higher-confidence output), and that each warning includes a clear "why" so decisions are informed.

#### Scenario: Visitor reads solution section

- **GIVEN** a user scrolls the homepage
- **WHEN** they reach the solution section
- **THEN** they see Quick Scan and Deep Scan with approximate times and purpose
- **AND** they see that explanations are provided for every warning

---

### Requirement: Trust strip sets expectations

The homepage SHALL include a trust strip that communicates: public beta (actively improving), transparent methodology, indicative guidance (not official board classification), and privacy-first (no personal reading profile required).

#### Scenario: Visitor reads trust strip

- **GIVEN** a user scrolls the homepage
- **WHEN** they reach the trust strip
- **THEN** they see badges or copy for public beta, transparency, indicative guidance, and privacy
- **AND** it is clear that Subtext does not replace official classification

---

### Requirement: How it works in three steps

The homepage SHALL include a "How it works" section with three steps: (1) search or scan a title, (2) review warnings + age guidance + context, (3) decide to assign, recommend, buy, or skip.

#### Scenario: Visitor reads how it works

- **GIVEN** a user scrolls the homepage
- **WHEN** they reach the how-it-works section
- **THEN** they see three ordered steps from scan/search to decision
- **AND** the steps match the actual product flow

---

### Requirement: Proof section "Why people use Subtext" with three cards

The homepage SHALL include a proof section titled "Why people use Subtext" (or equivalent) with three cards: (1) classroom fit check—confirm suitability before assigning or recommending, (2) BookTok reality check—see if popular YA picks include mature content before buying, (3) clear-why context—each warning includes a reason so decisions are informed.

#### Scenario: Visitor reads proof section

- **GIVEN** a user scrolls the homepage
- **WHEN** they reach the proof section
- **THEN** they see a section title and three benefit cards
- **AND** the cards map to classroom, BookTok, and clear-why context

---

### Requirement: FAQ addresses high-conversion questions

The homepage SHALL include an FAQ section that addresses: how accurate is Subtext, what is the difference between Quick and Deep Scan, whether this replaces teacher/parent judgment, whether this is an official classification, and how data is handled.

#### Scenario: Visitor reads FAQ

- **GIVEN** a user scrolls the homepage
- **WHEN** they reach the FAQ
- **THEN** they see answers or links for accuracy, Quick vs Deep, human judgment, official rating, and data handling
- **AND** the FAQ supports trust and conversion

---

### Requirement: Final CTA and tagline

The homepage SHALL include a final CTA block with a prompt (e.g. "Ready to check what's really in a book?") and CTA (e.g. "Run your first scan") with subline "Free triage. Pay for depth."

#### Scenario: Visitor sees final CTA

- **GIVEN** a user scrolls to the bottom of the homepage
- **WHEN** they reach the final CTA block
- **THEN** they see a closing prompt and primary CTA
- **AND** the tagline "Free triage. Pay for depth." is visible to set pricing expectation
