# Change: Add book page layout selector and Preview link in Settings

## Why

Designers need to pick a layout variant (Baseline, Compact, Spacious) in Settings and open a Preview that opens the design page with that variant already selected. Putting the selection in Settings (under Appearance, with themes) and a "Preview" link to `/design/book-page?v={selected}` makes the flow clear: choose a layout, then preview it.

## What Changes

- **Settings → Appearance (Book page layouts block, dev only)**: Replace the single "Open design page" link with (1) a **variant selector** (Baseline | Compact | Spacious) in the same style as Mode or Aesthetic, and (2) a **"Preview"** link to `/design/book-page?v={selected}` so the design page opens with that variant active.
- **Design page (`/design/book-page`)**: Support `?v=baseline|compact|spacious`. On load, if `v` is valid, set the initial variant to it; otherwise default to `baseline`. The in-page variant switcher continues to work after load.
- **Persistence (optional)**: The chosen variant in Settings MAY be stored in user preferences (e.g. `bookPageLayoutPreview`) so it prefills on the next visit; the Preview link always uses the currently selected value.

## Impact

- Affected specs: `book-page` (MODIFIED), `settings` (new capability, ADDED)
- Affected code: `app/settings/page.tsx` (selector + Preview link), `components/design/DesignBookPageClient.tsx` (read `?v=` and set initial variant), optionally `hooks/use-user-preferences.ts` and `UserPreferences` if we persist.
