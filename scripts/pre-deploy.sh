#!/bin/bash

# Pre-deploy script for Vercel
# Increments version before deployment

set -e

echo "🚀 Pre-deploy: Incrementing version..."

# Run the version increment script
npx tsx scripts/increment-version.ts

echo "✅ Version incremented. Ready for deployment!"

