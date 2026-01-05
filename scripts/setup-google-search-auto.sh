#!/bin/bash

# Automated setup script - creates a new project automatically
# Usage: ./scripts/setup-google-search-auto.sh [project-id]

set -e

echo "🔧 Setting up Google Custom Search API for web search enrichment"
echo "================================================================"
echo ""

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    echo "❌ Error: gcloud CLI is not installed"
    echo "   Install it from: https://cloud.google.com/sdk/docs/install"
    exit 1
fi

echo "✅ gcloud CLI found"
echo ""

# Check if user is authenticated
if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | grep -q .; then
    echo "🔐 Authenticating with Google Cloud..."
    gcloud auth login
else
    echo "✅ Already authenticated with Google Cloud"
    ACTIVE_ACCOUNT=$(gcloud auth list --filter=status:ACTIVE --format="value(account)" | head -n 1)
    echo "   Account: $ACTIVE_ACCOUNT"
fi
echo ""

# Get or create project
if [ -z "$1" ]; then
    PROJECT_ID="subtext-book-scanner-$(date +%s)"
    echo "📁 Creating new project: $PROJECT_ID"
    if ! gcloud projects create "$PROJECT_ID" --name="Subtext Book Scanner" 2>/dev/null; then
        echo "⚠️  Project creation failed or project already exists, using existing project"
    else
        echo "✅ Project created: $PROJECT_ID"
    fi
else
    PROJECT_ID="$1"
    echo "📁 Using provided project: $PROJECT_ID"
    # Verify we have access
    if ! gcloud projects describe "$PROJECT_ID" &>/dev/null; then
        echo "❌ Error: You don't have access to project '$PROJECT_ID'"
        exit 1
    fi
fi

# Set the project
gcloud config set project "$PROJECT_ID"
echo "✅ Project set to: $PROJECT_ID"
echo ""

# Enable Custom Search API
echo "🔌 Enabling Custom Search API..."
if ! gcloud services enable customsearch.googleapis.com --project="$PROJECT_ID"; then
    echo "❌ Error: Failed to enable Custom Search API"
    echo "   You may need to enable it manually at:"
    echo "   https://console.cloud.google.com/apis/library/customsearch.googleapis.com?project=$PROJECT_ID"
    exit 1
fi
echo "✅ Custom Search API enabled"
echo ""

# Create API key (try alpha API first, fallback to manual instructions)
echo "🔑 Creating API key..."
API_KEY_NAME="subtext-search-api-key-$(date +%s)"

# Try to create API key via CLI (may not work in all regions)
if gcloud alpha services api-keys create \
    --display-name="$API_KEY_NAME" \
    --api-target=service=customsearch.googleapis.com \
    --project="$PROJECT_ID" &>/dev/null; then
    
    # Get the key value
    API_KEY_VALUE=$(gcloud alpha services api-keys get-key-string "$API_KEY_NAME" \
        --project="$PROJECT_ID" \
        --format="value(keyString)" 2>/dev/null || echo "")
    
    if [ ! -z "$API_KEY_VALUE" ]; then
        echo "✅ API key created: $API_KEY_NAME"
        echo ""
        echo "📝 API Key: $API_KEY_VALUE"
        echo ""
    else
        echo "⚠️  API key created but couldn't retrieve value"
        API_KEY_VALUE=""
    fi
else
    echo "⚠️  Could not create API key via CLI (may need manual creation)"
    API_KEY_VALUE=""
fi

if [ -z "$API_KEY_VALUE" ]; then
    echo "📝 Please create API key manually:"
    echo "   1. Go to: https://console.cloud.google.com/apis/credentials?project=$PROJECT_ID"
    echo "   2. Click 'Create Credentials' > 'API Key'"
    echo "   3. Restrict it to 'Custom Search API' (optional but recommended)"
    echo "   4. Copy the key and add it to .env.local"
    echo ""
    read -p "Enter your API key (or press Enter to skip): " API_KEY_VALUE
fi

# Instructions for Search Engine ID
echo "🌐 Search Engine ID Setup"
echo "================================================================"
echo "The Search Engine ID (CX) must be created manually via the web interface:"
echo ""
echo "1. Go to: https://programmablesearchengine.google.com/"
echo "2. Click 'Add' to create a new search engine"
echo "3. In 'Sites to search', select 'Search the entire web'"
echo "   (Turn ON 'Search the entire web' in settings)"
echo "   OR restrict to: goodreads.com, thestorygraph.com, reddit.com"
echo "4. Click 'Create'"
echo "5. Go to 'Setup' > 'Basics' and copy the 'Search engine ID'"
echo ""

