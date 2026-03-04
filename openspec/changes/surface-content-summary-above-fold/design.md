# Design: Surface content summary above the fold

## Context

The book page right column order is: Book info (title, author, Buy/Share, SSS, Content Rating) → Synopsis → (dev metadata issues) → Content Analysis (Quick Glance, age box, disclaimer, full list). Users who want a quick "avoid?" signal must scroll past synopsis to reach Content Analysis. Adding a compact summary between Book info and Synopsis puts the signal above the fold on typical viewports.

## Goals / Non-Goals

- **Goals:** One compact block (severity strip + counts, and optional spice) visible without scrolling; clear when there are no warnings or not yet analyzed; no duplicate long copy (full Quick Glance stays below).
- **Non-Goals:** Moving or removing Quick Glance; changing scan flow or paywall; discovery/browse by safety.

## Decisions

- **Placement:** Insert the compact summary after the closing `</section>` of `#book-info` and before the Synopsis section. In the right column this is after SSS/Content Rating and before "Read more" description.
- **Content:** When `warnings.length > 0`: severity bar (same as Quick Glance: one segment per warning, mild=amber, moderate=orange, severe=red) + one line "Mild X · Moderate Y · Severe Z". Optionally include spice (e.g. "Spice: 🔥🔥") on the same row. When `analysisStatus === 'complete' && warnings.length === 0`: one line "No content warnings" or reuse Comfort Read styling. When analysis unknown: show nothing or a short "Not yet analyzed" so we don't imply safety.
- **Link to detail:** Add a small "See full content analysis" link that scrolls to `#content-analysis` so the compact block clearly ties to the full section.
- **Component:** Inline in `book-details.tsx` to avoid prop-drilling; reuse same severity logic as Quick Glance (mild/moderate/severe counts). No new shared component unless we extract later.
- **Mobile:** Same DOM order; the block stacks above Synopsis so it remains "above the fold" in a single-column layout.

## Risks / Trade-offs

- Slight redundancy with Quick Glance (severity bar appears twice). Mitigation: compact block is minimal (bar + counts + link); Quick Glance below adds triggers/tropes/spice and remains the main at-a-glance card.
- Above-the-fold height increases; synopsis may push down. Acceptable so the primary "avoid?" question is answered first.

## Migration

None. Frontend-only.
