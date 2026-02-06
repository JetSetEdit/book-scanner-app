# Design: Branch merge and OpenSpec cleanup workflow

## Context

- **Git**: Feature branches (e.g. `feature/sss-rating`, `lite`, `preview`) exist alongside `main`. Project convention (project.md): feature branches off main, conventional commits, merges via Vercel preview deployments.
- **OpenSpec**: Completed changes remain in `openspec/changes/<id>/` until manually archived. AGENTS.md Stage 3: after deployment, move change to `changes/archive/YYYY-MM-DD-[name]/`, update specs, run `openspec archive <change-id>` where applicable, validate.
- **Current state**: Many branches; many changes with "✓ Complete"; only two changes in `archive/`. No single checklist for "merge everything that’s ready" or "archive everything that’s deployed."

## Goals / Non-Goals

- **Goals**: One documented workflow for (1) merging feature branches to main, (2) archiving completed OpenSpec changes after deployment, (3) optional periodic cleanup (identify branches to merge or retire, changes to archive). Keep it simple and human-driven.
- **Non-Goals**: Fully automated merge/archive; changing Git or OpenSpec tooling; enforcing branch naming beyond existing conventions.

## Decisions

### 1. Merge criteria for feature branches

- **Decision**: A feature branch is ready to merge to `main` when: (a) its OpenSpec change (if any) is complete (all tasks done), (b) tests and build pass, (c) any deployment preview has been verified. The default order is: merge the branch, then archive the corresponding OpenSpec change (if any) in a separate PR or commit.
- **Rationale**: Aligns with "approval gate" and "deploy then archive" in AGENTS.md; keeps merge and archive as two clear steps.

### 2. Archive timing

- **Decision**: Archive an OpenSpec change when the work is deployed to the target environment (e.g. main/production). Use `openspec archive <change-id> [--yes]` (with `--skip-specs` only for tooling-only changes). Move the change directory to `archive/YYYY-MM-DD-<change-id>/` and update `specs/` if the change introduced or modified capabilities.
- **Rationale**: Matches AGENTS.md Stage 3; one archive per deployment of that change.

### 3. Cleanup cadence

- **Decision**: "Cleanup" is defined as (1) listing branches that are merged or obsolete and can be deleted locally/remotely, and (2) listing completed OpenSpec changes that are deployed but not yet archived, then performing archive. No required cadence; the spec SHALL require a documented checklist or cadence (e.g. "before each release" or "monthly") so the team can decide.
- **Rationale**: Keeps the spec flexible; avoids mandating automation while still requiring that merge and archive are deliberate and documented.

### 4. Conflict resolution

- **Decision**: When merging a branch into main, resolve conflicts in favour of the branch’s implementation for feature code; preserve main-only fixes (e.g. hotfixes) where they do not conflict. After merge, run full test suite and smoke checks.
- **Rationale**: Matches existing integrate-preview-and-lite-into-production approach; reduces ambiguity.

## Risks / Trade-offs

- **Many branches at once**: Merging in one go can be large. Mitigation: merge in small batches by feature or change; document the order in the workflow.
- **Archive drift**: Forgetting to archive leaves `changes/` noisy. Mitigation: include "list completed changes and archive" in the cleanup checklist.

## Migration Plan

- N/A (documentation/spec only).

## Open Questions

- None for the proposal scope.
