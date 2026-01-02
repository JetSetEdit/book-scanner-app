#!/bin/bash
# Aggressive Cleanup Script
# Removes/archives more unnecessary files for a truly clean codebase
# Creates comprehensive backups

set -e

BACKUP_DIR="backups/aggressive-cleanup-$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"

echo "🧹 Starting AGGRESSIVE cleanup..."
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

# 1. Archive more documentation files (keep only essential)
echo "📦 Step 1: Archiving additional documentation..."
ADDITIONAL_DOCS=(
  "AGENT_README.md"
  "CONTENT_WARNING_BUILDING_BLOCKS.md"
  "MULTI_MODEL_FLOW_DIAGRAM.md"
  "OPENAI_INTEGRATION_GUIDE.md"
  "OPENAI_USAGE_ANALYSIS.md"
  "SCORING_SYSTEM_IMPROVEMENTS.md"
  "TAXONOMY_DESIGN_PRINCIPLES.md"
  "TAXONOMY_MANIFESTO.md"
  "TAXONOMY_STRESS_TEST.md"
  "TAXONOMY_V2.5_ENHANCEMENTS.md"
  "CLEANUP_ANALYSIS.md"
)

for doc in "${ADDITIONAL_DOCS[@]}"; do
  if [ -f "$doc" ]; then
    echo "📦 Moving to archive: $doc"
    mkdir -p "docs/archive/additional-docs"
    mv "$doc" "docs/archive/additional-docs/" 2>/dev/null || backup_and_remove "$doc"
  fi
done

# 2. Archive old data migration scripts (one-off utilities)
echo ""
echo "📦 Step 2: Archiving old data migration scripts..."
DATA_SCRIPTS=(
  "scripts/data/analyze-icebreaker.ts"
  "scripts/data/fix-assumption-book.ts"
  "scripts/data/migrate-warnings-to-subcategories.ts"
  "scripts/data/purge-google-books-metadata.ts"
  "scripts/data/recheck-all-covers.ts"
  "scripts/data/refresh-books.ts"
  "scripts/data/rescan-book-now.ts"
  "scripts/data/rescan-book.ts"
  "scripts/data/rlhf-comparison.ts"
  "scripts/data/backfill-covers.ts"
)

for script in "${DATA_SCRIPTS[@]}"; do
  if [ -f "$script" ]; then
    echo "📦 Archiving: $script"
    mkdir -p "docs/archive/data-scripts"
    mv "$script" "docs/archive/data-scripts/" 2>/dev/null || backup_and_remove "$script"
  fi
done

# 3. Archive utility scripts (keep only essential ones)
echo ""
echo "📦 Step 3: Archiving utility scripts..."
UTILITY_SCRIPTS=(
  "scripts/utils/check-audit.ts"
  "scripts/utils/check-book.ts"
  "scripts/utils/check-covers.ts"
  "scripts/utils/check-db-stats.ts"
  "scripts/utils/check-description-lengths.ts"
  "scripts/utils/check-specific-warnings.ts"
  "scripts/utils/diagnose-missing-covers.ts"
  "scripts/utils/find-broken-scans.ts"
  "scripts/utils/find-duplicate-category-warnings.ts"
  "scripts/utils/generate-taxonomy-csv.ts"
  "scripts/utils/get-books-rankings.ts"
  "scripts/utils/inspect-books.ts"
  "scripts/utils/update-book-cover.ts"
  "scripts/utils/update-schema.ts"
  "scripts/utils/validate-url.ts"
)

for script in "${UTILITY_SCRIPTS[@]}"; do
  if [ -f "$script" ]; then
    echo "📦 Archiving: $script"
    mkdir -p "docs/archive/utility-scripts"
    mv "$script" "docs/archive/utility-scripts/" 2>/dev/null || backup_and_remove "$script"
  fi
done

