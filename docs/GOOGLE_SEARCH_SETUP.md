# Google Custom Search API Setup

This guide explains how to set up Google Custom Search API for web search enrichment in Subtext.

## Why Google Custom Search?

When book descriptions are sanitized (marketing copy), they often don't mention sensitive themes like grief, anxiety, or panic attacks. Web search enrichment finds these themes from community sources (Goodreads, The StoryGraph, etc.) where readers discuss content warnings.

## Quick Setup (Automated)

### Option 1: Using Google Cloud CLI (Recommended)

```bash
# Run the automated setup script
./scripts/setup-google-search.sh
```

The script will:
1. Check if `gcloud` CLI is installed
2. Authenticate with Google Cloud (if needed)
3. Create or select a project
4. Enable Custom Search API
5. Create an API key
6. Update `.env.local` with credentials
7. Guide you through creating the Search Engine ID

**Prerequisites:**
- Install [Google Cloud SDK](https://cloud.google.com/sdk/docs/install)
- Run `gcloud auth login` if not already authenticated

### Option 2: Manual Setup

Follow the manual steps below if you prefer to set it up yourself.

## Manual Setup Steps

### 1. Get Google Cloud API Key

#### Using Google Cloud CLI:

```bash
# Install gcloud CLI (if not installed)
# macOS: brew install google-cloud-sdk
# Or download from: https://cloud.google.com/sdk/docs/install

# Authenticate
gcloud auth login

# Create or select a project
gcloud projects create subtext-book-scanner --name="Subtext Book Scanner"
gcloud config set project subtext-book-scanner

# Enable Custom Search API
gcloud services enable customsearch.googleapis.com

# Create API key (requires alpha API)
gcloud alpha services api-keys create \
  --display-name="Subtext Search API Key" \
  --api-target=service=customsearch.googleapis.com

# Get the key value
gcloud alpha services api-keys list --format="table(name,displayName)"
# Then get the key string:
gcloud alpha services api-keys get-key-string [KEY_NAME]
```

#### Using Web Console:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project (or select an existing one)
3. Enable the "Custom Search API":
   - Navigate to "APIs & Services" > "Library"
   - Search for "Custom Search API"
   - Click "Enable"
4. Create an API Key:
   - Navigate to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "API Key"
   - Copy the API key

### 2. Create Custom Search Engine

**Note:** This step must be done via the web interface (no CLI available).

1. Go to [Programmable Search Engine](https://programmablesearchengine.google.com/)
2. Click "Add" to create a new search engine
3. **Important Settings:**
   - **Sites to search:** Select "Search the entire web" (turn ON "Search the entire web" in settings)
   - OR restrict to specific sites: `goodreads.com`, `thestorygraph.com`, `reddit.com`, `librarything.com`
4. Click "Create"
5. Go to "Setup" > "Basics"
6. Copy the "Search engine ID" (CX)

### 3. Configure Environment Variables

Add these to your `.env.local` file:

```bash
GOOGLE_SEARCH_API_KEY=your_api_key_here
GOOGLE_SEARCH_ENGINE_ID=your_search_engine_id_here
```

## Usage

The web search enrichment automatically triggers when:
- Initial scan returns 0 warnings, OR
- Initial scan returns only 1-2 generic warnings (e.g., "romance themes" but no mental health themes)

The system will:
1. Search for content warnings using the query: `"[Title]" "[Author]" content warnings trigger warnings parents guide`
2. Filter out retailer websites (TOS compliance)
3. Extract snippets from safe sources (Goodreads, The StoryGraph, etc.)
4. Re-analyze the book with enriched context
5. Add any additional warnings found

## Testing

Test the setup with:

```bash
DOTENV_CONFIG_PATH=.env.local npx tsx scripts/test-enrichment-happy-place.ts
```

## Free Tier Limits

- **100 free searches per day** (plenty for testing and moderate usage)
- After that, $5 per 1,000 queries
- Monitor usage: [Google Cloud Console Quotas](https://console.cloud.google.com/apis/api/customsearch.googleapis.com/quotas)

## TOS Compliance

The search enrichment:
- ✅ Only uses safe, publicly available sources
- ✅ Filters out retailer websites (Amazon, QBD, etc.)
- ✅ Respects Terms of Service for all sources
- ✅ Uses community-generated content (reviews, discussions) not product descriptions

## Troubleshooting

### "Missing API keys" warning
- Check that `GOOGLE_SEARCH_API_KEY` and `GOOGLE_SEARCH_ENGINE_ID` are set in `.env.local`
- Restart your development server after adding the keys
- Verify the keys are correct (no extra spaces, quotes, etc.)

### "No results found"
- Verify your Search Engine is set to "Search the entire web" OR includes the sites you want
- Check that the Custom Search API is enabled in Google Cloud Console
- Verify your API key has the correct permissions
- Check API key restrictions in Google Cloud Console

### Rate limit errors
- You've exceeded 100 free searches per day
- Wait 24 hours or upgrade to a paid plan
- Monitor usage in Google Cloud Console

### API key creation fails via CLI
- The `gcloud alpha services api-keys` command may not be available in all regions
- Fall back to manual creation via the web console
- Ensure you have the "API Keys Admin" role

## References

- [Google Custom Search API Documentation](https://developers.google.com/custom-search/v1/overview)
- [Programmable Search Engine Setup](https://programmablesearchengine.google.com/)
- [Google Cloud Console](https://console.cloud.google.com/)
- [Google Cloud SDK Installation](https://cloud.google.com/sdk/docs/install)
