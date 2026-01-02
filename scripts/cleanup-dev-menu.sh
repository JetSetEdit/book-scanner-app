#!/bin/bash
# Cleanup Developer Menu - Remove Broken/Unused Items
# Backs up before removing

set -e

BACKUP_DIR="backups/dev-menu-cleanup-$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"

echo "🧹 Cleaning up developer menu..."
echo "📦 Backing up to: $BACKUP_DIR"
echo ""

# Backup agent-comparison page (broken - calls non-existent API)
if [ -d "app/dev/agent-comparison" ]; then
  echo "📦 Backing up app/dev/agent-comparison/..."
  cp -r app/dev/agent-comparison "$BACKUP_DIR/"
  echo "✅ Backed up agent-comparison page"
fi

# Backup navbar before editing
if [ -f "components/navbar.tsx" ]; then
  echo "📦 Backing up navbar.tsx..."
  cp components/navbar.tsx "$BACKUP_DIR/navbar.tsx.backup"
  echo "✅ Backed up navbar"
fi

# Create manifest
cat > "$BACKUP_DIR/manifest.json" << EOF
{
  "cleanup_date": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "backup_location": "$BACKUP_DIR",
  "removed_items": {
    "broken_link": "/test-cover (page doesn't exist)",
    "broken_tool": "/dev/agent-comparison (calls non-existent API /api/dev/scan-with-agent)"
  },
  "kept_items": {
    "dev_toggles": [
      "Show Audit Trail",
      "Show Refresh Button", 
      "Show Severity Score",
      "Show Admin Controls"
    ],
    "working_pages": [
      "/dev/check-covers"
    ]
  },
  "restore_instructions": "Copy files back from backup directory and restore navbar.tsx.backup"
}
EOF

echo ""
echo "✅ Backup complete!"
echo "📁 Location: $BACKUP_DIR"
echo ""
echo "📋 Next: Remove broken items from navbar.tsx manually"
echo "   - Remove /test-cover link"
echo "   - Remove /dev/agent-comparison link"
echo "   - Archive app/dev/agent-comparison/ directory"

