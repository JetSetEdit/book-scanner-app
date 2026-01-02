#!/bin/bash
# Restore RLHF Section
# Restores all RLHF files from backup

set -e

if [ -z "$1" ]; then
  echo "Usage: $0 <backup-directory>"
  echo "Example: $0 backups/rlhf-backup-20260101_205033"
  exit 1
fi

BACKUP_DIR="$1"

if [ ! -d "$BACKUP_DIR" ]; then
  echo "❌ Backup directory not found: $BACKUP_DIR"
  exit 1
fi

echo "🔄 Restoring RLHF section from: $BACKUP_DIR"
echo ""

# Restore app/rlhf
if [ -d "$BACKUP_DIR/app-rlhf" ]; then
  echo "📦 Restoring app/rlhf/..."
  cp -r "$BACKUP_DIR/app-rlhf" app/rlhf
  echo "✅ Restored app/rlhf/"
fi

# Restore app/api/rlhf
if [ -d "$BACKUP_DIR/app-api-rlhf" ]; then
  echo "📦 Restoring app/api/rlhf/..."
  cp -r "$BACKUP_DIR/app-api-rlhf" app/api/rlhf
  echo "✅ Restored app/api/rlhf/"
fi

# Restore navbar
if [ -f "$BACKUP_DIR/navbar.tsx.backup" ]; then
  echo "📦 Restoring navbar.tsx..."
  cp "$BACKUP_DIR/navbar.tsx.backup" components/navbar.tsx
  echo "✅ Restored navbar.tsx"
fi

# Restore migration (if needed)
if [ -f "$BACKUP_DIR/20251210_create_rlhf_comparisons.sql" ]; then
  echo "📦 Migration file available in backup (already applied to database)"
  echo "   File: $BACKUP_DIR/20251210_create_rlhf_comparisons.sql"
fi

echo ""
echo "✅ RLHF restoration complete!"
echo ""
echo "📋 Next steps:"
echo "   1. Database tables (rlhf_*) already exist in database"
echo "   2. Review components/navbar.tsx to ensure RLHF link is restored"
echo "   3. Test the /rlhf route"
echo "   4. Commit changes if everything works"

