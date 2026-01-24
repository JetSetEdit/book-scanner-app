# Design: Integrate preview and lite into production

## Context

- **main** (production) is an ancestor of **preview**; **preview** is an ancestor of **lite**. So: main ⊆ preview ⊆ lite. Merging `lite` into `main` brings all preview and lite work in one step.
- **preview** adds: content explanation, scan recording on rescan, auto-scroll carousel, Settings + aesthetic themes, BookTok theme, Ethics reframe, variant config.
- **lite** adds on top of preview: lite variant (VARIANTS.lite, flags, component behavior for lite). The "Trigger Lite preview deploy" commit is CI/ops only; it can remain in history.
- Production is deployed from `main` with `NEXT_PUBLIC_VARIANT=public` or unset. A separate Lite deployment uses `NEXT_PUBLIC_VARIANT=lite`.

## Goals / Non-Goals

- **Goals**: Single merge of lite into main; production gains all preview + lite capabilities; prod keeps VARIANT=public; lite variant remains available for a separate deployment.
- **Non-Goals**: Changing the behavior of content explanation, recent-scans, or the lite variant; merging main into lite; altering how VARIANT is selected.

## Decisions

### 1. Merge `lite` into `main`

One merge is enough because lite ⊃ preview. Use `git merge lite` (or equivalent) on `main`. If `main` has moved and there are conflicts, resolve in favour of lite’s implementation for files that implement preview/lite features; preserve any main-only fixes if they exist and do not conflict.

### 2. Production stays `NEXT_PUBLIC_VARIANT=public` (or unset)

No change to production’s env. The variant config and `getVariantConfig().name` in the navbar mean production will show "Subtext" (from `VARIANTS.public.name`) instead of a hardcoded "Subtext Preview". That is intended.

### 3. Lite variant in codebase, not in production build

The lite variant is implemented in the codebase. Production builds with VARIANT=public. A separate Vercel project or preview can set `NEXT_PUBLIC_VARIANT=lite` to ship the unbranded "Book Scanner" experience. This change does not require standing up that deployment; it only ensures the code in main supports it.

### 4. No new OpenSpec for already-specified behavior

Content explanation, scan recording, carousel, and the lite variant are specified in `add-content-warning-explanation`, `recent-scans`, and `add-subtext-lite-variant`. This change adds a `release-integration` capability that states production SHALL include those capabilities; it does not re-specify their internals.

## Risks / Trade-offs

- **Merge conflicts**: main could have diverged (e.g. hotfixes). Mitigation: resolve conflicts, run tests and smoke checks after merge.
- **Regressions**: Large merge can introduce regressions. Mitigation: run full test suite and manual smoke (content explanation, scan recording, carousel, Settings, themes, navbar app name, variant badge).

## Open Questions

- None.
