# Which site / URL should I use?

**Use this as the single source of truth for Subtext environments.**

---

## One production site

| Purpose | URL |
|--------|-----|
| **Production (only site)** | **https://www.subtextscanner.com.au** |

Also valid: **https://subtextscanner.com.au** (redirects to www).

- **Gate:** International visitors see the welcome page; the only way past the gate is an **invite code**. Australian visitors go straight to the app.
- **Preview:** We do not use a separate preview domain. Same codebase deploys to production only. (If you had preview.subtextscanner.com.au in Vercel, remove it under **Project → Settings → Domains** to avoid confusion.)
- **Removing outdated deployments:** In Vercel dashboard go to **Deployments**, filter by branch or status, and delete old preview deployments if you want to clean up. Production is always the latest deployment from `main`.

---

## Other URLs

| URL | Use |
|-----|-----|
| **\*.vercel.app** | Ignore; legacy. Use subtextscanner.com.au. |
| **localhost:3000** | Local dev when running `npm run dev`. |

---

## Summary

- **One site:** https://www.subtextscanner.com.au (gate + full app).
- **Access past the gate:** Invite code only (no country-join). Give testers a code or the link: `https://www.subtextscanner.com.au/api/invite/<code>`.

*Last updated: March 2026*
