# Change: Fix content-warning category Collapsible overextension on expand

## Why

When a content-warning category Collapsible (Content analysis or Community) goes from **collapsed to uncollapsed**, the revealed content inside—the `div` with `WarningItem`s—can overextend horizontally. The overextension is caused by the **content inside** the Collapsible: the `WarningItem` flex layout and the actions row can force a minimum width larger than the container. Flex items default to `min-width: auto`, so the right column (`flex-1`) does not shrink below its content; the actions row (`flex items-center gap-4`) does not wrap, so buttons and badges can force width. When the Collapsible expands and this content appears, the layout overextends.

## What Changes

- In `ContentWarningsList`, ensure the content revealed when a category Collapsible expands does not cause horizontal overflow or overextension.
- Add `min-w-0` to the `WarningItem` right column (`flex-1`) so the flex item can shrink and text/links wrap instead of forcing width.
- Add `flex-wrap` to the `WarningItem` actions row so buttons and badges wrap on narrow viewports instead of forcing width.
- Add `min-w-0` to `CollapsibleContent` (for the Content analysis and Community Collapsibles) so it can shrink in flex/grid contexts when the panel expands.

## Impact

- Affected specs: `content-warnings`
- Affected code: `components/content-warnings-list.tsx` (`WarningItem` right column and actions row, and `CollapsibleContent` for the two category Collapsibles)
