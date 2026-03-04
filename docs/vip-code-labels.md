# VIP code labels (TAM, AYLA, MEG)

The `vip_codes` table has an optional `label` column so you can remember who each code is for.

## Known mappings

| Label | Code | Invite link |
|-------|------|-------------|
| Ayla | h5bl6dtnqj9r36vvgf8n | https://www.subtextscanner.com.au/api/invite/h5bl6dtnqj9r36vvgf8n |
| Meg | jgk7avqgw17y6i10cgit28 | https://www.subtextscanner.com.au/api/invite/jgk7avqgw17y6i10cgit28 |
| TAM | _(assign when you have the code)_ | — |
| Master (reusable) | wnw40f1hg3ccnyx4fdqw | https://www.subtextscanner.com.au/api/invite/wnw40f1hg3ccnyx4fdqw |

## Run the migration (if not already applied)

In **Supabase → SQL Editor** run:

```sql
ALTER TABLE vip_codes ADD COLUMN IF NOT EXISTS label text;
COMMENT ON COLUMN vip_codes.label IS 'Optional human-readable label (e.g. person or team name).';
```

## Set labels for Ayla and Meg

```sql
UPDATE vip_codes SET label = 'Ayla' WHERE code = 'h5bl6dtnqj9r36vvgf8n';
UPDATE vip_codes SET label = 'Meg'  WHERE code = 'jgk7avqgw17y6i10cgit28';
```

Then add TAM when you have their code:

```sql
-- UPDATE vip_codes SET label = 'TAM' WHERE code = 'PASTE_CODE_FOR_TAM';
```

## Check

```sql
SELECT code, label, is_used, reusable FROM vip_codes ORDER BY created_at DESC;
```
