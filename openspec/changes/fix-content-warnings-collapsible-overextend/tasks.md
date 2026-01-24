## 1. WarningItem layout

- [x] 1.1 In `components/content-warnings-list.tsx`, on the `WarningItem` right column (the `div` with `className="flex-1"`), add `min-w-0` so it can shrink: `flex-1 min-w-0`.
- [x] 1.2 On the `WarningItem` actions row (`div` with `flex items-center gap-4`), add `flex-wrap` so it wraps on narrow viewports: `flex flex-wrap items-center gap-4`.

## 2. CollapsibleContent

- [x] 2.1 Add `className="min-w-0"` to both `CollapsibleContent` usages in `ContentWarningsList` (Content analysis and Community sections).

## 3. Verification

- [x] 3.1 Manually verify: on a book page with multiple content-warning categories, expand a category (by click or via Quick Glance) and confirm the revealed content does not cause horizontal overflow, scrollbars, or overextension. Check on mobile and desktop. Ensure the Quick Glance focus ring is not clipped.
