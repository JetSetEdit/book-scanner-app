/**
 * Google Custom Search API Client
 * 
 * Provides real web search functionality using Google's Custom Search JSON API.
 * This replaces the OpenAI-based "simulated" search with actual web results.
 * 
 * Setup:
 * 1. Get API Key: https://console.cloud.google.com/apis/credentials
 * 2. Get Search Engine ID: https://programmablesearchengine.google.com/
 * 3. Add to .env.local: GOOGLE_SEARCH_API_KEY and GOOGLE_SEARCH_ENGINE_ID
 */

export interface SearchResult {
  title: string
  link: string
  snippet: string
}

/**
 * Performs a real web search using Google Custom Search API
 * 
 * @param query - The search query string
 * @param numResults - Number of results to return (default: 5, max: 10)
 * @returns Array of search results with title, link, and snippet
 */
export async function performWebSearch(
  query: string,
  numResults: number = 5
): Promise<SearchResult[]> {
  const apiKey = process.env.GOOGLE_SEARCH_API_KEY
  const cx = process.env.GOOGLE_SEARCH_ENGINE_ID

  if (!apiKey || !cx) {
    console.warn('[Google Search] Missing API keys, skipping web enrichment')
    console.warn('[Google Search] Set GOOGLE_SEARCH_API_KEY and GOOGLE_SEARCH_ENGINE_ID in .env.local')
    return []
  }

  try {
    const url = new URL('https://www.googleapis.com/customsearch/v1')
    url.searchParams.append('key', apiKey)
    url.searchParams.append('cx', cx)
    url.searchParams.append('q', query)
    url.searchParams.append('num', Math.min(numResults, 10).toString()) // Max 10 results per API

    const res = await fetch(url.toString())
    
    if (!res.ok) {
      const errorText = await res.text()
      
      // Handle rate limiting gracefully
      if (res.status === 429) {
        console.warn('[Google Search] Rate limit exceeded (429). Skipping enrichment.')
        return []
      }
      
      // Handle quota exceeded
      if (res.status === 403) {
        const errorData = JSON.parse(errorText).error || {}
        if (errorData.message?.includes('quota') || errorData.message?.includes('Quota')) {
          console.warn('[Google Search] Daily quota exceeded. Skipping enrichment.')
          return []
        }
      }
      
      console.error(`[Google Search] API error: ${res.status} ${res.statusText}`)
      console.error(`[Google Search] Response: ${errorText.substring(0, 200)}`)
      throw new Error(`Google Search API error: ${res.status} ${res.statusText}`)
    }

    const data = await res.json()
    
    if (!data.items || data.items.length === 0) {
      console.log(`[Google Search] No results found for query: "${query}"`)
      return []
    }

    const results: SearchResult[] = data.items.map((item: any) => ({
      title: item.title || 'Untitled',
      link: item.link || '',
      snippet: item.snippet || ''
    }))

    console.log(`[Google Search] Found ${results.length} results for query: "${query}"`)
    return results

  } catch (error) {
    console.error('[Google Search] Search failed:', error)
    if (error instanceof Error) {
      console.error('[Google Search] Error message:', error.message)
    }
    return []
  }
}

/**
 * Performs a targeted search for content warnings and trigger warnings
 * 
 * @param title - Book title
 * @param author - Book author
 * @returns Array of search results focused on content warnings
 */
export async function searchForContentWarnings(
  title: string,
  author: string
): Promise<SearchResult[]> {
  // Construct targeted queries that focus on user-generated content warnings.
  // We run multiple variants to increase recall for "missing major themes" cases,
  // including explicit searches for high-severity content that's often sanitized from blurbs.
  // Enrichment now runs for most scans, so keep the query count lean (Google Custom Search
  // free tier is only 100 queries/day). These three are the workhorses that consistently
  // surface trusted CW databases; the previous 7-query set (incl. duplicated infanticide /
  // torture probes) exhausted quota fast without adding recall. The broad "sexual violence"
  // query stays because that is the single most commonly omitted-from-blurb severe theme.
  const queries = [
    `"${title}" "${author}" content warnings trigger warnings parents guide`,
    `"${title}" "${author}" "TW" "CW" "content warnings"`,
    `"${title}" "${author}" content warnings sexual assault sexual violence`,
  ]

  const results: SearchResult[] = []
  for (const q of queries) {
    const r = await performWebSearch(q, 4)
    results.push(...r)
  }

  // Dedupe by link
  const seen = new Set<string>()
  const deduped: SearchResult[] = []
  for (const r of results) {
    const link = (r.link || '').trim()
    if (!link || seen.has(link)) continue
    seen.add(link)
    deduped.push(r)
  }

  return deduped.slice(0, 9)
}

