# Production Checklist - Web Search Enrichment

This document outlines the production readiness checklist for the web search enrichment feature.

## ✅ Environment Variables

Ensure these are set in your production environment (Vercel, Railway, Supabase Edge Functions, etc.):

```bash
GOOGLE_SEARCH_API_KEY=your_api_key_here
GOOGLE_SEARCH_ENGINE_ID=your_search_engine_id_here
```

**Vercel Setup:**
1. Go to Project Settings > Environment Variables
2. Add both variables for Production, Preview, and Development environments
3. Redeploy after adding

**Supabase Edge Functions:**
1. Go to Project Settings > Edge Functions > Secrets
2. Add both variables
3. Restart functions if needed

## ✅ Rate Limiting & Quota Management

### Free Tier Limits
- **100 free searches per day** (resets at midnight Pacific Time)
- After that, $5 per 1,000 queries

### Graceful Degradation
The system is configured to:
- ✅ Skip enrichment if quota is exceeded (429/403 errors)
- ✅ Continue with initial scan results (no crash)
- ✅ Log warnings for monitoring

### Monitoring
Monitor usage in Google Cloud Console:
- **Quotas Dashboard:** https://console.cloud.google.com/apis/api/customsearch.googleapis.com/quotas
- **API Usage:** https://console.cloud.google.com/apis/dashboard

### Cost Control
Enrichment only triggers when:
- Initial scan returns **0-2 warnings**, OR
- Only generic warnings found (no mental health themes)

This ensures we only use the API when necessary, not for every book scan.

## ✅ Error Handling

The system handles:
- ✅ Rate limit errors (429) - skips gracefully
- ✅ Quota exceeded (403) - skips gracefully  
- ✅ Network errors - logs and continues
- ✅ Missing API keys - skips enrichment (warns in logs)

## ✅ Testing

Before deploying to production, test:

```bash
# Test with a book that needs enrichment (Happy Place)
DOTENV_CONFIG_PATH=.env.local npx tsx scripts/test-enrichment-happy-place.ts

# Test with a book that doesn't need enrichment (should skip)
# (Any book that returns 3+ warnings on initial scan)
```

## ✅ Database Schema (Optional Future Enhancement)

For tracking analysis metadata, consider adding:

```sql
-- Future migration: Add analysis metadata tracking
ALTER TABLE books ADD COLUMN analysis_metadata JSONB;

-- Example metadata stored:
{
  "source": "web_enriched",
  "enrichment_version": "1.0",
  "search_queries": ["Happy Place Emily Henry content warnings"],
  "enrichment_triggered": true,
  "warnings_before_enrichment": 2,
  "warnings_after_enrichment": 5
}
```

This would help with:
- Debugging why certain books got enriched
- Analytics on enrichment effectiveness
- UI features showing "Enhanced with community data"

**Note:** This is optional and not required for production. The current system works without it.

## ✅ Production Flow Summary

1. **User scans book** → Fetches standard description from Google Books/Open Library
2. **Initial AI analysis** → Analyzes description, finds 0-2 warnings
3. **Enrichment trigger** → Detects insufficient warnings
4. **Web search** → Searches Google for content warnings from community sources
5. **Re-analysis** → Analyzes book again with enriched context
6. **Combine results** → Merges original + enriched warnings
7. **User sees comprehensive warnings** → Including mental health themes

## ✅ Success Metrics

The system successfully:
- ✅ Detects mental health themes (grief, anxiety, panic attacks) that sanitized descriptions miss
- ✅ Uses only safe, TOS-compliant sources (Goodreads, The StoryGraph, etc.)
- ✅ Filters out retailer content automatically
- ✅ Fails gracefully if quota exceeded
- ✅ Only enriches when necessary (cost control)

## 🚀 Ready for Production

The web search enrichment feature is production-ready and will significantly improve content warning detection for books with sanitized descriptions.

