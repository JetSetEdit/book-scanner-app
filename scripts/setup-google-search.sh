#!/bin/bash

# Setup Google Custom Search API using Google Cloud CLI
# This script automates the setup process for web search enrichment

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
echo "📁 Setting up Google Cloud project..."
read -p "Enter project ID (or press Enter to create new): " PROJECT_ID

if [ -z "$PROJECT_ID" ]; then
    PROJECT_ID="subtext-book-scanner-$(date +%s)"
    echo "Creating new project: $PROJECT_ID"
    if gcloud projects create "$PROJECT_ID" --name="Subtext Book Scanner" 2>&1 | grep -q "PERMISSION_DENIED\|ERROR"; then
        echo "❌ Error: Cannot create project. You may need to:"
        echo "   1. Use an existing project you have access to"
        echo "   2. Or create a project via: https://console.cloud.google.com/"
        exit 1
    fi
    echo "✅ Project created: $PROJECT_ID"
else
    echo "Using existing project: $PROJECT_ID"
    # Verify we have access to this project
    if ! gcloud projects describe "$PROJECT_ID" &>/dev/null; then
        echo "❌ Error: You don't have access to project '$PROJECT_ID'"
        echo "   Please use a different project or create a new one at:"
        echo "   https://console.cloud.google.com/"
        exit 1
    fi
    gcloud config set project "$PROJECT_ID"
fi

# Set the project
gcloud config set project "$PROJECT_ID"
echo "✅ Project set to: $PROJECT_ID"
echo ""

# Enable Custom Search API
echo "🔌 Enabling Custom Search API..."
gcloud services enable customsearch.googleapis.com --project="$PROJECT_ID"
echo "✅ Custom Search API enabled"
echo ""

# Create API key
echo "🔑 Creating API key..."
API_KEY_NAME="subtext-search-api-key-$(date +%s)"
API_KEY_OUTPUT=$(gcloud alpha services api-keys create \
    --display-name="$API_KEY_NAME" \
    --api-target=service=customsearch.googleapis.com \
    --project="$PROJECT_ID" \
    --format="value(name)" 2>&1)

if [ $? -eq 0 ]; then
    # Get the key value
    API_KEY_VALUE=$(gcloud alpha services api-keys get-key-string "$API_KEY_NAME" \
        --project="$PROJECT_ID" \
        --format="value(keyString)" 2>&1)
    
    if [ $? -eq 0 ] && [ ! -z "$API_KEY_VALUE" ]; then
        echo "✅ API key created: $API_KEY_NAME"
        echo ""
        echo "📝 API Key: $API_KEY_VALUE"
        echo ""
    else
        echo "⚠️  API key created but couldn't retrieve value"
        echo "   You'll need to get it manually from:"
        echo "   https://console.cloud.google.com/apis/credentials?project=$PROJECT_ID"
        API_KEY_VALUE=""
    fi
else
    echo "⚠️  Could not create API key via CLI (may need manual creation)"
    echo "   Create it manually at:"
    echo "   https://console.cloud.google.com/apis/credentials?project=$PROJECT_ID"
    echo "   Service: Custom Search API"
    API_KEY_VALUE=""
fi
echo ""

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
            # macOS
            sed -i '' "s|GOOGLE_SEARCH_API_KEY=.*|GOOGLE_SEARCH_API_KEY=$API_KEY_VALUE|" "$ENV_FILE"
        else
            # Linux
            sed -i "s|GOOGLE_SEARCH_API_KEY=.*|GOOGLE_SEARCH_API_KEY=$API_KEY_VALUE|" "$ENV_FILE"
        fi
        echo "✅ Updated GOOGLE_SEARCH_API_KEY in $ENV_FILE"
    else
        # Add new
        echo "" >> "$ENV_FILE"
        echo "# Google Custom Search API" >> "$ENV_FILE"
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
            # macOS
            sed -i '' "s|GOOGLE_SEARCH_ENGINE_ID=.*|GOOGLE_SEARCH_ENGINE_ID=$SEARCH_ENGINE_ID|" "$ENV_FILE"
        else
            # Linux
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
echo "Next steps:"
echo "1. If you didn't provide the Search Engine ID, create it at:"
echo "   https://programmablesearchengine.google.com/"
echo "   Then add GOOGLE_SEARCH_ENGINE_ID to $ENV_FILE"
echo ""
echo "2. Test the setup:"
echo "   DOTENV_CONFIG_PATH=.env.local npx tsx scripts/test-enrichment-happy-place.ts"
echo ""
echo "3. Free tier: 100 searches/day"
echo "   Monitor usage: https://console.cloud.google.com/apis/api/customsearch.googleapis.com/quotas?project=$PROJECT_ID"
echo ""

