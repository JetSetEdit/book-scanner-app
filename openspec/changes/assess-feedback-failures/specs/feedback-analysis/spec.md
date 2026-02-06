## ADDED Requirements

### Requirement: Feedback root cause assessment

The system SHALL provide a capability to assess user feedback entries and identify root causes for why analysis failed or produced unexpected results.

#### Scenario: Assess single feedback entry
- **WHEN** a feedback assessment is requested for a specific feedback entry
- **THEN** the system SHALL:
  - Fetch the feedback entry from `manual_handling_scans`
  - Cross-reference with `ai_audit_logs` for analysis decisions
  - Check `books` table for metadata quality
  - Check `content_warnings` for actual warnings count
  - Check `manual_handling_scans` for related entries (analysis_failed, rate_limit_exceeded)
  - Identify the most likely root cause category
  - Assign a confidence level (high/medium/low)
  - Provide evidence for the assessment
  - Generate actionable recommendations

#### Scenario: Assess feedback with thin metadata root cause
- **WHEN** a feedback entry is assessed for a book with thin metadata
- **AND** the audit log shows `had_thin_metadata: true` or description length < 150 characters
- **AND** the audit log shows `decision_type: 'no_warnings'`
- **THEN** the system SHALL categorize root cause as "Thin metadata"
- **AND** assign confidence level "high" if audit log explicitly indicates thin metadata
- **AND** assign confidence level "medium" if inferred from description length
- **AND** recommend: "Fetch better metadata from external sources and re-scan"

#### Scenario: Assess feedback with rate limit root cause
- **WHEN** a feedback entry is assessed
- **AND** a related `manual_handling_scans` entry exists with `reason: 'rate_limit_exceeded'`
- **THEN** the system SHALL categorize root cause as "Rate limit"
- **AND** assign confidence level "high"
- **AND** recommend: "Re-scan when API quota resets or check API quota limits"

#### Scenario: Assess feedback with analysis error root cause
- **WHEN** a feedback entry is assessed
- **AND** a related `manual_handling_scans` entry exists with `reason: 'analysis_failed'`
- **AND** the entry contains an `error_message`
- **THEN** the system SHALL categorize root cause as "Analysis error"
- **AND** assign confidence level "high"
- **AND** include the error message in evidence
- **AND** recommend: "Review error message and re-scan, or manually add warnings"

#### Scenario: Assess feedback with false negative root cause
- **WHEN** a feedback entry is assessed with `feedback_type: 'content_issue'`
- **AND** the audit log shows `decision_type: 'no_warnings'`
- **AND** the book has sufficient metadata (description length >= 150 characters)
- **AND** the user message indicates expected warnings
- **THEN** the system SHALL categorize root cause as "False negative"
- **AND** assign confidence level "medium" (requires human review to confirm)
- **AND** recommend: "Review book content manually and consider re-scanning with forceRefresh"

#### Scenario: Assess feedback with missing analysis root cause
- **WHEN** a feedback entry is assessed
- **AND** no audit log exists for the book (`decision_type` is null)
- **AND** the book exists in the database
- **THEN** the system SHALL categorize root cause as "Missing analysis"
- **AND** assign confidence level "high"
- **AND** recommend: "Run analysis for this book"

#### Scenario: Assess feedback with metadata mismatch
- **WHEN** a feedback entry is assessed
- **AND** the ISBN in feedback doesn't match the book_id's ISBN
- **OR** the book title/author in feedback doesn't match the database
- **THEN** the system SHALL categorize root cause as "Metadata mismatch"
- **AND** assign confidence level "high"
- **AND** recommend: "Verify ISBN and book identity"

#### Scenario: Assess feedback with insufficient data
- **WHEN** a feedback entry is assessed
- **AND** insufficient data exists to determine root cause
- **THEN** the system SHALL categorize root cause as "Unknown"
- **AND** assign confidence level "low"
- **AND** indicate what data is missing
- **AND** recommend: "Manual review required"

### Requirement: Assessment output format

The system SHALL provide assessment results in a structured, readable format that includes root cause, confidence, evidence, and recommendations.

#### Scenario: Assessment output display
- **WHEN** an assessment is completed
- **THEN** the output SHALL include:
  - Feedback entry details (book, ISBN, submission date)
  - Root cause category
  - Confidence level (high/medium/low)
  - Evidence summary (key facts supporting the assessment)
  - Recommended actions (specific, actionable steps)
  - Related data (audit log excerpts, metadata quality metrics)

#### Scenario: Batch assessment output
- **WHEN** multiple feedback entries are assessed
- **THEN** the output SHALL include:
  - Individual assessments for each entry
  - Summary statistics (count by root cause category)
  - Pattern detection (e.g., "3 feedback items all have thin metadata")
  - Prioritization suggestions (which feedback to address first)

### Requirement: Pattern detection across feedback

The system SHALL detect patterns when assessing multiple feedback entries to identify systemic issues.

#### Scenario: Detect thin metadata pattern
- **WHEN** multiple feedback entries are assessed
- **AND** 3 or more entries have root cause "Thin metadata"
- **THEN** the system SHALL flag this as a pattern
- **AND** suggest: "Consider improving metadata fetching for books with short descriptions"

#### Scenario: Detect false negative pattern
- **WHEN** multiple feedback entries are assessed
- **AND** 2 or more entries have root cause "False negative" for the same book
- **THEN** the system SHALL flag this as a pattern
- **AND** suggest: "This book may need manual review - multiple users report missing warnings"
