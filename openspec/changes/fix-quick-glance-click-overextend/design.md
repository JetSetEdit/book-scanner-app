# Design: Quick Glance focus highlight without overextension

## Context

- Quick Glance (Key Triggers, Tropes & Themes) in `BooktokWarningsSummary` calls `onWarningClick(w)`, which sets `focusWarningId` in `book-details`. `ContentWarningsList` receives `focusWarningId`, opens the right category, scrolls to the warning, and applies a highlight.
- The highlight is implemented by adding classes to the `WarningItem` root (`id={anchorId}`): `bg-primary/10`, `rounded-2xl`, `-mx-4`, `px-4`, `transition-all`, `duration-1000`. After 2s they are removed.
- `WarningItem` lives inside `CollapsibleContent` → `div.space-y-0 border-t border-border mt-2`, which has no horizontal padding. `-mx-4` extends the highlighted row 16px left and right beyond that parent. If an ancestor uses `overflow: hidden` or the viewport is narrow, this produces horizontal overflow or the appearance that the block overextends.

## Goals / Non-Goals

- **Goals**: Preserve scroll-to and temporary highlight when a Quick Glance item is clicked; ensure the highlight does not cause horizontal overflow or overextension.
- **Non-Goals**: Changing Quick Glance behaviour, `handleWarningClick`, or the structure of `ContentWarningsList` / `WarningItem`. No new dependencies.

## Decisions

### 1. Remove `-mx-4` and `px-4`

- **Rationale**: `-mx-4` is the direct cause of overextension; it assumes a parent with `px-4` to “cancel out.” The parent chain does not consistently provide that, so we remove negative margin and the compensatory padding from the highlight.

### 2. Layout-safe highlight options

- **Option A (preferred)**: `ring-2 ring-primary/30 ring-offset-2` and keep `rounded-2xl`. Ring and offset are drawn outside the element and do not change layout or cause overflow in normal flex/block containers.
- **Option B**: `bg-primary/10 rounded-2xl` only (no `-mx-4`/`px-4`). The highlight stays within the row’s width; it may look visually narrower than before but will not overextend.
- **Option C**: `box-shadow` or `outline` tuned to approximate a soft glow. More work to match existing look; ring is simpler.

- **Choice**: Implement Option A. If it feels too strong or clashes with existing styles, fall back to Option B. The spec requires only that the highlight must not cause overextension; the exact visuals are implementation detail.

### 3. `scrollIntoView`

- **Current**: `block: 'center'`. Can cause large scroll jumps on long pages.
- **Decision**: Leave as `block: 'center'` unless testing shows it is jarring; if so, use `block: 'nearest'` or `'start'`. Captured as an optional task.

## Risks / Trade-offs

- **Visual change**: The highlight will no longer have the “full-bleed” bubble that `-mx-4`/`px-4` gave. The ring or in-bounds background is a trade-off for correct layout. Low risk.

## Open Questions

- None.
