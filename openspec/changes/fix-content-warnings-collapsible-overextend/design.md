# Design: Content-warning Collapsible overextension on expand

## Context

- Content analysis and Community sections in `ContentWarningsList` use `Collapsible` / `CollapsibleContent`. When the user opens a category (or when Quick Glance triggers `setOpenCategories`), the `CollapsibleContent` goes from collapsed to uncollapsed and reveals: `div.space-y-0.border-t.border-border.mt-2` containing `WarningItem`s.
- `WarningItem` uses a flex row: left `md:w-1/3 shrink-0` (icon, category, severity) and right `flex-1` (description, actions). The actions row is `flex items-center gap-4` (Thumbs, Confidence, Why?, Source, etc.) with no wrap.
- Flex items default to `min-width: auto`, so the right column does not shrink below its content’s intrinsic width. Long descriptions, `break-all` links, and the unwrapped actions row can push the minimum width beyond the viewport or the `1fr` grid column. When the Collapsible expands and this content is first laid out, the container overextends.

## Goals / Non-Goals

- **Goals**: When a content-warning category Collapsible expands, the revealed content must not cause horizontal overflow, scrollbars, or overextension. Preserve existing behaviour and the Quick Glance–driven focus highlight (ring); do not clip the focus ring.
- **Non-Goals**: Changing Radix Collapsible, the structure of Official Author Notes (no Collapsible there), or BooktokWarningsSummary. No `overflow-x-hidden` on the inner wrapper if it would clip the `WarningItem` focus ring.

## Decisions

### 1. `min-w-0` on the right column (`flex-1`)

- **Rationale**: `min-w-0` allows the flex item to shrink below its content’s minimum. The description and links can then wrap; the column stays within the row. Low risk.

### 2. `flex-wrap` on the actions row

- **Rationale**: The actions row (`flex items-center gap-4`) can grow wide with multiple badges and buttons. `flex-wrap` lets it wrap on narrow viewports, reducing the minimum width and avoiding overextension when the Collapsible expands.

### 3. `min-w-0` on `CollapsibleContent`

- **Rationale**: In a flex or grid ancestor, a block child can still enforce a minimum width from its contents. Adding `min-w-0` to `CollapsibleContent` ensures that when the panel expands, the wrapper can shrink to the available width. No behaviour change in a pure block context.

### 4. No `overflow-x-hidden` on the inner div

- **Rationale**: The focus highlight on `WarningItem` uses a ring (`ring-2 ring-primary/30 ring-offset-2`) drawn outside the element. `overflow-x-hidden` on the inner `div.space-y-0.border-t...` would clip that ring. We avoid it and rely on `min-w-0` and `flex-wrap` to prevent overextension.

## Risks / Trade-offs

- **Actions wrap**: On very narrow viewports, the actions row may wrap to multiple lines. Acceptable; it avoids overflow and remains usable.

## Open Questions

- None.
