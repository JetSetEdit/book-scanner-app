# Change: Add a short explanation of how content warnings are generated for users

## Why

Users see content warnings on book pages but have no way to understand how they are produced. A brief, honest explanation builds trust, sets expectations that results are advisory and evidence-based, and reduces confusion when a book has few or no warnings.

## What Changes

- Add a short, user-facing explanation of how content warnings are generated, visible on the book details page near the content warnings section.
- The explanation SHALL be concise (2–4 sentences), non-technical, and aligned with project constraints: evidence-based, spoiler-free, no genre/author inference, formula-driven severity, advisory-only.
- Surface it via an expandable “How we generate these” control (or equivalent) so the main view stays uncluttered; the full explanation is one click or tap away.

## Impact

- Affected specs: `content-warnings` (new capability)
- Affected code: `components/book-details.tsx` (and optionally shared copy in `lib/` or `components/` if we centralize the text)
