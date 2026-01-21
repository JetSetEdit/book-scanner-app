## ADDED Requirements

### Requirement: Verify Preview Lite and Production variant and environment

The system SHALL provide a way to check the active variant and deployment environment for a running deployment. The check SHALL return the variant id (`public`, `libraries`, `schools`, or `lite`), the Vercel environment when available (`production`, `preview`, or `development`), and the app name from the active variant config. The check SHALL NOT expose secrets or internal configuration beyond variant id, `VERCEL_ENV`, and the public app name.

#### Scenario: Check Production deployment

- **GIVEN** a Production deployment with `NEXT_PUBLIC_VARIANT=public` (or unset, or `libraries` or `schools`)
- **WHEN** a client requests `GET /api/variant-check`
- **THEN** the response SHALL include `ok: true`, `variant` in `public`|`libraries`|`schools`, `vercelEnv` (e.g. `production` when on Vercel), and `appName` consistent with that variant (e.g. "Subtext" for public)

#### Scenario: Check Preview Lite deployment

- **GIVEN** a Preview Lite deployment with `NEXT_PUBLIC_VARIANT=lite` at build time (requires add-subtext-lite-variant)
- **WHEN** a client requests `GET /api/variant-check`
- **THEN** the response SHALL include `ok: true`, `variant: 'lite'`, `vercelEnv` (e.g. `preview` or `production` depending on Vercel), and `appName: 'Book Scanner'`

#### Scenario: Check does not expose secrets

- **WHEN** a client requests `GET /api/variant-check`
- **THEN** the response SHALL NOT include API keys, service role keys, or any other secrets
- **AND** the response SHALL only include `ok`, `variant`, `vercelEnv`, and `appName`
