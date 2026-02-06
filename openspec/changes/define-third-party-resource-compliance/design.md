# Design: Third-party resource compliance for commercial launch

## Context

- Subtext is free to use. Any revenue (e.g. affiliate links) is intended to support the site: cyclical funding for Supabase, hosting, scaling, domain, API credits, etc. For license purposes the product is still "commercial" (revenue-generating).
- External psychology/NLP resources of interest include: trigger-warning assignment (MIT), emotion triggers (unlicensed), CovidET (unlicensed), ACE-NLP (unlicensed), LitEmo (GPL-3.0). Each has different license and risk.
- Existing policy covers **data sourcing** (`docs/DATA_SOURCING_POLICY.md`); there is no single policy for **research code or reference datasets** used to inform or validate content-warning/SSS behaviour.

## Goals / Non-Goals

- **Goals**: (1) Single documented policy for what may be used, how (embed vs inspiration vs cite), and what attribution is required. (2) Safe path to use MIT resources with attribution. (3) No GPL code in codebase. (4) Clear stance on unlicensed resources (cite; seek permission if redistributing or heavy commercial reliance).
- **Non-Goals**: Legal advice; changing product behaviour; implementing integration of any specific repo (that remains future work, guided by this policy).

## Decisions

- **Single document**: Maintain one doc (e.g. `docs/THIRD_PARTY_RESOURCES.md`) that lists each resource, license, permitted use, and attribution requirement. This can reference or sit alongside `DATA_SOURCING_POLICY.md` (which stays focused on book metadata and datasets).
- **MIT**: Permitted for use and modification in the project. Require clear attribution (NOTICE or dedicated section in the doc). No copyleft impact.
- **GPL-3.0**: Do not copy or link GPL code into the Subtext codebase. Use only methodology or ideas (e.g. from papers); reimplement in our own code. This avoids GPL propagating to the project.
- **Unlicensed**: Do not assume a license. Require citation when referencing papers or datasets. If we ever embed code or redistribute data from an unlicensed repo, document that permission should be sought; until then, limit to ideas-only and citation.
- **Commercial intent**: Policy applies regardless of current user count; "0 users" does not relax license obligations.

## Risks / Trade-offs

- **Risk**: Unlicensed repos may later clarify license or deny use. **Mitigation**: Document "ideas-only + citation" and optional "contact authors for permission" so we have a defensible stance and can upgrade to explicit permission if we integrate.
- **Trade-off**: Keeping GPL code out limits direct reuse of LitEmo code. **Acceptable**: We can still use their research and reimplement; our SSS and content-warning logic is already custom.

## Migration Plan

- No migration. Add the doc and (if needed) NOTICE. No code or schema changes.

## Open Questions

- None for this proposal. Future work may add a row per new resource as we evaluate it.