# 4. Archive test scripts (keep test framework, remove one-offs)
echo ""
echo "📦 Step 4: Archiving test scripts..."
TEST_SCRIPTS=(
  "scripts/tests/batch-test-models.ts"
  "scripts/tests/batch-test-models-quick.ts"
  "scripts/tests/test-expanded-taxonomy.ts"
  "scripts/tests/test-image-validation.ts"
  "scripts/tests/test-models.ts"
  "scripts/tests/test-multi-model.ts"
  "scripts/tests/test-scan-timing.ts"
)

for script in "${TEST_SCRIPTS[@]}"; do
  if [ -f "$script" ]; then
    echo "📦 Archiving: $script"
    mkdir -p "docs/archive/test-scripts"
    mv "$script" "docs/archive/test-scripts/" 2>/dev/null || backup_and_remove "$script"
  fi
done

# 5. Archive old migration scripts (keep only active ones in supabase/migrations)
echo ""
echo "📦 Step 5: Archiving old migration scripts..."
if [ -d "scripts/migrations" ]; then
  echo "📦 Archiving entire scripts/migrations/ directory"
  mkdir -p "docs/archive/old-migrations"
  mv scripts/migrations/* "docs/archive/old-migrations/" 2>/dev/null || {
    backup_and_remove "scripts/migrations"
  }
fi

# 6. Remove Python script (agents removed)
if [ -f "scripts/generate-all-agents-report.py" ]; then
  echo "📦 Archiving: scripts/generate-all-agents-report.py"
  mkdir -p "docs/archive/old-scripts"
  mv "scripts/generate-all-agents-report.py" "docs/archive/old-scripts/" 2>/dev/null || backup_and_remove "scripts/generate-all-agents-report.py"
fi

# 7. Archive rescan script (one-off utility)
if [ -f "scripts/rescan-books-without-warnings.ts" ]; then
  echo "📦 Archiving: scripts/rescan-books-without-warnings.ts"
  mkdir -p "docs/archive/utility-scripts"
  mv "scripts/rescan-books-without-warnings.ts" "docs/archive/utility-scripts/" 2>/dev/null || backup_and_remove "scripts/rescan-books-without-warnings.ts"
fi

# 8. Optionally remove entire docs/archive (if user wants truly minimal)
# Uncomment if you want to remove the entire archive:
# echo ""
# echo "📦 Step 8: Archiving entire docs/archive/ (60+ files)..."
# if [ -d "docs/archive" ]; then
#   backup_and_remove "docs/archive"
# fi

# Create manifest
cat > "$BACKUP_DIR/manifest.json" << EOF
{
  "cleanup_date": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "backup_location": "$BACKUP_DIR",
  "removed_items": {
    "additional_docs": ${#ADDITIONAL_DOCS[@]},
    "data_scripts": ${#DATA_SCRIPTS[@]},
    "utility_scripts": ${#UTILITY_SCRIPTS[@]},
    "test_scripts": ${#TEST_SCRIPTS[@]},
    "old_migrations": "scripts/migrations/",
    "python_script": "generate-all-agents-report.py"
  },
  "restore_instructions": "Files backed up in this directory. To restore, copy files back to original locations."
}
EOF

echo ""
echo "✅ Aggressive cleanup complete!"
echo "📁 Backup location: $BACKUP_DIR"
echo "📋 Manifest: $BACKUP_DIR/manifest.json"
echo ""
echo "📊 Summary:"
echo "   - Archived ${#ADDITIONAL_DOCS[@]} additional docs"
echo "   - Archived ${#DATA_SCRIPTS[@]} data scripts"
echo "   - Archived ${#UTILITY_SCRIPTS[@]} utility scripts"
echo "   - Archived ${#TEST_SCRIPTS[@]} test scripts"
echo "   - Archived old migrations"
echo ""
echo "💡 Note: All files moved to docs/archive/ subdirectories"
echo "💡 Note: To remove docs/archive entirely, uncomment Step 8 in the script"

