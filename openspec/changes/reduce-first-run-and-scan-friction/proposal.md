# Change: Reduce first-run and scan friction (UX audit v1.03.60)

## Why

A UX audit (Subtext Scanner v1.03.60) found that first-use friction is too high (multiple modals before core value), scan progress lacks strong guided state, camera failure recovery could be simpler, and results copy ("Comfort Read" + "Not yet assessed") can feel contradictory. Addressing these in priority order will improve first-session completion, reduce scan drop-off, and build trust during edge cases.

## What Changes

Fixes are ordered by importance:

1. **First-run friction** – Delay the PWA install prompt until after the user has completed at least one successful scan so they see core value before being asked to install. Optionally defer or sequence the beta/legal onboarding modal so it does not stack with the install prompt before first value.
2. **Scan progress** – Expose a clear 3-step guided state during scan: (1) Finding metadata, (2) Analyzing content, (3) Generating summary. Use the existing 4-stage pipeline and mapper; surface these three steps as the primary labels and treat verify/save as part of "Generating summary" where appropriate.
3. **Camera failure** – Ensure a single, confidence-building fallback on all camera-error states: primary CTA "Paste ISBN instead" (or "Enter ISBN manually"). Add this CTA on the permission-denied path as well as the existing generic camera-error path.
4. **Results copy** – Clarify the difference between automated content summary and suitability status. When both "Comfort Read" (analysis complete, no warnings) and "Not yet assessed" (SSS S0/no intensity) appear, add brief labels (e.g. "Content summary" vs "Intensity rating") and optionally one line of microcopy explaining that we didn't find content warnings but couldn't rate intensity due to limited information.

## Impact

- Affected specs: New capabilities — first-run-ux, scan-progress-ux, camera-fallback-ux, book-results-display
- Affected code:
  - `app/layout.tsx` — PWA install prompt gating
  - `components/pwa-install-prompt.tsx` — First-scan gate (localStorage or equivalent)
  - `components/beta-onboarding-modal.tsx` — Optional sequencing (no change required if install delay alone is sufficient)
  - `app/scan/page.tsx` — Progress UI labels; "first successful scan" signal
  - `lib/utils/scan-progress-mapper.ts` — Optional displayText adjustments for 3-step framing
  - `components/barcode-scanner.tsx` — Fallback CTA on permission path; copy "Paste ISBN instead"
  - `components/book-details.tsx` — Labels and microcopy for Comfort Read vs SSS
  - `components/content-warnings-list.tsx` — Any Comfort Read section labeling (if applicable)
