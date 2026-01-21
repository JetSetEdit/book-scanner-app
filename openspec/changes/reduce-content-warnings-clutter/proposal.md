# Change: Reduce content-warnings visual clutter and clunkiness

## Why

After `refine-content-warnings-layout`, spacing and rhythm improved, but the list still **feels clunky**: heavy section headers (line–label–line, bold uppercase), boxy Collapsible triggers (full border and `rounded-lg`), and dense WarningItem left columns (icon in a large colored circle, “X Intensity” on its own line with `tracking-widest`, many borders). Reducing that visual weight—simpler headers, lighter triggers, softer row separators, and a leaner left-column treatment—should make the list feel calmer and less institutional without changing behaviour.

## What Changes

- **Section headers** (Official Author Notes, Content analysis, Community): Remove the flanking horizontal lines (`h-px flex-1`); keep icon and label. Use `font-semibold text-sm uppercase tracking-wide` (drop `tracking-widest`) and `mb-4` so headers stay clear but less heavy.
- **Collapsible triggers**: Replace the full bordered card (`p-4 border border-border rounded-lg`) with a lighter row: `p-3 rounded-md border-0 bg-transparent hover:bg-muted/30`. Keep icon, label, count badge, and chevron.
- **WarningItem**: (1) Softer row separator: `border-b border-border` → `border-b border-border/70`. (2) Left column: slightly smaller icon (`p-1`, icon `h-3.5 w-3.5`); category `font-bold` → `font-semibold`; remove the separate “X Intensity” line and show severity as a short, colored `text-xs` label (e.g. “Moderate”) in the same category block, with “Hide spoiler” kept when relevant.
- **CollapsibleContent inner**: `border-t border-border` → `border-t border-border/80` for a softer top divider.

## Impact

- Affected specs: `content-warnings`
- Affected code: `components/content-warnings-list.tsx` (section headers, CollapsibleTrigger, WarningItem left column and separator, CollapsibleContent inner div)
