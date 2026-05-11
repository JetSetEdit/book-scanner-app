#!/usr/bin/env bash
# Delete *local* branches already merged into origin/main (safe housekeeping).
# Remote branches are never touched. Default is dry-run.
#
# Before first use: run ./scripts/git-backup-bundle.sh and/or push a backup/* branch.
#
# Usage:
#   ./scripts/git-prune-local-merged-branches.sh              # list only
#   CONFIRM=1 ./scripts/git-prune-local-merged-branches.sh   # delete merged locals

set -euo pipefail

ROOT="$(git rev-parse --show-toplevel)"
cd "$ROOT"

git fetch origin --prune >/dev/null 2>&1 || true

MAIN="${MAIN_BRANCH:-origin/main}"
CURRENT="$(git rev-parse --abbrev-ref HEAD)"

protect_re='^(main|master|staging|preview|production|backup/|release/)'

echo "Using merge base: $MAIN"
echo "Current branch: $CURRENT"
echo ""

merged_locals=$(git branch --merged "$MAIN" --format='%(refname:short)' | grep -Ev "$protect_re" || true)

if [[ -z "${merged_locals// }" ]]; then
  echo "No local branches merged into $MAIN (excluding protected prefixes)."
  exit 0
fi

echo "Local branches merged into $MAIN (candidates):"
echo "$merged_locals" | sed 's/^/  - /'
echo ""

if [[ "${CONFIRM:-}" != "1" ]]; then
  echo "Dry-run only. To delete these local branches, run:"
  echo "  CONFIRM=1 ./scripts/git-prune-local-merged-branches.sh"
  exit 0
fi

while IFS= read -r b; do
  [[ -z "$b" ]] && continue
  if [[ "$b" == "$CURRENT" ]]; then
    echo "Skipping current branch: $b"
    continue
  fi
  echo "Deleting local branch: $b"
  git branch -d "$b"
done <<< "$merged_locals"

echo "Done."
