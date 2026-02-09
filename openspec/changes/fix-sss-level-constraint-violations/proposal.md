# Change: Fix SSS level DB constraint violations on backfill and persist

## Why

During the one-time SSS backfill (`npx tsx scripts/backfill-sss.ts`), three books failed with:

`new row for relation "books" violates check constraint "books_sss_level_check"`

The DB allows only `NULL` or one of `S0_NO_INPUT`, `S1_GENTLE`, `S2_MILD`, `S3_MODERATE`, `S4_INTENSE`. Any other value (e.g. wrong case, stray characters, or model output that passed parsing but differed from the exact enum) causes the insert/update to fail. To make backfills and all future SSS writes robust, the system must guarantee that only DB-allowed values are ever written.

## What Changes

- **Normalize SSS level before persistence** – Add a single source of truth for allowed `sss_level` values. Before any write to `books.sss_level`, coerce the value to one of the allowed enum values (e.g. normalize case and map known variants, or use a safe fallback such as `S2_MILD` when invalid).
- **Harden assignSSS return value** – Ensure `assignSSS()` and its response parser only return values that satisfy the DB constraint; normalize the parsed model output (e.g. uppercase, trim) and validate against the allowed list before returning.
- **Backfill script** – When updating books, pass the value through the same normalization so that even if a future model or code path returns an invalid string, the backfill does not fail with a constraint violation.
- **Re-run backfill for failed books** – After implementation, the three previously failed books can be updated (manually or by re-running the backfill for remaining null `sss_level` rows).

## Impact

- Affected specs: sss-assignment (modified requirement: output persistable without constraint violation)
- Affected code:
  - `lib/services/sss-assignment.ts` – normalize parsed level before return; export allowed-level list or normalizer used by callers
  - `scripts/backfill-sss.ts` – normalize `result.sss_level` before DB update
  - `lib/services/scan-service.ts` – optional: normalize before early-return backfill update (for consistency; can rely on assignSSS returning valid value once service is hardened)
