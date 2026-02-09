## Context

UX audit identified four improvement areas. Implementation order: (1) first-run friction, (2) scan progress, (3) camera fallback, (4) results copy. No new backend APIs; changes are frontend and client-state only (localStorage, existing scan completion flow).

## Goals / Non-Goals

- **Goals:** Lower first-run modal stack; clearer scan steps; one-tap manual entry on camera fail; unambiguous Comfort Read vs Not yet assessed.
- **Non-Goals:** Changing scan pipeline logic, adding new API routes, or altering taxonomy/SSS assignment rules.

## Decisions

- **First-scan signal:** Use a localStorage key (e.g. `subtext-first-scan-completed`) set when a scan completes successfully (redirect to book page or results). PWA install prompt SHALL not show until this key is set (or user has dismissed install in last 7 days as today). Beta onboarding modal can remain as-is unless product decides to also defer it.
- **3-step progress:** Keep existing 4-stage mapper and backend messages. Map stages 1–2 to "Finding metadata" and "Analyzing content"; map stages 3–4 to "Generating summary" for the primary header so the UI shows three clear steps. "Recent steps" / current message can still show granular text.
- **Camera fallback:** In `BarcodeScanner`, when `showPermissionButton` is true, add a secondary CTA "Paste ISBN instead" (or "Enter ISBN manually") that calls `onClose` so the user can switch to manual entry without retrying permission. When `cameraError && !showPermissionButton`, keep existing "Use Manual Entry Instead" and optionally rename to "Paste ISBN instead" for consistency.
- **Results copy:** In book details, add a short label or aria context for the Comfort Read badge (e.g. "Content summary") and for the SSS row (e.g. "Intensity rating"). When both Comfort Read and "Not yet assessed" (S0) are shown, add one line of explanatory copy (e.g. "We didn't find content warnings; intensity wasn't rated because we had limited information.") in tooltip or below the SSS pill.

## Risks / Trade-offs

- **localStorage for first scan:** Clears if user clears site data; acceptable for "delay until first value" heuristic.
- **3-step vs 4-stage:** Slight loss of granularity in the main header; "Recent steps" preserves detail.

## Migration Plan

No data migration. Rollout: deploy behind existing feature; no feature flag required unless desired. Rollback: revert components and remove first-scan gate in PWA prompt.

## Open Questions

- Whether to also defer the beta onboarding modal until after first scan (product decision).
