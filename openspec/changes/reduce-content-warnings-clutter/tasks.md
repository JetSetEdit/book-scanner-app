## 1. Section headers

- [x] 1.1 For the three section header blocks (Official Author Notes, Content analysis, Community): remove the two `h-px bg-border flex-1` divs (the flanking lines). Keep `flex items-center gap-2` with icon and label.
- [x] 1.2 On the section header block `div`, change `mb-6` to `mb-4`. On the `h3` label, change `font-bold uppercase tracking-widest text-xs` to `font-semibold text-sm uppercase tracking-wide`.

## 2. Collapsible triggers

- [x] 2.1 For both Content analysis and Community CollapsibleTrigger components: replace `p-4 border border-border rounded-lg hover:bg-muted/50` with `p-3 rounded-md border-0 bg-transparent hover:bg-muted/30`. Keep icon, label, count badge, and chevron.

## 3. WarningItem

- [x] 3.1 On the WarningItem root `div`: change `border-b border-border` to `border-b border-border/70` (in the `cn()` that also has `py-7`, etc.).
- [x] 3.2 Left column icon: change the icon wrapper from `p-1.5` to `p-1` and the CategoryIcon from `h-4 w-4` to `h-3.5 w-3.5`.
- [x] 3.3 Left column category: change `font-bold` to `font-semibold` on the TagWithTooltip for the category label (keep `uppercase tracking-wide` or `tracking-wide`).
- [x] 3.4 Left column severity: remove the `div` with `pl-9` that contains the “{severity} Intensity” span. In the category block (`flex flex-col gap-1`), add a `text-xs` span with the severity color showing the capitalized severity (e.g. “Moderate”, “Severe”, “Mild”). Place it after the subcategory (or after the category when there is no subcategory). When `isSpoiler && isRevealed`, keep the “Hide spoiler” button in that same block (same `text-[10px]` styling as today).

## 4. CollapsibleContent inner

- [x] 4.1 In both CollapsibleContent inner divs: change `border-t border-border` to `border-t border-border/80` in the `className` (leaving `space-y-0`, `mt-2`, `pt-3` unchanged).

## 5. Verification

- [ ] 5.1 Manually verify on a book page with several warnings: headers feel lighter, triggers less boxy, and warning rows less cluttered. Check Official Author Notes, Content analysis, and Community. Ensure Quick Glance, overflow, and all actions still work. Check on mobile and desktop.
