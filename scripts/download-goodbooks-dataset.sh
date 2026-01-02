#!/bin/bash
# Download goodbooks-10k Dataset
# 
# This script attempts to download the goodbooks-10k dataset from Kaggle.
# Requires Kaggle API credentials.

set -e

DATASET_DIR="data/datasets/goodbooks-10k"
DATASET_FILE="$DATASET_DIR/books.csv"

echo "📥 Downloading goodbooks-10k Dataset"
echo "─────────────────────────────────────"
echo ""

# Check if already exists
if [ -f "$DATASET_FILE" ]; then
    echo "✅ Dataset already exists: $DATASET_FILE"
    echo "   File size: $(du -h "$DATASET_FILE" | cut -f1)"
    exit 0
fi

# Check for Kaggle CLI
if ! command -v kaggle &> /dev/null; then
    echo "❌ Kaggle CLI not found"
    echo ""
    echo "📋 To install Kaggle CLI:"
    echo "   1. Install: pip install kaggle"
    echo "   2. Set up credentials:"
    echo "      - Go to https://www.kaggle.com/account"
    echo "      - Create API token (download kaggle.json)"
    echo "      - Place in ~/.kaggle/kaggle.json"
    echo ""
    echo "📋 Or download manually:"
    echo "   1. Visit: https://www.kaggle.com/zygmunt/goodbooks-10k"
    echo "   2. Click 'Download' (requires Kaggle account)"
    echo "   3. Extract books.csv to: $DATASET_FILE"
    echo ""
    exit 1
fi

# Check for Kaggle credentials
if [ ! -f ~/.kaggle/kaggle.json ]; then
    echo "❌ Kaggle credentials not found"
    echo ""
    echo "📋 Set up credentials:"
    echo "   1. Go to https://www.kaggle.com/account"
    echo "   2. Create API token (download kaggle.json)"
    echo "   3. Place in ~/.kaggle/kaggle.json"
    echo "   4. Run: chmod 600 ~/.kaggle/kaggle.json"
    echo ""
    exit 1
fi

# Create directory
mkdir -p "$DATASET_DIR"

# Download dataset
echo "📥 Downloading from Kaggle..."
kaggle datasets download -d zygmunt/goodbooks-10k -p "$DATASET_DIR"

# Extract
echo "📦 Extracting..."
cd "$DATASET_DIR"
unzip -o goodbooks-10k.zip
cd - > /dev/null

# Check if books.csv exists
if [ -f "$DATASET_FILE" ]; then
    echo "✅ Dataset downloaded successfully!"
    echo "   Location: $DATASET_FILE"
    echo "   File size: $(du -h "$DATASET_FILE" | cut -f1)"
else
    echo "❌ books.csv not found after extraction"
    echo "   Check: $DATASET_DIR"
    exit 1
fi

