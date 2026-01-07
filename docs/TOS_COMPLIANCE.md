# Terms of Service (TOS) Compliance

This document outlines Subtext's approach to TOS compliance and how we ensure we remain defensible if questioned about our data sourcing practices.

## Core Principle

**We only use open, publicly available metadata sources that are explicitly designed for reuse.** We do not scrape, quote, or reproduce content from retailer websites.

## Defensible Practices

### 1. Explicit Source Restrictions

Our web search prompts explicitly instruct AI models to:
- ❌ **DO NOT** use or quote content from retailer websites (Amazon, QBD, Booktopia, Barnes & Noble, etc.)
- ❌ **DO NOT** scrape or reproduce retailer product descriptions
- ✅ **ONLY** use open, publicly available sources

### 2. Safe Source Whitelist

We maintain an explicit whitelist of safe sources:
- Open Library (openlibrary.org)
- Google Books API
- Library catalogs (public library systems)
- Publisher websites (official publisher descriptions)
- Author websites (official author pages)
- Public review sites (Goodreads, LibraryThing)
- Wikipedia and open encyclopedias
- Academic databases with open access

### 3. Automated Compliance Checks

Our code includes automated checks to reject retailer content:

```typescript
// TOS Compliance Check: Reject if response contains retailer indicators
const retailerIndicators = [
  'amazon.com', 'qbd.com.au', 'booktopia.com.au', 'barnesandnoble.com',
  'waterstones.com', 'indigo.ca', 'retailer', 'product page', 'buy now',
  'add to cart', 'customer reviews on amazon', 'amazon product description'
]

const containsRetailerContent = retailerIndicators.some(indicator => 
  webSearchContext.toLowerCase().includes(indicator.toLowerCase())
)

if (containsRetailerContent) {
  // Reject and log for compliance tracking
  console.warn('[Web Search] TOS Compliance: Rejected response containing retailer content')
  // Don't use retailer content
}
```

### 4. System-Level Instructions

Our AI system prompts include explicit TOS compliance instructions:

```
You MUST comply with Terms of Service requirements and only use open, 
publicly available sources. You MUST NOT quote or reproduce content 
from retailer websites.
```

### 5. Audit Trail

We maintain audit logs that record:
- When web search is used
- What sources were consulted (implicitly via the safe source whitelist)
- When retailer content is detected and rejected
- Source attribution for all stored metadata

### 6. Source Attribution

All stored metadata includes source attribution:
- `source: 'googlebooks'` - Data from Google Books API
- `source: 'openlibrary'` - Data from Open Library API
- Web search context is marked as "from open sources" in reasoning

## What Makes Us Defensible

1. **Explicit Instructions**: Our prompts explicitly prohibit retailer content
2. **Automated Rejection**: Code automatically rejects retailer content if detected
3. **Whitelist Approach**: We only use explicitly approved safe sources
4. **Audit Logging**: We log compliance checks and rejections
5. **Source Attribution**: All data is tagged with its source
6. **Documentation**: This document and METADATA_SOURCES.md provide clear policies

## If Questioned

If questioned about TOS compliance, we can demonstrate:

1. **Our prompts explicitly prohibit retailer content** - See `lib/services/scan-service.ts` lines 633-634
2. **We have automated rejection logic** - See `lib/services/scan-service.ts` lines 670-680
3. **We only use whitelisted safe sources** - See `docs/METADATA_SOURCES.md`
4. **We maintain audit logs** - All web search usage is logged
5. **We attribute sources** - All metadata includes source tags

## Monitoring & Enforcement

- All web search responses are checked for retailer indicators
- Rejected responses are logged with warnings
- Audit logs track compliance events
- Regular code reviews ensure compliance logic remains intact

## References

- [METADATA_SOURCES.md](./METADATA_SOURCES.md) - Detailed source documentation
- [Google Books API TOS](https://developers.google.com/books/docs/v1/using)
- [Open Library API](https://openlibrary.org/developers/api)

