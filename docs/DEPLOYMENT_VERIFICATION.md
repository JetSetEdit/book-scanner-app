# Deployment Verification: Preview Lite and Production

This doc defines **Preview Lite** and **Production** and how to check that a deployment is configured correctly.

## Definitions

### Production

- **Purpose**: Main Subtext app at subtextscanner.com.au (or your production domain).
- **`NEXT_PUBLIC_VARIANT`**: `public`, `libraries`, `schools`, or **unset** (unset defaults to `public`).
- **App name**: "Subtext" (or "Subtext for Libraries/Schools" for those variants).
- **Behavior**: Full Subtext branding, features grid, "How we generate these", "Learn how we work", affiliate, BookTok/Dynamic Reader summaries, reasoning/confidence in the warnings list.

### Preview Lite

- **Purpose**: Unbranded "Book Scanner" for beta sharing; no Subtext or AI/automated language in-app.
- **`NEXT_PUBLIC_VARIANT`**: **`lite`** (required at build time).
- **App name**: "Book Scanner".
- **Behavior**: Minimal UI; no features grid, "How we generate these", "Learn how we work", affiliate, BookTok/Dynamic Reader summaries, or reasoning/confidence in the warnings list. Beta modal uses short, neutral copy.

---

## Required env per deployment

| Deployment     | `NEXT_PUBLIC_VARIANT`     |
|----------------|---------------------------|
| Production     | `public` or unset         |
| Preview Lite   | `lite`                    |

---

## Check endpoint: `GET /api/variant-check`

Returns JSON only. No secrets. Safe in all environments.

**Response shape:**
```json
{
  "ok": true,
  "variant": "public",
  "vercelEnv": "production",
  "appName": "Subtext"
}
```

- **`variant`**: `public`, `libraries`, `schools`, or `lite` (from `NEXT_PUBLIC_VARIANT` / defaults).
- **`vercelEnv`**: `production`, `preview`, or `development` when on Vercel; `null` otherwise.
- **`appName`**: From the active variant config (e.g. `"Subtext"` for public, `"Book Scanner"` for lite).

---

## curl examples

**Production:**
```bash
curl -s https://subtextscanner.com.au/api/variant-check
# Expect: "variant": "public" (or "libraries"/"schools"), "appName": "Subtext"
```

**Preview Lite** (replace with your Lite URL):
```bash
curl -s https://your-lite-domain.vercel.app/api/variant-check
# Expect: "variant": "lite", "appName": "Book Scanner"
```

**Local (public):**
```bash
# With NEXT_PUBLIC_VARIANT=public or unset
curl -s http://localhost:3000/api/variant-check
```

**Local (lite):**
```bash
# With NEXT_PUBLIC_VARIANT=lite in .env.local
curl -s http://localhost:3000/api/variant-check
# Expect: "variant": "lite", "appName": "Book Scanner"
```

---

## Notes

- The response must **not** include API keys, Supabase keys, or other secrets.
- If a variant has no config (edge case), `appName` may be `"unknown"`.
