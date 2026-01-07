# USER_TESTING_CHECKLIST

This is a **practical, quick** checklist for validating Subtext after deployments or major changes.

> Tip: use a cache-busted URL when verifying production UI, e.g. `/scan?cb=1` (PWA/service worker caching can otherwise show stale UI).

## Core flows

- **Home**
  - Navbar loads (Home / Scan / Bookshelf)
  - Search bar works
  - “Start Scanning” CTA routes to `/scan`
  - “Recently Scanned” section renders (if scans exist)

- **Search**
  - Search by title, author, ISBN works
  - Clicking a result routes to `/book/[isbn]`
  - If book isn’t in DB yet, shows recovery UI (“Scan this book”)

- **Scan**
  - Camera toggle works
  - Manual ISBN entry works
  - Progress UI updates stream correctly

- **Book page**
  - Shows title/author/cover placeholder if missing
  - Content warnings render (with thumbs feedback buttons)
  - “Scan Another” routes to `/scan`
  - Version label in header matches navbar version

- **Bookshelf**
  - Pagination works
  - Sorting works
  - Book cards render even with missing covers (placeholder)

- **Legal / info pages**
  - `/terms`, `/privacy`, `/transparency`, `/taxonomy` load without errors

- **404**
  - Friendly 404 page shows CTAs + recent scans section

## Scan credits + rate limiting

Subtext uses **scan credits** (not “scans”) to control cost:

- **Quick scan** costs **1 credit**
- **Deep scan** costs **2 credits** (configurable)

Validate:

- Rate limit panel on `/scan` uses “scan credits” language:
  - “X of Y scan credits remaining today”
  - If 0: “Daily scan credit limit reached”
- Deep mode copy warns it costs more credits
- When credits are insufficient, API returns a helpful message indicating:
  - requested mode (quick/deep)
  - the cost
  - remaining credits
  - reset time

## Version / caching sanity

- Navbar shows an always-visible version badge: `vX.Y.Z`
- Footer shows `{APP_VERSION_LABEL} (vX.Y.Z) • Build … • Updated …`
- If production looks stale, verify with:
  - `/scan?cb=1`
  - or hard refresh / unregister service worker


