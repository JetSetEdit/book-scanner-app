# Change: Add SSS (Subtext Suitability Scale) to Recent Scans

## Why

SSS (Subtext Suitability Scale) is assigned to every book after analysis and is shown on book details and the collection page. The "Recently Scanned" section on the homepage never included SSS: the API does not fetch `sss_level` from the books table, and the flip-card UI does not display it. Users expect to see the same suitability signal (S0–S4 / Not yet assessed, Gentle, Mild, Moderate, Intense) on recent scan cards for consistency and quick scanning.

## What Changes

- **API** – `GET /api/recent-scans` SHALL include `sss_level` from the `books` table for each scan's book in the response. The field SHALL be present on every `book` object (nullable when the book has no level).
- **UI** – The back of each Recently Scanned flip card SHALL display the SSS label using the same semantics as the book details and collection pages (S0 = "Not yet assessed", S1–S4 = Gentle / Mild / Moderate / Intense). When `sss_level` is null or missing, the client SHALL show "Not yet assessed" or omit the SSS row so the component does not break.

## Impact

- Affected specs: recent-scans (ADDED requirements)
- Affected code:
  - `app/api/recent-scans/route.ts` – add `sss_level` to books select and to formatted `book` object
  - `components/recent-scans.tsx` – add `sss_level` to `RecentScan` book type; render SSS pill/label on flip-card back (between metadata and warning icons or between warning icons and actions)
