# Design: Database migration workflow

## Context

- Schema changes are stored as SQL files in `supabase/migrations/` and applied to Supabase (Postgres). The project uses Supabase MCP in Cursor and Supabase CLI for local/linked projects.
- A legacy HTTP route `POST /api/run-migration` exists that reads a script from `scripts/` and executes it via `supabaseAdmin.rpc('exec_sql', { sql })`. The security audit marks it as CRITICAL risk if exposed without strong gating.
- .cursorrules already state: use Supabase MCP `apply_migration` for schema changes; migrations live in `supabase/migrations/`; test on a branch first; include rollback instructions in migration comments.

## Goals / Non-Goals

- **Goals**: Single documented workflow for creating and applying migrations; clear preference for MCP over HTTP; explicit stance on `/api/run-migration` (deprecate or gate); rollback/remediation guidance in migration files.
- **Non-Goals**: Changing Supabase CLI behavior; implementing new migration tooling; data migrations or backfills (out of scope for this workflow spec).

## Decisions

### 1. Migration file location and naming

- **Decision**: All schema migration SQL files SHALL live under `supabase/migrations/`. File names SHALL follow a deterministic prefix (e.g. `YYYYMMDD_short_snake_case_description.sql`) so ordering and history are clear.
- **Rationale**: Matches existing repo layout and Supabase CLI expectations; sortable and human-readable.

### 2. Preferred apply path

- **Decision**: Supabase MCP `apply_migration` is the preferred way to apply migrations when available. Supabase CLI (`supabase migration up` or equivalent) is the fallback for local or CI use. The `/api/run-migration` route SHALL NOT be used for new migrations and SHALL be deprecated or strictly gated and documented.
- **Rationale**: MCP keeps migrations in version control and applies them with a single tool; HTTP route is a security liability and reads from a different path (`scripts/`).

### 3. Rollback / remediation

- **Decision**: Each migration file SHALL include in comments either a short rollback SQL snippet or a pointer to remediation (e.g. "To rollback: DROP COLUMN ..."). No automated rollback execution is required.
- **Rationale**: Reduces risk when a migration must be reverted; keeps the bar low (comments only).

### 4. Test on branch first

- **Decision**: Migrations SHALL be tested on a Supabase branch (or a non-production project) before being applied to production, when possible.
- **Rationale**: Aligns with .cursorrules and reduces production incidents.

## Risks / Trade-offs

- **MCP not available in some environments** → Use Supabase CLI and document the steps in the spec.
- **Legacy run-migration usage** → Spec requires deprecation or strict gating; follow-up implementation task to enforce.

## Migration Plan

- N/A (this change is documentation/spec only). Any future change to disable or gate `/api/run-migration` will be a separate change with its own rollout.

## Open Questions

- None for the proposal scope.
