# Release & archive workflow

Canonical workflow for merging feature branches to main and keeping OpenSpec in sync. Spec: OpenSpec capability **release-workflow** (`openspec/changes/document-branch-merge-and-openspec-cleanup-workflow` or promoted spec).

## Merge feature branches to main

- **When**: OpenSpec change (if any) is complete, build and tests pass, preview verified.
- **How**: Merge branch into `main`; resolve conflicts in favour of the branch for feature code, preserve main-only fixes; run test suite and smoke checks after merge.
- **Then**: Archive the corresponding OpenSpec change after deployment (see below).

## Archive completed OpenSpec changes

- **When**: Work for the change is deployed to target (e.g. main/production).
- **How**:
  - Move `openspec/changes/<change-id>/` → `openspec/changes/archive/YYYY-MM-DD-<change-id>/`.
  - If the change added or modified a capability, update `openspec/specs/` (e.g. run `openspec archive <change-id>`; use `--skip-specs --yes` for tooling-only).
  - Run `openspec validate --strict --no-interactive`.

## Cleanup checklist (periodic or before release)

1. **OpenSpec**
   - Run `openspec list` and identify changes marked complete that are already deployed.
   - For each: run `openspec archive <change-id> [--skip-specs --yes]` as appropriate; move directory to `archive/YYYY-MM-DD-<change-id>/` if not done by tooling; update specs if needed; run `openspec validate --strict --no-interactive`.

2. **Branches**
   - List local and remote branches: `git branch -a`.
   - Identify branches already merged into `main`: `git branch --merged main` (or compare with origin/main).
   - Optionally delete merged or obsolete branches locally: `git branch -d <branch>`; remotely: `git push origin --delete <branch>` (or document them as retired).

Run this checklist on a cadence that fits the team (e.g. before each release or monthly).
