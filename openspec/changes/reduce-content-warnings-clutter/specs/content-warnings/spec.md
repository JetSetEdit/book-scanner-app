## ADDED Requirements

### Requirement: Content-warnings list SHALL use a light, uncluttered presentation

The content-warnings list SHALL avoid a clunky or heavy presentation. Section headers SHALL be simple and unobtrusive (no flanking horizontal lines; labels use `font-semibold text-sm` with `tracking-wide` rather than `tracking-widest`). Category Collapsible triggers SHALL appear as light, row-style controls (e.g. transparent or very light background with hover, `rounded-md`, no full border) rather than heavy bordered cards. Warning rows SHALL use softer row separators (`border-border/70`) and a lean left-column treatment: a compact severity-colored icon, category and subcategory, and severity as a short colored label (e.g. “Moderate”) in the same block—**not** a separate “X Intensity” line with heavy `tracking-widest`. The CollapsibleContent top divider SHALL be subtly softened (e.g. `border-border/80`). Behaviour (Quick Glance, overflow fixes, actions, Support Resources) SHALL be unchanged.

#### Scenario: User perceives a light, uncluttered content-warnings list

- **GIVEN** a book page with Official Author Notes, Content analysis, and/or Community sections
- **WHEN** the user scans the content-warnings list
- **THEN** section headers show icon and label without flanking horizontal lines and with lighter typography
- **AND** category triggers look like light rows (no full bordered card) and expand on click
- **AND** each warning row has a softer bottom separator and a left column with a compact icon, category/subcategory, and a short severity label (e.g. “Moderate”) instead of a separate “X Intensity” line
- **AND** Quick Glance, Collapsible expand, overflow behaviour, thumbs, Why?, and Support Resources work as before
