# Change: Fix Quick Glance click causing layout overextension

## Why

When a user clicks a Quick Glance item (Key Triggers or Tropes & Themes) in `BooktokWarningsSummary`, the app scrolls to the matching content warning and applies a temporary highlight. The highlight uses `-mx-4` (negative horizontal margin) to create a “bubble” effect. That pulls the row beyond its containing block; in many layouts the parent does not have matching padding, so the highlight overextends and can cause horizontal overflow, scrollbars, or the row to extend past the intended column.

## What Changes

- Replace the focus highlight in `ContentWarningsList` so it does not cause horizontal overextension.
- Remove `-mx-4` (and any reliance on parent padding). Use a layout-safe highlight (e.g. `ring-2 ring-primary/30` with `ring-offset-2`, or `bg-primary/10` with `rounded-2xl` and only `px-4` and no negative margin, or a `box-shadow`/`outline` that does not change layout).
- Optionally adjust `scrollIntoView` (e.g. `block: 'nearest'` or `'start'`) if centering causes jarring scroll; this is secondary to the layout fix.

## Impact

- Affected specs: `content-warnings`
- Affected code: `components/content-warnings-list.tsx` (focus `useEffect` where highlight classes are applied and removed, and optionally the `scrollIntoView` call)
