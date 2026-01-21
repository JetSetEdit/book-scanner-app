# Design: Check Preview Lite and Production

## Context

- **Production**: Main Subtext app; `NEXT_PUBLIC_VARIANT` in `public`|`libraries`|`schools`|unset. App name "Subtext" (or "Subtext for Libraries/Schools" when variant is updated to use `getVariantConfig().name` in the navbar).
- **Preview Lite**: Deployment with `NEXT_PUBLIC_VARIANT=lite`; see `add-subtext-lite-variant`. Presents "Book Scanner", minimal UI, no Subtext/AI language. Can be a separate Vercel project or a preview deployment.
- We need to verify which variant and Vercel environment a running deployment is using, without exposing secrets.

## Goals / Non-Goals

- **Goals**: Reliably check Production and Preview Lite deployments; minimal, safe endpoint; documentation.
- **Non-Goals**: Auth for the check; A/B or runtime variant switching; changing how variants are selected.

## Decisions

### 1. Endpoint: `GET /api/variant-check`

Returns `{ ok: true, variant, vercelEnv, appName }`. Uses `getVariantId()` and `getVariantConfig().name`. If a variant has no config (e.g. `lite` before it exists in VARIANTS), return `variant` and `appName: 'unknown'` to avoid 500. Available in all envs (production, preview, development) for operational use.

**Alternatives**: Script-only with no endpoint — cannot check live URLs without a custom build. Chosen: endpoint for curl/CI against live deployments.

### 2. VERCEL_ENV

Read from `process.env.VERCEL_ENV` when available (Vercel sets `production`, `preview`, or `development`). Include in response for clarity.

### 3. No secrets

Response SHALL only include `ok`, `variant`, `vercelEnv`, and `appName`. No API keys, Supabase keys, or internal config.

## Risks / Trade-offs

- Endpoint reveals we use build-time variants; low. No secrets.

## Open Questions

- None.
