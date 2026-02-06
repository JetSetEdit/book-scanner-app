# Change: Document branch merge and OpenSpec cleanup workflow

## Why

The repo has many feature branches and many OpenSpec changes marked complete, but there is no single documented workflow for when and how to merge branches into main or how to keep OpenSpec in sync (archive completed changes, update specs). Without a clear process, completed work stays on branches and completed changes stay in `changes/` instead of being merged and archived, leading to drift and confusion about what is "released" vs in progress.

## What Changes

- Add a new capability **release-workflow** that defines:
  - When and how to merge feature branches into `main` (criteria, order, conflict resolution, verification).
  - When and how to archive completed OpenSpec changes after deployment (move to `changes/archive/YYYY-MM-DD-<id>/`, update `specs/` if capabilities changed).
  - Optional periodic cleanup: a checklist or cadence to identify branches to merge or retire and changes to archive.
- Documentation and spec only; no automation or new tooling required unless explicitly added in a follow-up.

## Impact

- **Affected specs**: `release-workflow` (new capability).
- **Affected code**: None in this change. Optional follow-up could add a small script or GitHub Action to list branches and completed changes.
