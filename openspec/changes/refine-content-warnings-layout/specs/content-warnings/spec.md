## ADDED Requirements

### Requirement: Content-warnings list SHALL use a graceful layout

The content-warnings list SHALL use a layout that supports comfortable reading and clear hierarchy: consistent vertical rhythm, sufficient breathing room within each warning row (between the description and the actions), and a visually nested relationship between Collapsible triggers and their expanded content. Section headers SHALL be spaced so the list feels like a continuous flow rather than heavy blocks.

The implementation SHALL retain existing behaviour (Quick Glance focus, overflow fixes, Collapsible open/close, Support Resources, disclaimer) and SHALL NOT change structure or typography scale. Spacing and padding refinements are acceptable.

#### Scenario: User scans the content-warnings list and perceives a calm, readable layout

- **GIVEN** a book page with multiple content warnings (Official Author Notes, Content analysis, and/or Community)
- **WHEN** the user scans the list and expands one or more category Collapsibles
- **THEN** warning rows have comfortable vertical padding and a clear gap between the description and the actions
- **AND** expanded content is visually nested under its trigger with space between the top border and the first warning
- **AND** section headers do not create an overly chunky blocky feel
- **AND** Quick Glance focus, overflow behaviour, and all interactive behaviour are unchanged
