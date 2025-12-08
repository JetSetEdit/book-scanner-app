# Web Scraping Analysis & Recommendations

## Current State

### What We're Actually Doing

1. **Legitimate API Usage** ✅
   - Google Books API (official API)
   - Apple Books API (official API)
   - DuckDuckGo API (official API)
   - Open Library API (official API)

2. **Direct HTML Scraping** ⚠️
   - Fetching HTML from 3 author websites:
     - hannahgrace.co.uk/books
     - hdcarlton.com/library
     - jenniferhallock.com/content-guidance
   - Parsing HTML to check if book title exists on page
   - Not extracting actual content warnings, just confirming book exists

## Issues with Current Scraping

1. **Legal/Ethical Concerns**
   - No robots.txt checking
   - No explicit permission from authors
   - No rate limiting
   - Could violate Terms of Service

2. **Technical Issues**
   - Fragile (breaks if sites change structure)
   - Only checks if book exists, doesn't extract warnings
   - Limited to 3 authors (not scalable)

3. **Reputation Risk**
   - "Scraping" has negative connotations
   - Could damage trust if discovered
   - May violate website terms of service

## Recommendations

### Option 1: Remove Scraping (Recommended)
- Remove `scrapeAuthorSites()` function
- Rely on:
  - Author-provided warnings via APIs
  - DuckDuckGo search results (which may include author sites)
  - User-submitted author warnings
- Update transparency page to remove mention of scraping

### Option 2: Make It Opt-In/API-Based
- Reach out to authors for permission
- Use RSS feeds or APIs if available
- Only scrape with explicit permission

### Option 3: Use Search Results Only
- Rely on DuckDuckGo search results that include author sites
- Don't directly fetch HTML
- Let search engines do the heavy lifting

## Impact Assessment

**Current scraping value:** LOW
- Only confirms book exists on author site
- Doesn't extract actual content warnings
- Limited to 3 authors
- AI still needs to find warnings elsewhere

**Risk if removed:** LOW
- DuckDuckGo search already finds author sites
- We can still prioritize author-provided warnings
- Users can submit author warnings manually

## Recommendation: Remove Direct Scraping

The scraping provides minimal value and poses legal/ethical risks. We should:
1. Remove the `scrapeAuthorSites()` function
2. Rely on search results and APIs
3. Update transparency page to be accurate
4. Focus on legitimate data sources

