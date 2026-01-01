#!/bin/bash
# Backup RLHF Section Before Removal
# Creates a complete backup of all RLHF-related files

set -e

BACKUP_DIR="backups/rlhf-backup-$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"

echo "📦 Backing up RLHF section..."
echo "📁 Backup location: $BACKUP_DIR"
echo ""

# Backup app/rlhf directory
if [ -d "app/rlhf" ]; then
  echo "📦 Backing up app/rlhf/..."
  cp -r app/rlhf "$BACKUP_DIR/app-rlhf"
  echo "✅ Backed up app/rlhf/"
fi

# Backup app/api/rlhf directory
if [ -d "app/api/rlhf" ]; then
  echo "📦 Backing up app/api/rlhf/..."
  cp -r app/api/rlhf "$BACKUP_DIR/app-api-rlhf"
  echo "✅ Backed up app/api/rlhf/"
fi

# Backup migration file
if [ -f "supabase/migrations/20251210_create_rlhf_comparisons.sql" ]; then
  echo "📦 Backing up RLHF migration..."
  cp supabase/migrations/20251210_create_rlhf_comparisons.sql "$BACKUP_DIR/"
  echo "✅ Backed up migration"
fi

# Backup navbar (to restore RLHF link)
if [ -f "components/navbar.tsx" ]; then
  echo "📦 Backing up navbar.tsx..."
  cp components/navbar.tsx "$BACKUP_DIR/navbar.tsx.backup"
  echo "✅ Backed up navbar"
fi

# Create database schema backup for RLHF tables
cat > "$BACKUP_DIR/rlhf-tables-schema.sql" << 'EOF'
-- RLHF Tables Schema Backup
-- These tables can be restored if needed in the future
-- Tables: rlhf_comparisons, rlhf_category_comparisons, rlhf_warning_examples, rlhf_reviews

-- Note: Tables are kept in database but not used by application
-- To fully restore RLHF:
-- 1. Restore app/rlhf/ and app/api/rlhf/ directories
-- 2. Restore navbar.tsx
-- 3. Tables already exist in database (no migration needed)
EOF

# Create manifest
cat > "$BACKUP_DIR/manifest.json" << EOF
{
  "backup_date": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "backup_location": "$BACKUP_DIR",
  "backed_up_items": {
    "app_rlhf_directory": "app/rlhf/",
    "app_api_rlhf_directory": "app/api/rlhf/",
    "migration_file": "supabase/migrations/20251210_create_rlhf_comparisons.sql",
    "navbar_component": "components/navbar.tsx"
  },
  "database_tables": [
    "rlhf_comparisons",
    "rlhf_category_comparisons",
    "rlhf_warning_examples",
    "rlhf_reviews"
  ],
  "restore_instructions": "Copy files back from backup directory. Database tables remain in database but unused."
}
EOF

echo ""
echo "✅ RLHF backup complete!"
echo "📁 Location: $BACKUP_DIR"
echo "📋 Manifest: $BACKUP_DIR/manifest.json"
echo ""
echo "💡 Note: Database tables (rlhf_*) are kept but will be unused"
echo "💡 Note: To fully restore, copy files back and uncomment navbar link"

