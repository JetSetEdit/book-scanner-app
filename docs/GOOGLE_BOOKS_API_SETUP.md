# Google Books API Key Setup

This guide explains how to get a Google Books API key to increase rate limits and avoid 429 errors.

## Why You Need It

- **Without API key**: Very strict rate limits (hitting 429 errors with multiple rapid calls)
- **With API key**: ~100,000 requests per day (much higher limits)

## Step-by-Step Setup

### 1. Go to Google Cloud Console

Visit: [Google Cloud Console](https://console.cloud.google.com/)

### 2. Create or Select a Project

- If you don't have a project, click "Create Project"
- Give it a name (e.g., "Subtext Scanner")
- Click "Create"
- Wait for project creation (usually a few seconds)

### 3. Enable Books API

1. In your project, go to **APIs & Services** → **Library**
2. Search for "**Books API**"
3. Click on "**Books API**" in the results
4. Click the **"Enable"** button
5. Wait for it to enable (usually instant)

**Direct link**: [Enable Books API](https://console.cloud.google.com/apis/library/books.googleapis.com)

### 4. Create API Key

1. Go to **APIs & Services** → **Credentials**
2. Click **"+ CREATE CREDENTIALS"** at the top
3. Select **"API key"**
4. Your API key will be generated immediately
5. **Copy the key** (you'll need it in the next step)

**Direct link**: [Create API Key](https://console.cloud.google.com/apis/credentials)

### 5. (Optional) Restrict the API Key

For better security, you can restrict the key:

1. Click on the API key you just created
2. Under **"API restrictions"**, select **"Restrict key"**
3. Choose **"Books API"** from the list
4. Click **"Save"**

**Note**: Restricting is optional but recommended for production.

### 6. Add to Vercel Production

```bash
# Add to production environment
vercel env add GOOGLE_BOOKS_API_KEY production

# When prompted, paste your API key
# Select "Encrypt" when asked
```

Or via Vercel Dashboard:
1. Go to your project on [Vercel Dashboard](https://vercel.com/dashboard)
2. Click **Settings** → **Environment Variables**
3. Click **"Add New"**
4. Name: `GOOGLE_BOOKS_API_KEY`
5. Value: Paste your API key
6. Select **Production** (and optionally Preview/Development)
7. Click **"Save"**

### 7. (Optional) Add to Local Development

Add to your `.env.local` file:

```bash
GOOGLE_BOOKS_API_KEY=your_api_key_here
```

**Note**: Don't commit `.env.local` to git - it's already in `.gitignore`

## Verify It's Working

After adding the key, test it:

```bash
# Test the retry script (should work without rate limits now)
npx tsx scripts/retry-missing-book-searches.ts
```

Or test a normal scan - it should work the same as before, but with higher rate limits.

## Cost

**Google Books API is FREE** - no charges for API usage. The only requirement is:
- A Google Cloud account (free tier is fine)
- Books API enabled in your project

## Troubleshooting

### "API not enabled" error
- Make sure you enabled "Books API" (step 3)
- Wait a few minutes if you just enabled it

### Still getting 429 errors
- Make sure the API key is set in Vercel environment variables
- Redeploy your app after adding the key
- Check that the key isn't restricted incorrectly

### Key not working
- Verify the key is correct (no extra spaces)
- Check that Books API is enabled in your project
- Make sure you're using the key in the right environment (production vs development)

## Quick Links

- [Google Cloud Console](https://console.cloud.google.com/)
- [Enable Books API](https://console.cloud.google.com/apis/library/books.googleapis.com)
- [Create API Key](https://console.cloud.google.com/apis/credentials)
- [Vercel Environment Variables](https://vercel.com/dashboard)
