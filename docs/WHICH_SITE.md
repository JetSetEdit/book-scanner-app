# Which site / URL should I use?

**Use this as the single source of truth for Subtext environments.**

---

## For you (and Super Testers): use production

| Purpose | URL | When to use |
|--------|-----|-------------|
| **Production (canonical)** | **https://www.subtextscanner.com.au** | Real users, testers, demos, support links. This is the only URL you need for “the actual site.” |

Also valid: **https://subtextscanner.com.au** (redirects to www).

---

## Other URLs (avoid for day-to-day use)

| URL | What it is | Use only when |
|-----|------------|----------------|
| **preview.subtextscanner.com.au** | Vercel preview (e.g. PR previews) | Testing a specific branch/PR before merge. |
| **\*.vercel.app** (e.g. subtext-books.vercel.app, book-scanner-app-eta.vercel.app) | Old/default Vercel project URLs | Ignore for normal use. Some docs/scripts still mention them; production is subtextscanner.com.au. |
| **localhost:3000** | Local dev | When running `npm run dev` on your machine. |

---

## Summary

- **Give testers and stakeholders:** https://www.subtextscanner.com.au  
- **Give Super Testers:** The VIP invite link (e.g. `https://www.subtextscanner.com.au/api/invite/<code>`) so they get VIP access and higher scan limits.  
- **Don’t** send people to random vercel.app URLs; they’re legacy and confusing.

*Last updated: March 2026*
