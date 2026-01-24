# Design: Graceful content-warnings layout

## Context

- The content-warnings list has: Support Resources (when relevant), Official Author Notes, Content analysis (Collapsibles by category), Community (Collapsibles by category), and a disclaimer. Each section uses a line-and-label header; WarningItem uses a two-column flex (icon/category/severity | description + actions) with `py-6`, `border-b`, and `mb-3` between description and actions.
- Collapsible triggers use `p-4 border border-border rounded-lg`; the expanded content is `border-t border-border mt-2` with `space-y-0` and no top padding before the first WarningItem.
- The user reports it’s working but wants a “more graceful” layout. We interpret that as: better rhythm, breathing room, and a clearer visual relationship between triggers and content, without changing behaviour or structure.

## Goals / Non-Goals

- **Goals**: Improve perceived calm and scannability via spacing and hierarchy; keep overflow fixes, Quick Glance, and all behaviour unchanged.
- **Non-Goals**: Restructuring WarningItem (e.g. card vs. row), changing Support Resources or the disclaimer, adding animation, or altering typography scale. No new dependencies.

## Decisions

### 1. WarningItem: more breathing room

- **Vertical padding**: `py-6` → `py-7`. Modest increase; keeps list compact enough for many items.
- **Description-to-actions gap**: `mb-3` on the description wrapper → `mb-4`. Creates a clearer break between the main copy and the action row.
- **Rationale**: Low risk; no layout or overflow impact. Improves readability and reduces a “cramped” feel.

### 2. CollapsibleContent: nest and air

- **Inner div** (`space-y-0 border-t border-border mt-2`): add `pt-3` so there is space between the top border and the first WarningItem. Result: `space-y-0 border-t border-border mt-2 pt-3`.
- **Rationale**: The list no longer starts flush on the divider; it reads as nested under the trigger. `pt-3` is enough to feel intentional without wasting vertical space.

### 3. Section headers: lighter chunking

- **Header block**: `mb-8` → `mb-6` for the three section headers (Official Author Notes, Content analysis, Community). The divider-and-label block stays; only the space below shrinks.
- **Rationale**: `mb-8` can make the page feel like heavy blocks. `mb-6` keeps hierarchy but makes the list feel more continuous.

### 4. Optional refinements (not in initial scope)

- **Softer WarningItem separator**: `border-b border-border` → `border-b border-border/80`. Slightly lighter line; implement only if it matches the rest of the app’s borders.
- **Softer Collapsible trigger**: `rounded-lg` → `rounded-xl`. Slightly rounder card; minor visual change. Both can be done in a follow-up if desired.

## Risks / Trade-offs

- **Vertical space**: `py-7` and `mb-4` add a few pixels per row. For books with many warnings, the list grows slightly. Acceptable for the gain in comfort.
- **Section `mb-6`**: If headers already feel too close to content elsewhere, we can revert to `mb-8`; easy to tweak.

## Open Questions

- None. Optional border and radius tweaks are documented for a later pass.
