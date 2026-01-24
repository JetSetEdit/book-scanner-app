# Change: Refine content-warnings layout for a more graceful presentation

## Why

The content-warnings list is functionally correct and no longer overextends, but the layout can feel dense and blocky. A more **graceful** presentation would improve scannability and reduce visual fatigue: clearer rhythm, a bit more breathing room in each warning row, a clearer nested relationship between Collapsible triggers and their content, and slightly softer section headers. The goal is calm, readable layout without changing structure or behaviour.

## What Changes

- **WarningItem**: Increase vertical padding (`py-6` → `py-7`) and the gap between the description and the actions row (`mb-3` → `mb-4`) for a calmer, less cramped feel.
- **CollapsibleContent (category lists)**: Add top padding (`pt-3`) inside the content area after the `border-t` so the first warning is not flush to the divider; this gives a clearer nested relationship between the trigger and the list.
- **Section headers** (Official Author Notes, Content analysis, Community): Reduce the margin below the header (`mb-8` → `mb-6`) so sections feel less chunked and more part of a continuous flow.
- **Optional refinements** (design.md; implement only if desired): Slightly softer separator between WarningItems (`border-border/80`), or `rounded-xl` on Collapsible triggers for a softer card. These are optional and can be done in a follow-up.

## Impact

- Affected specs: `content-warnings`
- Affected code: `components/content-warnings-list.tsx` (WarningItem spacing, CollapsibleContent inner div, section header margins)