read -p "Enter Search Engine ID (CX) if you have it, or press Enter to skip: " SEARCH_ENGINE_ID
echo ""

# Update .env.local
ENV_FILE=".env.local"
if [ ! -f "$ENV_FILE" ]; then
    echo "📄 Creating $ENV_FILE from env.example..."
    cp env.example "$ENV_FILE"
fi

echo "📝 Updating $ENV_FILE with API credentials..."
echo ""

# Update API key
if [ ! -z "$API_KEY_VALUE" ]; then
    if grep -q "GOOGLE_SEARCH_API_KEY=" "$ENV_FILE"; then
        # Update existing
        if [[ "$OSTYPE" == "darwin"* ]]; then
            sed -i '' "s|GOOGLE_SEARCH_API_KEY=.*|GOOGLE_SEARCH_API_KEY=$API_KEY_VALUE|" "$ENV_FILE"
        else
            sed -i "s|GOOGLE_SEARCH_API_KEY=.*|GOOGLE_SEARCH_API_KEY=$API_KEY_VALUE|" "$ENV_FILE"
        fi
        echo "✅ Updated GOOGLE_SEARCH_API_KEY in $ENV_FILE"
    else
        # Add new
        if ! grep -q "# GOOGLE SEARCH API" "$ENV_FILE"; then
            echo "" >> "$ENV_FILE"
            echo "# ============================================" >> "$ENV_FILE"
            echo "# GOOGLE SEARCH API CONFIGURATION" >> "$ENV_FILE"
            echo "# ============================================" >> "$ENV_FILE"
        fi
        echo "GOOGLE_SEARCH_API_KEY=$API_KEY_VALUE" >> "$ENV_FILE"
        echo "✅ Added GOOGLE_SEARCH_API_KEY to $ENV_FILE"
    fi
else
    echo "⚠️  Skipping API key update (create manually and add to $ENV_FILE)"
fi

# Update Search Engine ID
if [ ! -z "$SEARCH_ENGINE_ID" ]; then
    if grep -q "GOOGLE_SEARCH_ENGINE_ID=" "$ENV_FILE"; then
        # Update existing
        if [[ "$OSTYPE" == "darwin"* ]]; then
            sed -i '' "s|GOOGLE_SEARCH_ENGINE_ID=.*|GOOGLE_SEARCH_ENGINE_ID=$SEARCH_ENGINE_ID|" "$ENV_FILE"
        else
            sed -i "s|GOOGLE_SEARCH_ENGINE_ID=.*|GOOGLE_SEARCH_ENGINE_ID=$SEARCH_ENGINE_ID|" "$ENV_FILE"
        fi
        echo "✅ Updated GOOGLE_SEARCH_ENGINE_ID in $ENV_FILE"
    else
        # Add new
        if ! grep -q "GOOGLE_SEARCH_ENGINE_ID=" "$ENV_FILE"; then
            echo "GOOGLE_SEARCH_ENGINE_ID=$SEARCH_ENGINE_ID" >> "$ENV_FILE"
            echo "✅ Added GOOGLE_SEARCH_ENGINE_ID to $ENV_FILE"
        fi
    fi
else
    echo "⚠️  Search Engine ID not provided"
    echo "   Add it manually to $ENV_FILE:"
    echo "   GOOGLE_SEARCH_ENGINE_ID=your_search_engine_id"
fi

echo ""
echo "================================================================"
echo "✅ Setup Complete!"
echo "================================================================"
echo ""
echo "Project ID: $PROJECT_ID"
if [ ! -z "$API_KEY_VALUE" ]; then
    echo "API Key: ✅ Configured"
else
    echo "API Key: ⚠️  Needs manual setup"
fi
if [ ! -z "$SEARCH_ENGINE_ID" ]; then
    echo "Search Engine ID: ✅ Configured"
else
    echo "Search Engine ID: ⚠️  Needs manual setup"
fi
echo ""
echo "Next steps:"
if [ -z "$SEARCH_ENGINE_ID" ]; then
    echo "1. Create Search Engine at: https://programmablesearchengine.google.com/"
    echo "   Then add GOOGLE_SEARCH_ENGINE_ID to $ENV_FILE"
    echo ""
fi
echo "2. Test the setup:"
echo "   DOTENV_CONFIG_PATH=.env.local npx tsx scripts/test-enrichment-happy-place.ts"
echo ""

