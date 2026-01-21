# Change: Add check for Preview Lite and Production deployments

## Why

We need to verify that **Preview Lite** (a deployment with `NEXT_PUBLIC_VARIANT=lite`) and **Production** (main Subtext with `NEXT_PUBLIC_VARIANT=public`, `libraries`, `schools`, or unset) are correctly configured and show the expected variant-specific behavior. This gives operational confidence when running multiple Vercel projects or environments (e.g. a dedicated Lite preview or production) and when shipping the lite variant.

## What Changes

- **Definitions**: Document what "Preview Lite" and "Production" mean: required `NEXT_PUBLIC_VARIANT`, expected app name, and how they differ.
- **Variant check endpoint**: Add a lightweight `GET /api/variant-check` that returns `{ ok: true, variant, vercelEnv, appName }` for the running deployment. No secrets. Safe to expose in all environments so we can `curl` production and preview-lite URLs to confirm configuration.
- **Docs**: How to run the check (curl examples) and required env for each deployment target. Optional script to assert against production and (when available) preview-lite URLs.
- **env.example / deployment notes**: Clarify `NEXT_PUBLIC_VARIANT` for Production vs Preview Lite.

## Impact

- Affected specs: `deployment-verification` (new capability)
- Affected code: `app/api/variant-check/route.ts` (new), `docs/DEPLOYMENT_VERIFICATION.md` (new), `env.example`; optionally `scripts/check-deployments.ts`
- Dependencies: Full "Preview Lite" check requires `add-subtext-lite-variant` to be implemented. The endpoint and Production check can ship before that.
