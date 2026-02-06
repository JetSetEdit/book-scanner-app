## ADDED Requirements

### Requirement: Migration file location and naming

All database schema migration SQL files SHALL be stored under `supabase/migrations/`. Each file name SHALL use a deterministic, sortable prefix (e.g. `YYYYMMDD_short_snake_case_description.sql`) so that migration order is clear and history is auditable.

#### Scenario: New migration file added

- **GIVEN** a developer needs to add a new schema change (e.g. new column on `books`)
- **WHEN** they create the migration file
- **THEN** the file is placed under `supabase/migrations/`
- **AND** the file name matches the project convention (date prefix plus snake_case description, `.sql` extension)

#### Scenario: Migration order is deterministic

- **GIVEN** multiple migration files exist in `supabase/migrations/`
- **WHEN** the files are listed in lexicographic order
- **THEN** the order reflects the intended apply sequence (e.g. `20260101_*.sql` before `20260206_*.sql`)

---

### Requirement: Preferred apply path for migrations

The system SHALL prefer Supabase MCP `apply_migration` as the primary way to apply schema migrations when the MCP is available. Supabase CLI (e.g. `supabase migration up`) SHALL be the acceptable fallback for local or CI use. The HTTP endpoint `POST /api/run-migration` SHALL NOT be used for new migrations and SHALL be deprecated or strictly gated and documented as a legacy path.

#### Scenario: Applying a migration via MCP

- **GIVEN** a migration file exists in `supabase/migrations/` and Supabase MCP is available
- **WHEN** a developer or agent applies the migration
- **THEN** the migration is applied using the Supabase MCP `apply_migration` tool (or equivalent) with the project id and migration name/query from the file
- **AND** the migration is recorded in the project’s migration history

#### Scenario: run-migration endpoint not used for new migrations

- **GIVEN** a new schema change is required
- **WHEN** the team decides how to apply it
- **THEN** the `POST /api/run-migration` route is not used as the primary or recommended path
- **AND** the route is either deprecated or protected by strict auth and documented as legacy

---

### Requirement: Test migrations on a branch before production

Migrations SHALL be tested on a Supabase branch or a non-production project before being applied to production, when branch or staging environments are available.

#### Scenario: Migration tested before production

- **GIVEN** a new migration file has been added
- **WHEN** the team prepares to apply it to production
- **THEN** the migration has been applied and verified on a Supabase branch or non-production project first, when such an environment exists
- **AND** any failures or rollback steps are documented before production apply

---

### Requirement: Rollback or remediation in migration comments

Each migration file SHALL include in its comments either a short rollback SQL snippet or a clear pointer to remediation (e.g. "To rollback: DROP COLUMN ..." or "See restore script X"). Automated execution of rollback is not required.

#### Scenario: Migration file includes rollback guidance

- **GIVEN** a migration file in `supabase/migrations/`
- **WHEN** a maintainer opens the file
- **THEN** the file contains comments that describe how to roll back or remediate the change (e.g. inline SQL or reference to another script)
- **AND** the guidance is sufficient to reverse or fix the schema change manually if needed
