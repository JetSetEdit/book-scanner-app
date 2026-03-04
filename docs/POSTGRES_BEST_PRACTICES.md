# Postgres Best Practices (Supabase)

This project follows the [Supabase Postgres Best Practices](https://www.postgresql.org/docs/current/) skill. Summary of how we apply it:

## 1. Query performance (indexes)

- **WHERE / JOIN columns**: We add indexes on columns used in `WHERE` and JOINs so large tables avoid sequential scans.
- **Foreign keys**: We index FK columns (e.g. `scans.book_id`, `content_warnings.book_id`) for fast JOINs and CASCADE.
- **Partial indexes**: Used where it fits (e.g. `books_last_synced_at_idx`, `manual_handling_scans_status_idx` for `pending`).

See migration `20260303_postgres_best_practices_indexes.sql` for:

- `books(isbn)`, `books(title, author)`
- `scans(book_id)`, `scans(isbn)`
- `content_warnings(book_id)`

## 2. Connection management

- The app uses **Supabase JS client** (`@/lib/supabase/admin` and `client`), not raw Postgres connections.
- All DB access goes through Supabase’s API; **connection pooling is handled by Supabase** (PgBouncer). No app-level pool config needed.
- For serverless (Vercel), avoid opening direct Postgres connections from functions; use the Supabase client.

## 3. Security & RLS

- RLS is enabled on tables that need it (`scans`, `vip_codes`, `manual_handling_scans`, `ai_audit_logs`, etc.).
- Admin operations use the **service role** client only in server contexts (API routes, server actions, scripts). See `.cursor/rules/50-supabase-safety.mdc`.
- For RLS policies that use `auth.uid()` or other functions, prefer `(select auth.uid())` in the policy so the function is evaluated once per query, not per row.

## 4. Data access patterns

- Prefer **batch loading** (e.g. `.in('book_id', ids)` or single query with filters) instead of N+1 loops.
- Paginate large lists (e.g. audit logs, manual handling queue) with `range()` or `limit`/`offset`.

## 5. Monitoring

- Use Supabase Dashboard → Database → Query performance and logs.
- For slow queries, run `EXPLAIN (ANALYZE, BUFFERS)` in the SQL Editor to check for sequential scans on large tables.

## References

- Supabase: [Query optimization](https://supabase.com/docs/guides/database/query-optimization), [Connection pooler](https://supabase.com/docs/guides/database/connecting-to-postgres#connection-pooler), [RLS](https://supabase.com/docs/guides/database/postgres/row-level-security)
- Skill references: `references/query-missing-indexes.md`, `references/schema-foreign-key-indexes.md`, `references/conn-pooling.md`, `references/security-rls-performance.md`
