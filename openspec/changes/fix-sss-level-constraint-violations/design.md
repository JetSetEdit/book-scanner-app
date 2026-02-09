# Design: SSS level constraint safety

## Problem

`books.sss_level` has a CHECK constraint allowing only:

- `NULL`
- `'S0_NO_INPUT'`, `'S1_GENTLE'`, `'S2_MILD'`, `'S3_MODERATE'`, `'S4_INTENSE'`

If any code path writes a different string (e.g. from model output with wrong case or a parsing edge case), the write fails. The backfill script and the scan pipeline both write `sss_level`; both must be protected.

## Approach

1. **Single allowed list** – Define the list of allowed DB values in one place (e.g. `lib/services/sss-assignment.ts` or a small shared constant). Use it for validation and normalization everywhere.
2. **Normalize in assignSSS** – In `parseResponse()`, after parsing the model JSON, normalize `sss_level`: trim, uppercase to match enum (e.g. `S1_GENTLE` not `s1_gentle`), then check membership in the allowed list. If not in list, return null so the caller uses the existing fallback (S2_MILD). Optionally add a small “normalize to allowed” helper that maps close matches (e.g. `S2_Mild` → `S2_MILD`) so we never return an invalid string.
3. **Normalize at write sites** – Before any `books` update that sets `sss_level`, run the value through the same normalizer (or call a shared `toDbSSSLevel(value): SSSLevel | null`). If normalizer returns null or invalid, use a safe default (e.g. `S2_MILD`) so the write never violates the constraint.
4. **Backfill** – In `scripts/backfill-sss.ts`, before `supabase.from('books').update({ sss_level, sss_notes })`, set `sss_level = normalizer(result.sss_level) ?? 'S2_MILD'` (or equivalent). That way the three previously failed books can be fixed by re-running the backfill.

## Trade-offs

- **Where to put the normalizer** – In `sss-assignment.ts` so all callers (scan-service, backfill) can import one function. Keeps DB constraint and assignment logic aligned.
- **Fallback when invalid** – Use `S2_MILD` with a note that assignment was defaulted (consistent with existing “could not be completed” fallback), so the book still gets a valid row and can be re-analyzed later if needed.
