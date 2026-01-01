#!/bin/bash
# Backup script before removing unused columns and code
# Creates backups of schema and code that will be removed

set -e

BACKUP_DIR="backups/schema/$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"

echo "📦 Creating backup in $BACKUP_DIR..."

# Backup book-service.ts (will be removed)
if [ -f "lib/book-service.ts" ]; then
  cp "lib/book-service.ts" "$BACKUP_DIR/book-service.ts.backup"
  echo "✅ Backed up lib/book-service.ts"
fi

# Backup schema SQL for classification_rating
cat > "$BACKUP_DIR/classification_rating_column.sql" << 'EOF'
-- Backup of classification_rating column definition
-- Restore with: scripts/restore-removed-columns.sql

ALTER TABLE public.books 
ADD COLUMN IF NOT EXISTS classification_rating TEXT 
  CHECK (classification_rating IS NULL OR (classification_rating = ANY (ARRAY['G'::text, 'PG'::text, 'M'::text, 'MA15+'::text, 'R18+'::text, 'X18+'::text])));

COMMENT ON COLUMN public.books.classification_rating IS 
'Australian Classification Board rating (G, PG, M, MA15+, R18+, X18+)';
EOF

echo "✅ Backed up classification_rating column definition"

# Create manifest
cat > "$BACKUP_DIR/manifest.json" << EOF
{
  "backup_date": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "removed_items": {
    "files": [
      "lib/book-service.ts"
    ],
    "database_columns": [
      "books.classification_rating"
    ]
  },
  "restore_instructions": "See scripts/restore-removed-columns.sql for database restore. Files backed up in this directory."
}
EOF

echo "✅ Created backup manifest"
echo ""
echo "📁 Backup complete: $BACKUP_DIR"
echo "📋 Manifest: $BACKUP_DIR/manifest.json"

