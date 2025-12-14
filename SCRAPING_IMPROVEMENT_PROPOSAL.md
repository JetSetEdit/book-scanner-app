# Scraping Improvement Proposal

## Current State

**What we scrape:**
- Fetch HTML from `hannahgrace.co.uk/books`
- Check if book title exists in HTML
- Return confirmation (but don't extract warnings)

**What's actually on the page:**
```html
<div class="sqs-block accordion-block" id="block-yui_3_17_2_1_1738874358966_6835">
  Content warnings 
  Disordered eating 
  Sexual content (consensual) 
  Toxic friendships 
  Mental health (anxiety and stress) 
  Near death experience 
  Death of a parent (past event, only discussed) 
  Cheating
</div>
```

## Proposed Improvement

**Extract actual warnings:**
1. Parse HTML to find accordion blocks with "Content warnings" text
2. Extract the warning list (split by newlines)
3. Map to our taxonomy categories
4. Set `is_author_verified: true` and include source URL

**Benefits:**
- Get actual author-provided warnings
- Higher accuracy
- Better user experience

**Risks:**
- Still scraping (legal/ethical concerns)
- Fragile (breaks if site structure changes)
- Need to handle different author site formats

## Alternative: Keep Current Approach

**Pros:**
- Lower legal risk
- Simpler code
- Less fragile

**Cons:**
- Don't get actual warnings
- AI still generates from other sources
- Less accurate

## Recommendation

**Option 1: Improve scraping (if we keep it)**
- Extract actual warnings from HTML
- Parse and map to taxonomy
- Handle multiple author sites

**Option 2: Remove scraping entirely**
- Rely on DuckDuckGo search results
- Accept we won't auto-detect all author sites
- Lower legal/ethical risk

**Option 3: Hybrid**
- Keep scraping for authors we have permission for
- Remove for others
- Focus on building relationships with authors







