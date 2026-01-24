## 1. WarningItem spacing

- [x] 1.1 In `components/content-warnings-list.tsx`, on the `WarningItem` root `div`, change `py-6` to `py-7` in the `className`.
- [x] 1.2 On the `WarningItem` description wrapper (`div` with `mb-3` that contains the spoiler block or the `p` with the warning text), change `mb-3` to `mb-4`.

## 2. CollapsibleContent inner padding

- [x] 2.1 In both `CollapsibleContent` inner divs (Content analysis and Community), update the `className` from `space-y-0 border-t border-border mt-2` to `space-y-0 border-t border-border mt-2 pt-3`.

## 3. Section headers

- [x] 3.1 For the three section header blocks (Official Author Notes, Content analysis, Community)—the `div` with `flex items-center gap-3 mb-8`—change `mb-8` to `mb-6`.

## 4. Verification

- [x] 4.1 Manually verify on a book page with several content warnings: the list feels less dense and the relationship between Collapsible triggers and their content is clearer. Check on mobile and desktop. Ensure overflow and Quick Glance behaviour are unchanged.
