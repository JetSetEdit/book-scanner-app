# Strip-to-basics: What You Actually Have

This branch pares Subtext down to the **core product** so you can see and test the essentials.

## Core product (what stays)

1. **Scan a book** – Enter ISBN or use camera/barcode → get content warnings and safety info.
2. **Book page** – View a book’s title, cover, content warnings (with severity), reasoning, and support resources.
3. **Bookshelf** – List of books that have been scanned (with pagination).
4. **Recent scans** – On the home page, so users can jump back into recent results.

Supporting pieces that stay:

- **APIs:** `/api/scan`, `/api/check-book`, `/api/book-cover`, `/api/recent-scans`, `/api/search` (and any backend the scan flow needs).
- **Legal:** Privacy and Terms links (and optionally Transparency) for trust.
- **Single variant:** No libraries/schools/lite switching; one experience.

## Reduced or removed for “basics”

- **Homepage:** No long marketing sections (Problem, Solution, Trust, How it works, Proof, FAQ). Just: hero, search, “Scan” CTA, recent scans.
- **Nav:** Home, Scan, Bookshelf only (plus optional Settings). No dev menu, changelog popover, or bonus-scan badge in the main nav.
- **Footer:** Minimal links (e.g. Terms, Privacy, “Support Subtext” if you keep it).
- **Access gate:** Can be turned off via `NEXT_PUBLIC_DISABLE_COUNTRY_GATE=true` so the app opens straight to the main experience.
- **No surface links to:** Admin, Design pages, Dev tools, Check-book, Taxonomy page, Share/referral, Welcome (when gate is disabled).

## What this branch does

- Adds this scope doc.
- Simplifies the **home page** to hero + search + CTA + recent scans.
- Simplifies the **navbar** to core links only (no dev/changelog/bonus in nav).
- Simplifies the **footer** to essentials.
- Optionally: middleware can be relaxed so the app doesn’t redirect to `/welcome` when the env flag is set (already supported).

Admin, design, and dev routes are still in the codebase but not linked; you can remove them in a later pass if you want a fully minimal deploy.
