# Change: Define third-party resource compliance for commercial launch

## Why

Subtext is free to use; any revenue (e.g. affiliate links such as Amazon) is intended to support running the site—cyclical funding for Supabase, hosting, scaling, domain, API credits, and the like. For license purposes the product is still commercial (revenue-generating), so a clear, safe policy is required for any third-party psychology or NLP resources (e.g. trigger-warning corpora, emotion-trigger datasets, ACE-NLP, LitEmo) that may inform or be used in content warnings, SSS, or related features. Licenses vary: MIT (permissive), GPL-3.0 (copyleft), or unspecified (citation/permission). Without a single documented policy, the project risks license violations or ambiguity when integrating research code or datasets.

## What Changes

- Add a new capability **third-party-resource-compliance** with requirements for:
  - Maintaining a single source-of-truth document that lists each third-party psychology/NLP (or similar) resource considered or used, its license, and permitted use (embed, use with attribution, inspiration-only, cite-only).
  - Using MIT-licensed code or data only with explicit attribution (e.g. NOTICE or doc); never embedding GPL-licensed code into the codebase.
  - Treating GPL-licensed resources as methodology/ideas only—no copy or link of GPL code.
  - For unlicensed resources: requiring citation; for commercial use or redistribution of their code/data, documenting that permission should be sought or use limited to ideas-only with citation.
- Implementation is documentation and process only: create or extend a doc (e.g. `docs/THIRD_PARTY_RESOURCES.md`), optionally add NOTICE file for MIT dependencies. No change to product behaviour; this enables safe future use of external resources.

## Impact

- **Affected specs**: `third-party-resource-compliance` (new capability).
- **Affected code**: None in this change. Optional: add `NOTICE` or attribution in repo; new or updated doc under `docs/`.
