#!/bin/bash
# Script to check production environment variables in Vercel

echo "🔍 Checking Production Environment Variables in Vercel..."
echo "============================================================"
echo ""

# Required variables
REQUIRED_VARS=(
  "NEXT_PUBLIC_SUPABASE_URL"
  "NEXT_PUBLIC_SUPABASE_ANON_KEY"
  "SUPABASE_SERVICE_ROLE_KEY"
  "OPENAI_API_KEY"
  "GEMINI_API_KEY"
)

# Optional but recommended
OPTIONAL_VARS=(
  "SCAN_RATE_LIMIT"
  "GEMINI_DAILY_QUOTA_LIMIT"
  "GEMINI_QUOTA_WARNING_THRESHOLD"
  "GOOGLE_SEARCH_API_KEY"
  "GOOGLE_SEARCH_ENGINE_ID"
)

echo "📋 Checking Required Variables..."
echo ""

# Get production env vars
PROD_ENV=$(vercel env ls --environment production 2>&1)

for var in "${REQUIRED_VARS[@]}"; do
  if echo "$PROD_ENV" | grep -q "^$var"; then
    echo "✅ $var - Set"
  else
    echo "❌ $var - MISSING"
  fi
done

echo ""
echo "📋 Checking Optional Variables..."
echo ""

for var in "${OPTIONAL_VARS[@]}"; do
  if echo "$PROD_ENV" | grep -q "^$var"; then
    echo "✅ $var - Set"
  else
    echo "⚠️  $var - Not set (optional)"
  fi
done

echo ""
echo "============================================================"
echo "💡 To view all variables: vercel env ls --environment production"
echo "💡 To add a variable: vercel env add <VAR_NAME> production"
