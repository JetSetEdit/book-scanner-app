# book-page – Spec Delta (fix book analysis status display)

## ADDED Requirements

### Requirement: Analysis status derivation

The book page SHALL derive analysis status for display ("complete" vs "unknown") from (1) the presence of at least one `ai_audit_log` row for the book with `decision_type` in `['warnings_generated', 'no_warnings']`, OR (2) the presence of at least one content warning for the book after appeal suppression (the list returned by the same logic that fetches warnings for the page). Status SHALL be "complete" when either condition holds, and "unknown" only when there is no such audit log and no content warnings returned. The derivation SHALL NOT require warnings to have `source === 'ai_generated'`; any stored content warnings (after appeal filtering) SHALL cause status to be "complete" so that legacy or mixed-source data does not show "not analyzed" when results exist.

#### Scenario: Book with audit log shows as analyzed

- **GIVEN** the book has at least one row in `ai_audit_logs` with `decision_type` in `['warnings_generated', 'no_warnings']`
- **WHEN** the book page is rendered
- **THEN** analysis status SHALL be "complete"
- **AND** the UI SHALL show the appropriate content summary (e.g. "No content warnings" or the warning list), not "Content not yet analysed"

#### Scenario: Book with content warnings but no audit log shows as analyzed

- **GIVEN** the book has no relevant audit log but has at least one content warning (any source) that is not fully suppressed by an open appeal
- **WHEN** the book page fetches warnings and computes analysis status
- **THEN** analysis status SHALL be "complete"
- **AND** the UI SHALL not show "Content not yet analysed"

#### Scenario: Book with no audit log and no warnings shows as not analyzed

- **GIVEN** the book has no row in `ai_audit_logs` with `decision_type` in `['warnings_generated', 'no_warnings']` and no content warnings returned (after appeal suppression)
- **WHEN** the book page is rendered
- **THEN** analysis status SHALL be "unknown"
- **AND** the UI SHALL show "Content not yet analysed" (or equivalent) where analysis status is displayed
