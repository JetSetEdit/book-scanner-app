#!/bin/bash

# Prepare for deployment script
# Increments version and prepares for commit/push to production

set -e

echo "🚀 Preparing for deployment..."
echo ""

# Check if we're on main branch
BRANCH=$(git rev-parse --abbrev-ref HEAD)
if [ "$BRANCH" != "main" ]; then
  echo "⚠️  Warning: You're not on the main branch (current: $BRANCH)"
  echo "   Version will still be incremented, but make sure you're deploying to production."
  echo ""
fi

# Increment version
echo "📦 Incrementing version..."
npm run version:increment

# Stage version files
echo ""
echo "📝 Staging version files..."
git add lib/config/version.ts package.json

echo ""
echo "✅ Ready for deployment!"
echo ""
echo "💡 Next steps:"
echo "   1. Review the version changes: git diff --cached"
echo "   2. Commit your changes: git commit -m 'chore: bump version for deployment'"
echo "   3. Push to remote: git push origin main"
echo "   4. Vercel will automatically deploy"
echo ""

