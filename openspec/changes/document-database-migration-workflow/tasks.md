## 1. Documentation and spec

- [x] 1.1 Add capability `database-migrations` via spec delta (requirements and scenarios)
- [x] 1.2 Ensure proposal.md, design.md, and tasks.md are complete and consistent

## 2. Validation

- [x] 2.1 Run `openspec validate document-database-migration-workflow --strict --no-interactive` and fix any issues
- [x] 2.2 Confirm no implementation is done in this change (proposal stage only)

## 3. Follow-up (optional, separate change)

- [x] 3.1 Deprecate or strictly gate `POST /api/run-migration` and document in SECURITY_AUDIT_ADMIN_ROUTES or equivalent
- [x] 3.2 Align .cursorrules and any docs (e.g. HANDOVER, README) with the new database-migrations spec
