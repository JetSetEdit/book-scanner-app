#!/usr/bin/env bash
# Create a single-file backup of every ref in this repo (branches + tags).
# Does not include uncommitted working tree files; see script output for WIP notes.
set -euo pipefail

ROOT="$(git rev-parse --show-toplevel)"
cd "$ROOT"

STAMP="$(date +%Y%m%d-%H%M%S)"
DEST_DIR="${BACKUP_DIR:-"$ROOT/../book-scanner-backups"}"
mkdir -p "$DEST_DIR"

BUNDLE="$DEST_DIR/book-scanner-all-refs-${STAMP}.bundle"

git bundle create "$BUNDLE" --all
git bundle verify "$BUNDLE" >/dev/null

echo ""
echo "Backup written: $BUNDLE"
echo "Size: $(du -h "$BUNDLE" | cut -f1)"
echo ""
echo "Restore (full mirror, all refs):"
echo "  git clone --mirror \"$BUNDLE\" book-scanner-restored.git"
echo "  cd book-scanner-restored.git && git worktree add ../book-scanner-checkout HEAD"
echo ""
echo "Restore (single checkout from bundle default HEAD):"
echo "  git clone \"$BUNDLE\" book-scanner-restored"
echo ""
echo "Uncommitted / untracked files are NOT in the bundle. To snapshot WIP:"
echo "  git stash push -u -m \"wip before restore $STAMP\""
echo "  # or copy the repo folder, or commit to a backup/* branch"
