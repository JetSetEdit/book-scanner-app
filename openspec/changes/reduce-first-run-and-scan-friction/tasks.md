## 1. First-run friction (Priority 1)

- [x] 1.1 Define "first successful scan" in the client: e.g. set `localStorage.setItem('subtext-first-scan-completed', 'true')` when a scan completes with redirect to book page or results (in `app/scan/page.tsx` or where scan success is handled).
- [x] 1.2 In `components/pwa-install-prompt.tsx`, do not show the install dialog until `localStorage.getItem('subtext-first-scan-completed') === 'true'` (or already installed / recently dismissed). Keep existing 7-day dismiss logic.
- [ ] 1.3 (Optional) If product defers beta modal: in `components/beta-onboarding-modal.tsx`, only show after first scan using the same key; otherwise leave as-is.

## 2. Scan progress (Priority 2)

- [x] 2.1 In `lib/utils/scan-progress-mapper.ts`, ensure stage 1 displayText is "Finding metadata..." (or equivalent), stage 2 "Analyzing content...", and stages 3–4 map to a single user-facing step "Generating summary..." where the progress bar or header shows 3 steps.
- [x] 2.2 In `app/scan/page.tsx`, ensure the progress UI shows these three steps as the primary labels; keep "Current step" / "Recent steps" for granular messages.
- [ ] 2.3 Manually test a full scan and confirm the 3-step progression is clear and matches docs (e.g. `docs/SCAN_STEPS_AND_MESSAGES.md`).

## 3. Camera failure fallback (Priority 3)

- [x] 3.1 In `components/barcode-scanner.tsx`, when `showPermissionButton` is true, add a secondary button or link "Paste ISBN instead" that calls `onClose` so the user can switch to manual entry.
- [x] 3.2 When `cameraError && !showPermissionButton`, consider renaming the existing "Use Manual Entry Instead" button to "Paste ISBN instead" for consistency (or keep label and add aria-label).
- [x] 3.3 Verify both permission-denied and generic camera-error flows show a single, obvious path to manual ISBN entry.

## 4. Results copy (Priority 4)

- [x] 4.1 In `components/book-details.tsx`, add a short label (e.g. "Content summary") near or on the Comfort Read badge so it is distinct from the SSS row.
- [x] 4.2 In `components/book-details.tsx`, add a short label (e.g. "Intensity rating" or "Subtext Suitability") for the SSS row if not already clear.
- [x] 4.3 When both Comfort Read and SSS "Not yet assessed" (S0) are shown, add one line of microcopy (tooltip or inline): e.g. "We didn't find content warnings; intensity wasn't rated because we had limited information."
- [x] 4.4 If `components/content-warnings-list.tsx` shows "Comfort Read" in a way that can appear next to SSS, ensure the same distinction is clear there (label or copy).

## 5. Validation

- [x] 5.1 Run `openspec validate reduce-first-run-and-scan-friction --strict --no-interactive` and fix any issues.
- [ ] 5.2 Smoke-test: first visit → no install prompt until after first successful scan; scan progress shows 3 steps; camera fail → "Paste ISBN instead"; book with Comfort Read + Not yet assessed shows clarified copy.
