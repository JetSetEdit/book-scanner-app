# SSS (Subtext Suitability Scale) removal

**Date:** 2025-03-03

Subtext Suitability was removed from the product: UI no longer shows or filters by SSS. This doc records what was removed and how to restore or back up data if needed.

## What was removed

- **UI:** Book details SSS row and tooltip; collection filter "Subtext Suitability" and URL param `sss`; mobile filter indicator for `sss`.
- **Code:** `lib/services/sss-assignment.ts`, `lib/services/__tests__/sss-s0-no-input.test.ts`, scripts `backfill-sss.ts` and `test-sss-assignment.ts` (archived under `docs/archive/`).
- **Types:** `sss_level` and `sss_notes` removed from `types/supabase.ts` after migration.
- **DB (optional):** Migration `20260303_drop_sss_columns.sql` drops `books.sss_level` and `books.sss_notes`. Apply when ready.

## Backup and migration (done 2025-03-03)

1. **Backup:** Export was run via Supabase MCP `execute_sql` before dropping columns. **100 books** had non-null SSS data. A sample (first 3 rows) is in `docs/archive/sss_backup_20260303.json`. The full result was available in the MCP response at migration time; if you need the full list, restore from a Supabase backup snapshot or re-run the SELECT (only possible if columns are re-added).
2. **Migration applied:** Supabase MCP `apply_migration` was run with name `drop_sss_columns` on project `tawolulyrlnpxjyyxpdw` (supabase-spice-shelf). Columns `books.sss_level` and `books.sss_notes` and constraint `books_sss_level_check` have been dropped.

## Archived files

- `docs/archive/sss-assignment.ts` – SSS assignment service (was `lib/services/sss-assignment.ts`)
- `docs/archive/sss-s0-no-input.test.ts` – unit test (was `lib/services/__tests__/sss-s0-no-input.test.ts`); import path is `../sss-assignment` (same folder).
- `docs/archive/scripts/backfill-sss.ts` – backfill script (imports `@/lib/services/sss-assignment`; restore that file first if you need to run it).
- `docs/archive/scripts/test-sss-assignment.ts` – test script (same).

OpenSpec and other docs under `openspec/changes/` that reference SSS (e.g. add-sss-assignment-agent, add-s0-no-input-sss-level) are left in place for history; they are not wired to the app anymore.
