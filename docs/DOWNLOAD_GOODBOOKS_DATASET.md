# Downloading goodbooks-10k Dataset

## Quick Start

### Option 1: Using Kaggle CLI (Recommended)

```bash
# 1. Install Kaggle CLI
pip install kaggle

# 2. Set up credentials
#    - Go to https://www.kaggle.com/account
#    - Click "Create New API Token"
#    - Download kaggle.json
#    - Place in ~/.kaggle/kaggle.json
#    - Run: chmod 600 ~/.kaggle/kaggle.json

# 3. Download dataset
./scripts/download-goodbooks-dataset.sh
```

### Option 2: Manual Download

1. **Visit Kaggle**: https://www.kaggle.com/zygmunt/goodbooks-10k
2. **Sign in** (requires free Kaggle account)
3. **Download** the dataset (click "Download" button)
4. **Extract** the zip file
5. **Copy** `books.csv` to: `data/datasets/goodbooks-10k/books.csv`

```bash
# Create directory
mkdir -p data/datasets/goodbooks-10k

# Extract books.csv from downloaded zip to the directory above
# Then verify:
ls -lh data/datasets/goodbooks-10k/books.csv
```

## Verify Download

```bash
# Check file exists and has data
ls -lh data/datasets/goodbooks-10k/books.csv

# Should show ~2-3MB file with ~10,000 rows
head -5 data/datasets/goodbooks-10k/books.csv
```

## License

- **License**: CC BY-SA 4.0
- **Attribution Required**: Yes
- **Commercial Use**: Allowed
- **Source**: https://www.kaggle.com/zygmunt/goodbooks-10k

## What's Included

- 10,000 books with metadata
- ISBNs, titles, authors
- Ratings data
- **NO descriptions** (we'll fetch from APIs)

## Next Steps

Once downloaded, run:

```bash
# Scan random batches and retrain model
npx tsx scripts/batch-scan-and-retrain.ts 20 5
# This will scan 5 batches of 20 books each (100 total)
```


