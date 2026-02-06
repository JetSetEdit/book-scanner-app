## ADDED Requirements

### Requirement: Merge feature branches to main when ready

The project SHALL merge a feature branch into `main` when: (a) the associated OpenSpec change (if any) is complete (all tasks in tasks.md done), (b) the branch builds and the test suite passes, and (c) a deployment preview has been verified where applicable. Conflicts SHALL be resolved in favour of the branch’s implementation for feature code; main-only fixes (e.g. hotfixes) SHALL be preserved where they do not conflict. After merge, the full test suite and smoke checks SHALL be run.

#### Scenario: Merge branch with completed OpenSpec change

- **GIVEN** a feature branch (e.g. `feature/sss-rating`) and an OpenSpec change marked complete
- **AND** the branch builds and tests pass
- **WHEN** the team merges the branch into `main`
- **THEN** conflicts (if any) are resolved using the branch’s implementation for feature code and preserving main-only fixes where there is no conflict
- **AND** after merge, the test suite and smoke checks are run
- **AND** the corresponding OpenSpec change is eligible to be archived after deployment

#### Scenario: Merge branch with no OpenSpec change

- **GIVEN** a feature branch with no associated OpenSpec change
- **AND** the branch builds and tests pass
- **WHEN** the team merges the branch into `main`
- **THEN** the same conflict-resolution and post-merge verification rules apply
- **AND** no OpenSpec archive step is required for that branch

---

### Requirement: Archive completed OpenSpec changes after deployment

When the work for an OpenSpec change is deployed to the target environment (e.g. main/production), the change SHALL be archived. The change directory SHALL be moved to `openspec/changes/archive/YYYY-MM-DD-<change-id>/`. If the change introduced or modified capabilities, `openspec/specs/` SHALL be updated (e.g. via `openspec archive <change-id>` or manual spec promotion). Tooling-only changes SHALL use `openspec archive <change-id> --skip-specs --yes`. After archiving, `openspec validate --strict --no-interactive` SHALL be run to confirm.

#### Scenario: Archive change that added a capability

- **GIVEN** an OpenSpec change that added or modified a capability (e.g. database-migrations)
- **AND** the change is complete and the work is deployed to main
- **WHEN** the team archives the change
- **THEN** the change directory is moved to `archive/YYYY-MM-DD-<change-id>/`
- **AND** the capability is reflected in `openspec/specs/` (spec content promoted or merged from the change delta)
- **AND** `openspec validate --strict --no-interactive` passes

#### Scenario: Archive tooling-only change

- **GIVEN** an OpenSpec change that did not add or modify a capability (tooling-only)
- **AND** the change is complete and deployed
- **WHEN** the team archives the change
- **THEN** the change is archived with `openspec archive <change-id> --skip-specs --yes` (or equivalent)
- **AND** no new or updated spec files are required in `openspec/specs/`

---

### Requirement: Periodic cleanup checklist for branches and OpenSpec

The project SHALL maintain a documented checklist or cadence (e.g. "before each release" or "monthly") for: (1) identifying feature branches that have been merged to main or are obsolete and may be deleted (locally and/or remotely), and (2) identifying completed OpenSpec changes that are deployed but not yet archived, then performing the archive steps. The checklist or cadence SHALL be documented in the repo (e.g. in docs, README, or this capability’s spec or design).

#### Scenario: Run cleanup checklist

- **GIVEN** the documented cleanup cadence or trigger (e.g. pre-release)
- **WHEN** the team runs the cleanup checklist
- **THEN** they identify branches that are merged or obsolete and may be deleted
- **AND** they identify completed OpenSpec changes that are deployed but not archived
- **AND** they perform archive for those changes and optionally delete or document stale branches

#### Scenario: New contributor finds workflow

- **GIVEN** a contributor needs to merge a branch or archive a change
- **WHEN** they look for the project’s merge and archive process
- **THEN** they find the release-workflow capability (and design/proposal) that describes merge criteria, archive steps, and the cleanup checklist or cadence
