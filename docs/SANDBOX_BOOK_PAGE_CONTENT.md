# Sandbox Book Page – Content Inventory

What appears on `/sandbox/book/[isbn]` (e.g. Love on the Brain), in order.

---

## Page sections at a glance

1. **Sandbox banner** (sticky) – “Sandbox” text + “Try another” / “View live page”
2. **Nav bar** – Back, Scan Another, version
3. **Book cover** – Cover image (or placeholder)
4. **Content at a glance** (left column) – Under book cover, above Specifications: severity strip + counts (Mild X · Moderate Y · Severe Z) or “No content warnings”, plus “See full content analysis” link to `#content-analysis`. Shown when book is analyzed; hidden when not yet analyzed.
5. **Specifications** – ISBN, Publisher, Released, Length
6. **Book info** – Categories, Title, Author, Buy/Share, Subtext Suitability, Content Rating (live only)
7. **Synopsis** – Description + Read more
8. **Content Analysis** – Heading, then:
   - (Dev) Based on…
   - Quick Glance / BookTok bullets
   - Age recommendation box
   - Disclaimer line
   - How we generate (collapsible)
   - “In short:” summary line
   - **Content warnings** – Author’s list, Official notes, Disclosure list, Community, Support resources
   - Feedback (“Report this book”)
9. **Footer** – Google attribution, (Dev) Audit trail
10. **Sponsored card** (sandbox only, when enabled)

---

## 1. Sandbox banner (sticky)
- Short line: “Sandbox – changes here do not affect the live book page” (or “Sandbox” on mobile).
- Button: “View live page →” (opens `/book/[isbn]` in new tab).

---

## 2. Top nav bar
- Left: “← View live page” (link to live book page).
- Right: “Scan Another” button, “Subtext vX.XX”.

---

## 3. Two-column layout

### Left column (sticky on large screens)
- **Cover image** (or “Cover unavailable”).
- **Content at a glance** – Severity strip + “Mild X · Moderate Y · Severe Z” or “No content warnings”; “See full content analysis” link. Shown when analyzed.
- **Specifications**
  - ISBN, Publisher (if set), Released (if set), Length / page count (if set).

### Right column

#### 3a. Header
- **Category pills** (e.g. Fiction, Romance), excluding CLASSIFICATION: and nyt:.
- **Comfort Read** badge (only when analysis complete and no warnings).
- **Title** (large serif).
- **Author** (italic, link to collection by author).
- **Buy** and **Share** buttons.
- **Subtext Suitability (SSS)** – e.g. “S1 – Gentle” with tooltip (and optional sss_notes in dev).
- **Content Rating** – e.g. “PG” / “M” / “MA15+” with tooltip (when `CLASSIFICATION:*` exists).
- **Severity Score Badge** (dev only).

#### 3b. Synopsis
- Book description (truncated with “Read more” / “Show less” if long).
- **Metadata limitations** block (dev only, when missing cover or thin description).

#### 3c. Content Analysis (big section)
- **Section title**: “Content Analysis” (centered, with horizontal lines).
- **“Based on”** (dev only): description length, mode, web enrichment, verified; optional “Run Deep scan” CTA.
- **Quick Glance / BookTok summary** – short bullets of warning themes (when variant allows and there are warnings).
- **Age Recommendation** – prominent box: rating (e.g. MA15+), age line, methodology text, “indicative only” disclaimer (when classification exists).
- **Disclaimer**: “Content warnings help readers make informed choices…”
- **“How we generate these”** – collapsible with HOW_WE_GENERATE_LABEL and explanation text (when variant allows).
- **Dynamic Reader Summary** – one italic paragraph summarising warnings (when variant allows and there are warnings).
- **ContentWarningsList** (sandbox uses disclosure variant):
  - **Author’s content warnings** (if URL or list set): collapsible list + “Source: author’s page”.
  - **Official Author Notes** (if any verified warnings).
  - **Detailed content warnings** – grouped by parent category (e.g. Violence, Sexual Content). Each category is an expandable row (severity bar + icon + category name + count + chevron); expanding shows the specific warnings underneath (e.g. Violence — Graphic Violence, Violence — Domestic Violence), each with its own disclosure for description, Why?, thumbs.
  - **Community Reports** – same disclosure pattern (if any).
  - **Support resources** – by theme (mental health, DV/sexual assault, LGBTIQA+, substance, grief, bullying, racism) when relevant; optional state-specific services; rounded block with border; crisis links have hover/focus underline and ≥44px touch targets; "In an emergency, call 000" prominent.
  - **Quick Exit** (when relevant and user preference on).
  - **Disclaimer** at bottom of list (when variant shows reasoning).
