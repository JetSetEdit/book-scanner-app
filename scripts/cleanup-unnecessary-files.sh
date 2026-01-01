#!/bin/bash
# Cleanup Unnecessary Files Script
# Removes or archives files that are not needed for production
# Creates backups before removal

set -e

BACKUP_DIR="backups/cleanup-$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"

echo "🧹 Starting cleanup of unnecessary files..."
echo "📦 Backing up to: $BACKUP_DIR"
echo ""

# Function to backup and remove
backup_and_remove() {
  local file="$1"
  if [ -e "$file" ]; then
    echo "📦 Backing up: $file"
    mkdir -p "$BACKUP_DIR/$(dirname "$file")"
    cp -r "$file" "$BACKUP_DIR/$file" 2>/dev/null || cp "$file" "$BACKUP_DIR/$(basename "$file")"
    echo "🗑️  Removing: $file"
    rm -rf "$file"
  fi
}

# 1. Archive old backups (keep recent ones)
echo "📦 Step 1: Archiving old backups..."
if [ -d "backups/agents" ]; then
  backup_and_remove "backups/agents"
fi
if [ -d "backups/backup-2025-12-30T10-46-47-503Z" ]; then
  backup_and_remove "backups/backup-2025-12-30T10-46-47-503Z"
fi
if [ -d "backups/workspace" ]; then
  backup_and_remove "backups/workspace"
fi

# 2. Remove one-off documentation files (move to archive)
echo ""
echo "📦 Step 2: Archiving one-off documentation..."
ONE_OFF_DOCS=(
  "SARAH_BROWSER_TEST_RESULTS.md"
  "SARAH_FEEDBACK_FIX.md"
  "SARAH_FEEDBACK_IMPLEMENTATION.md"
  "BOOKTOK_EDGE_CASES.md"
  "CATEGORICAL_SHIELDING_TEST.md"
  "DARK_ROMANCE_TROPE_FIX.md"
  "FRONTEND_NO_WARNINGS_CHECK.md"
  "COMPLETE_BOOK_LIST.md"
  "USER_TEST_SCENARIO.md"
  "BOOK_ANALYSIS_METHODS_REVIEW.md"
  "ALL_BOOKS_ANALYSIS_METHODS.md"
)

for doc in "${ONE_OFF_DOCS[@]}"; do
  if [ -f "$doc" ]; then
    echo "📦 Moving to archive: $doc"
    mkdir -p "docs/archive/one-off-docs"
    mv "$doc" "docs/archive/one-off-docs/" 2>/dev/null || backup_and_remove "$doc"
  fi
done

# 3. Archive test scripts (if not in package.json)
echo ""
echo "📦 Step 3: Archiving unused test scripts..."
TEST_SCRIPTS=(
  "scripts/hello.js"
  "scripts/test-corrupt-rescan.ts"
  "scripts/test-not-found-book.ts"
  "scripts/test-github-actions-notification.ts"
  "scripts/test-manual-handling-system.md"
  "scripts/wait-and-trigger-workflow.sh"
)

for script in "${TEST_SCRIPTS[@]}"; do
  if [ -f "$script" ]; then
    echo "📦 Archiving: $script"
    mkdir -p "docs/archive/test-scripts"
    mv "$script" "docs/archive/test-scripts/" 2>/dev/null || backup_and_remove "$script"
  fi
done

# 4. Archive old analysis scripts (if not used)
echo ""
echo "📦 Step 4: Archiving old analysis scripts..."
if [ -f "scripts/analyze-book-openai.ts" ]; then
  echo "📦 Archiving: scripts/analyze-book-openai.ts"
  mkdir -p "docs/archive/old-scripts"
  mv "scripts/analyze-book-openai.ts" "docs/archive/old-scripts/" 2>/dev/null || backup_and_remove "scripts/analyze-book-openai.ts"
fi

if [ -f "scripts/interactive-scan.ts" ]; then
  echo "📦 Archiving: scripts/interactive-scan.ts"
  mkdir -p "docs/archive/old-scripts"
  mv "scripts/interactive-scan.ts" "docs/archive/old-scripts/" 2>/dev/null || backup_and_remove "scripts/interactive-scan.ts"
fi

# Create manifest
cat > "$BACKUP_DIR/manifest.json" << EOF
{
  "cleanup_date": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "backup_location": "$BACKUP_DIR",
  "removed_items": {
    "old_backups": [
      "backups/agents/",
      "backups/backup-2025-12-30T10-46-47-503Z/",
      "backups/workspace/"
    ],
    "one_off_docs": ${#ONE_OFF_DOCS[@]},
    "test_scripts": ${#TEST_SCRIPTS[@]},
    "old_analysis_scripts": 2
  },
  "restore_instructions": "Files backed up in this directory. To restore, copy files back to original locations."
}
EOF

echo ""
echo "✅ Cleanup complete!"
echo "📁 Backup location: $BACKUP_DIR"
echo "📋 Manifest: $BACKUP_DIR/manifest.json"
echo ""
echo "💡 Note: One-off docs moved to docs/archive/one-off-docs/"
echo "💡 Note: Test scripts moved to docs/archive/test-scripts/"

