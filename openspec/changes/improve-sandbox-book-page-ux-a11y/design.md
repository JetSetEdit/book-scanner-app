# Design: Sandbox book page UX and accessibility

## Context

The book page is rendered by `BookDetails` and `ContentWarningsList` and is used by both `/book/[isbn]` and `/sandbox/book/[isbn]`. A browser review of the sandbox page surfaced heading hierarchy issues, possible contrast failures, Support Resources prominence, and scannability of the Age Recommendation and disclosure list. Changes must apply to shared components so both live and sandbox benefit; the sandbox remains the primary environment to validate and show the improvements.

## Goals / Non-Goals

- **Goals**: Fix heading hierarchy (single h2, consistent h3 subsections); deduplicate "Content analysis" label; meet WCAG AA for disclaimer/muted text; improve Support Resources visibility and crisis link touch targets; clarify cover badge placement and a11y if present; improve scannability and keyboard/screen-reader behaviour for Age Recommendation and disclosure/report.
- **Non-Goals**: Redesigning the entire book page; adding new features (e.g. sandbox index or compare view); changing content-warning generation or taxonomy.

## Decisions

- **Single h2 for Content analysis**: The main content block (warnings, age recommendation, list) SHALL use one `<h2>` as the section heading. All subsections inside it (Quick Glance, Age recommendation, Support Resources, Author's content warnings, Content analysis list, Community reports, Feedback) SHALL use `<h3>` so the outline is h1 → h2 → h3 with no skip.
- **Single section label**: There SHALL be one visible "Content analysis" (or "Content Analysis") label for the main section. The inner "Content analysis" heading in `ContentWarningsList` (automated warnings subsection) SHALL be distinguished (e.g. "Detailed content warnings" or kept as "Content analysis" only when the parent section title is not repeated in the same view). Implementation may remove the duplicate by making the parent section the only place the phrase appears, or by renaming the inner subsection.
- **Contrast**: Use design tokens (e.g. `text-muted-foreground`) that meet 4.5:1 on the background; if italics are used for the Age Recommendation disclaimer, ensure the colour alone passes. Prefer a single darker muted token over introducing new colours.
- **Support Resources**: Add a light background or border to the Support Resources block; add `hover:underline` or equivalent for crisis links; ensure the "call 000" line stays bold/foreground. Touch target size (min 44px) can be achieved by padding on the link or its container rather than changing font size.
- **Report this book**: Keep the Feedback trigger in a separate block (e.g. below the content warnings list, in the existing `#feedback` section) with distinct styling so it is not visually grouped with category toggles. No functional change to FeedbackDialog.
- **Cover badge**: If the codebase currently shows a badge on the cover (e.g. "1 Issue" for content reports), the implementation SHALL move it off the cover or to a non-overlapping corner and add `aria-label` and focus handling. If no such badge exists today, this requirement is satisfied by documenting that any future cover badge MUST follow these rules; no new badge need be added.

## Risks / Trade-offs

- **Heading change**: Changing from multiple h3s to h2 + h3 may affect any existing analytics or scrapers that rely on heading structure; risk is low and outline correctness is a net benefit.
- **Contrast**: Darkening muted text slightly may feel less "soft" to some users; the trade-off is WCAG compliance and readability.

## Migration Plan

- No data migration. Deploy component and doc updates; verify on sandbox then production.

## Open Questions

- None; scope is limited to the listed improvements.