- **Feedback**: “Found an error? Report this book.” (opens FeedbackDialog).

#### 3d. Footer
- **Google Books attribution** (TOS).
- **[DEV] System Logs & Audit Trail** (collapsible), only when dev and “Show Audit Trail” on.

---

## 4. After BookDetails (sandbox page only)
- **Sponsored card** (when monetization has results footer placement).

---

## Summary
- **Above the fold**: Banner, nav, cover + specs, title/author, Buy/Share, SSS, Content Rating, start of synopsis.
- **Main focus**: Content Analysis block (age box, disclaimer, how we generate, reader summary, then disclosure list of warnings + author section + support + feedback).
- **Redundancy**: Content Rating appears twice – once in header (pill + tooltip) and once in “Age Recommendation” box. SSS and Classification are both “ratings” near the top.
- **Conditional**: Author’s list, official notes, community warnings, support resources, Quick Exit, dev blocks, and monetization card all depend on data or flags.

---

## Improvements made (sandbox)

- **Single age rating**: On sandbox, the small "Content Rating" pill next to SSS is hidden; only the "Age Recommendation" box is shown.
- **Banner "Try another"**: Link to `/scan` added so you can open the scanner from the sandbox banner.
- **Heading hierarchy (UX/a11y)**: Document outline is h1 (book title) → h2 (Content Analysis) → h3 (Age recommendation, Support Resources, Detailed content warnings, etc.). Specifications is a non-heading label so the outline has no skip. The automated-warnings subsection is labeled "Detailed content warnings" to avoid duplicate "Content analysis" in the outline.
- **Contrast (WCAG AA)**: Disclaimer and secondary text (Age Recommendation methodology, "In short" line, main disclaimer) use `text-foreground/80` so contrast meets ≥4.5:1.
- **Support Resources**: Block has subtle background, border, and rounded corners; crisis links have hover/underline and focus-visible underline; touch targets ≥44px where feasible; "In an emergency, call 000" remains bold/foreground.
- **Cover badge**: No badge currently overlays the cover; any future cover badge MUST use non-overlapping placement, descriptive `aria-label`, and keyboard-focusable control with visible focus ring (documented in `book-details.tsx`).
- **Scannability and a11y**: Age Recommendation "How we determine this rating" collapsible has focus-visible ring; disclosure triggers and category toggles have focus-visible ring; "Found an error? Report this book" is in a separate `#feedback` block with distinct styling and visible focus ring.
- **Content at a glance under cover**: The severity strip + counts (or “No content warnings”) and “See full content analysis” link live in the left column under the book cover, above Specifications, so users see the at-a-glance summary without scrolling.

## Third-party feedback (v1.03.73) — clarifications

- **Content Rating (M) badge missing in sandbox header:** **Intentional.** On sandbox we hide the small "Content Rating" pill next to SSS so there is a single age rating (the Age Recommendation box below). This avoids redundancy; the full box includes the same rating plus methodology and disclaimer. On live, the header pill remains. Not a regression.
- **"1 Issue" dev indicator on live (bottom-left):** No "1 Issue" or report-count badge was found in the current book page or book-details components. If it appears on a live deploy, it may come from another route, a dev-only component, or an older build. Recommend checking the live deployment source and removing or gating any such indicator before shipping sandbox UX to production.
- **ACB methodology disclaimer on sandbox:** The Australian Classification Board disclaimer ("This is an indicative rating only. We have no association with the Australian Classification Board and this is not an official rating.") is present on both live and sandbox inside the Age Recommendation box. It lives **inside the "How we determine this rating" collapsible** — expand that trigger to see the methodology paragraph and the disclaimer. Same component and content on both.

## Possible future improvements

- **One summary**: Show either BookTok bullets or Dynamic Reader Summary, not both.
- **Sandbox index**: A `/sandbox` page with ISBN input to jump to any `/sandbox/book/[isbn]`.
- **Compare view**: Side-by-side sandbox vs live for A/B comparison.
