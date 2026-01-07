# Intelligent Training Data Collector

## Overview

The Intelligent Training Data Collector is an iterative system that:
1. Scans books from the GoodBooks dataset
2. Investigates why some books return no warnings
3. Validates findings with web search
4. Builds training data while tracking token usage
5. Stays within a specified budget

## Usage

```bash
# Use NODE_OPTIONS to ensure env vars load before imports
NODE_OPTIONS="--require dotenv/config" DOTENV_CONFIG_PATH=.env.local \
  npx tsx scripts/intelligent-training-collector.ts --budget 5 --max-books 10
```

### Options

- `--budget N`: Maximum token cost in USD (default: 5.0)
- `--max-books N`: Maximum number of books to scan (default: 20)

## How It Works

### 1. Book Scanning
- Randomly selects ISBNs from GoodBooks-10k dataset
- Fetches book metadata from Google Books API
- Scans book through `processIsbnScan` to generate warnings
- Tracks estimated token usage per scan

### 2. Investigation Phase
When a book returns **no warnings**, the system:
- Performs web search for content warnings
- Analyzes book description for warning keywords
- Determines if warnings should exist
- Records investigation results

### 3. Training Data Collection
- Saves all scanned books as training examples
- Includes investigation metadata
- Deduplicates by ISBN
- Combines with existing training data

### 4. Budget Management
- Estimates cost before each scan
- Stops when approaching budget limit (95%)
- Tracks input/output tokens
- Reports total cost at end

## Token Cost Estimation

Current estimates (gpt-4o):
- Input: $2.50 per 1M tokens
- Output: $10.00 per 1M tokens
- Per book: ~$0.01-0.02 (2000 input + 500 output tokens)

## Output Files

- **Training Data**: `data/training/intelligent_training_data.json`
- **Combined Data**: `data/training/combined_training_data.json` (after running combine script)

## Next Steps

After collecting data:
1. Combine all training sources:
   ```bash
   npx tsx scripts/combine-training-data.ts
   ```

2. Retrain model:
   ```bash
   python3 scripts/train-classifier.py \
     data/training/combined_training_data.json \
     data/models/content_warning_classifier.pkl
   ```

## Current Status

- ✅ Script created and functional
- ⚠️  Handling duplicate books in database (needs improvement)
- ⚠️  Investigation logic needs refinement
- ⚠️  Token tracking is estimated (not exact)

## Improvements Needed

1. **Better duplicate handling**: Use existing books instead of failing
2. **Accurate token tracking**: Use OpenAI API response headers
3. **Enhanced investigation**: Use AI to validate if warnings should exist
4. **Retry logic**: Handle rate limits and API errors
5. **Progress persistence**: Resume from where it left off


