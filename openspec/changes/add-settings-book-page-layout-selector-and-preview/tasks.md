## 1. Design page: support ?v=

- [x] 1.1 In `DesignBookPageClient`, on mount read `v` from the URL query (`useSearchParams()` or equivalent). If `v` is one of `baseline`, `compact`, `spacious`, set the initial `variant` state to it; otherwise use `baseline`. The existing variant switcher (Tabs) continues to control the state after load.

## 2. Settings: selector and Preview link

- [x] 2.1 In the "Book page layouts" block (Settings → Appearance, dev only): add a **variant selector** with options Baseline, Compact, and Spacious. Use the same pattern as Mode (e.g. three buttons or a compact row) so the user can pick one. The selected value is held in React state (or in user preferences if we persist).
- [x] 2.2 In the same block: replace or supplement the "Open design page" link with a **"Preview"** link. The `href` SHALL be `/design/book-page?v={selected}` where `{selected}` is the currently selected variant. The label MAY remain "Open design page" or change to "Preview" (or "Preview in new tab" if we open in a new tab; for first slice, same-tab navigation is fine).

## 3. Optional: persist selection

- [x] 3.1 (Optional) Add `bookPageLayoutPreview?: 'baseline'|'compact'|'spacious'` to `UserPreferences` and `defaultPreferences`. In Settings, initialize the selector from `preferences.bookPageLayoutPreview ?? 'baseline'` and on change call `updatePreference('bookPageLayoutPreview', value)`. The Preview link continues to use the current selection.

## 4. Docs and validation

- [x] 4.1 Update `docs/DESIGN_BOOK_PAGE.md` to mention: (1) the variant selector and Preview link in Settings → Appearance, and (2) that `/design/book-page?v=compact` (and `baseline`, `spacious`) opens with that variant.
- [ ] 4.2 Manually verify: In dev, open Settings, select Compact, click Preview → design page opens with Compact; change to Spacious, click Preview → opens with Spacious. Direct navigation to `/design/book-page?v=compact` shows Compact on load.
