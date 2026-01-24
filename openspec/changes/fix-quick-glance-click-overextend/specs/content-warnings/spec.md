## ADDED Requirements

### Requirement: Quick Glance focus highlight must not cause layout overextension

When the user clicks a Quick Glance item (Key Triggers or Tropes & Themes) in the Booktok summary, the system SHALL scroll to the matching content warning and apply a temporary visual highlight.

The highlight SHALL NOT cause horizontal overflow, horizontal scrollbars, or the highlighted row to extend beyond its containing layout. The implementation SHALL avoid negative horizontal margins (or equivalent) that rely on parent padding to avoid overextension.

#### Scenario: User clicks Quick Glance item and sees in-bounds highlight

- **WHEN** the user clicks a Quick Glance badge (Key Triggers or Tropes & Themes)
- **THEN** the app scrolls to the matching content warning and applies a temporary highlight
- **AND** the highlight does not cause horizontal overflow, horizontal scrollbars, or the row to extend beyond its containing layout
