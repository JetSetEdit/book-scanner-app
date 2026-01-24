## ADDED Requirements

### Requirement: Collapsible category content must not overextend on expand

When a content-warning category Collapsible (Content analysis or Community) goes from collapsed to uncollapsed, the system SHALL reveal the list of warnings inside without causing horizontal overflow, horizontal scrollbars, or the content to extend beyond its containing layout.

The implementation SHALL allow the revealed content (the inner wrapper and `WarningItem`s) to size within the available width, e.g. by allowing flex items to shrink (`min-w-0`) and by allowing the actions row to wrap on narrow viewports. The implementation SHALL NOT rely on `overflow-x-hidden` in a way that clips the Quick Glance focus ring on `WarningItem`s.

#### Scenario: User expands a category and sees in-bounds content

- **WHEN** a content-warning category Collapsible (Content analysis or Community) goes from collapsed to uncollapsed (by clicking the trigger or via a Quick Glance–driven open)
- **THEN** the revealed list of warnings is displayed
- **AND** the content does not cause horizontal overflow, horizontal scrollbars, or overextension beyond the containing layout
- **AND** the Quick Glance focus ring (when present) is not clipped
