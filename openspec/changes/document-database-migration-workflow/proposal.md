# Change: Document database migration workflow

## Why

Database schema changes are applied via Supabase migrations in `supabase/migrations/`, and the project prefers Supabase MCP `apply_migration` for schema changes, but there is no single OpenSpec capability that defines the workflow. Conventions are scattered across `.cursorrules`, handover docs, and security audits. The legacy `/api/run-migration` route is a critical security risk when exposed. Documenting the migration workflow in a spec gives a single source of truth for how to create, name, apply, and verify migrations, and how to treat or retire the run-migration API.

## What Changes

- Add a new capability **database-migrations** with requirements for:
  - Migration file location and naming convention
  - Preferred apply path (Supabase MCP `apply_migration`; Supabase CLI as fallback)
  - Testing migrations on a branch before production
  - Rollback or remediation instructions in migration file comments
  - Treatment of the existing `/api/run-migration` endpoint (deprecated or strictly gated and documented)
- No application code changes in this proposal; documentation and spec only. Implementation of any deprecation or gating of `/api/run-migration` can be a follow-up task.

## Impact

- **Affected specs**: `database-migrations` (new capability).
- **Affected code**: None in this change (proposal only). Future work may touch `app/api/run-migration/route.ts`, `.cursorrules`, and `docs/` migration guidance.
