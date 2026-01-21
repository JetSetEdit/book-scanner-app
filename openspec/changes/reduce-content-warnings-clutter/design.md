# Design: Reduce content-warnings clutter

## Context

- Section headers use `flex` with `h-px bg-border flex-1` on both sides, icon, and `font-bold uppercase tracking-widest text-xs` plus `mb-6`. The double-line sandwich feels corporate and heavy.
- Collapsible triggers use `p-4 border border-border rounded-lg hover:bg-muted/50`—a full bordered card. With `space-y-2`, each trigger reads as a chunky block.
- WarningItem: `py-7 border-b border-border`; left column has icon in `p-1.5` with severity-colored bg (`bg-red-50` etc.), category `font-bold uppercase tracking-wide`, subcategory `text-xs`, then a `pl-9` block with `text-[10px] font-bold uppercase tracking-widest` for “mild/moderate/severe Intensity”. The “X Intensity” line and the heavy tracking add clutter. The right column (description + actions) is already reasonably balanced.

## Goals / Non-Goals

- **Goals**: Reduce perceived clunkiness via lighter typography, fewer or softer borders, and a leaner left-column treatment; retain overflow fixes, Quick Glance, and all behaviour.
- **Non-Goals**: Changing Support Resources, the disclaimer, or the actions row (thumbs, Why?, Confidence); no new deps or restructure of the two-column WarningItem.

## Decisions

### 1. Section headers: drop lines, ease type

- **Remove** the two `h-px flex-1` divs. Keep `flex items-center gap-2` with icon and label.
- **Label**: `font-bold uppercase tracking-widest text-xs` → `font-semibold text-sm uppercase tracking-wide`. Slightly larger, less squeezed, less “shouty”. Official Author Notes keeps the amber icon color; Content analysis and Community keep `text-muted-foreground` for the icon.
- **Spacing**: `mb-6` → `mb-4` so the header doesn’t dominate.
- **Rationale**: Line–label–line is a strong divider; removing it and softening the type makes the block feel lighter while keeping hierarchy.

### 2. Collapsible triggers: from card to row

- **From**: `p-4 border border-border rounded-lg hover:bg-muted/50`
- **To**: `p-3 rounded-md border-0 bg-transparent hover:bg-muted/30`
- **Rationale**: A full border and `rounded-lg` reads as a heavy card. A borderless, hover-only background reads as a row; `rounded-md` keeps a soft tappable area. `p-3` slightly reduces bulk. Triggers remain clearly clickable via hover and chevron.

### 3. WarningItem: softer separator

- **Row**: `border-b border-border` → `border-b border-border/70`.
- **Rationale**: Keeps structure without feeling as heavy.

### 4. WarningItem left column: leaner

- **Icon**: Container `p-1.5` → `p-1`; icon `h-4 w-4` → `h-3.5 w-3.5`. Keeps the severity-colored circle but slightly smaller.
- **Category**: `font-bold` → `font-semibold`; keep `uppercase tracking-wide` for scannability.
- **Severity**: **Remove** the separate `pl-9` block that shows “mild/moderate/severe Intensity” with `text-[10px] font-bold uppercase tracking-widest`. **Add** a short severity label in the existing category block: a `text-xs` span with the same severity color (e.g. “Moderate”, “Severe”) in sentence case. Place it after the subcategory (or after the category when there is no subcategory), e.g. on a new line in the `flex flex-col gap-1` so it stays scannable. When `isSpoiler && isRevealed`, keep the “Hide spoiler” control in that block (same `text-[10px]` link style).
- **Rationale**: “X Intensity” with `tracking-widest` is visually loud. A single word in the severity color is enough and frees vertical space.

### 5. CollapsibleContent inner

- **Top border**: `border-t border-border` → `border-t border-border/80`.
- **Rationale**: Slightly softer where the content meets the trigger.

## Risks / Trade-offs

- **Headers**: Without flanking lines, sections may feel less “chunked”. `mb-4` and `font-semibold` keep a clear break. Revert to lines if it feels too flat.
- **Triggers**: Borderless triggers depend on hover; on touch devices, the chevron and full-row tap target remain. If discoverability suffers, we can add a very light `border-b border-border/50` or `bg-muted/5` by default.
- **Severity**: One word (“Moderate”) vs “moderate Intensity” is a small copy change; we keep the same three levels and colors.

## Open Questions

- None.
