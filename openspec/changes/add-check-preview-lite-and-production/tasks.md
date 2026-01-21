## 1. Implementation

- [x] 1.1 Add `app/api/variant-check/route.ts`: GET handler that returns `{ ok: true, variant, vercelEnv, appName }`. Use `getVariantId()` and `getVariantConfig()`. If `getVariantConfig()` is missing for the id (e.g. `lite` before it exists), use `appName: 'unknown'`. Include `vercelEnv: process.env.VERCEL_ENV || null`. No secrets.
- [x] 1.2 Create `docs/DEPLOYMENT_VERIFICATION.md`: Define Preview Lite and Production; required `NEXT_PUBLIC_VARIANT`; curl examples for `GET /api/variant-check` against production and preview-lite URLs.
- [x] 1.3 In `env.example`, add a short note under `NEXT_PUBLIC_VARIANT` that Production uses `public` (or unset) and Preview Lite uses `lite`.

## 2. Validation

- [x] 2.1 Run the app locally with `NEXT_PUBLIC_VARIANT=public` and `GET /api/variant-check` → `variant: 'public'`, `appName: 'Subtext'`.
- [x] 2.2 After `add-subtext-lite-variant` is implemented, run with `NEXT_PUBLIC_VARIANT=lite` and `GET /api/variant-check` → `variant: 'lite'`, `appName: 'Book Scanner'`.
- [x] 2.3 Confirm the response never includes API keys or secrets.
