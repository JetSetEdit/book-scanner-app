/**
 * Web Search Enrichment for Content Warnings
 * 
 * This module provides a function to enrich book descriptions with content warning
 * information from community sources when the initial scan returns 0 warnings or
 * only generic warnings (indicating the description may be too sanitized).
 * 
 * TOS Compliance: Only uses safe, publicly available sources (Goodreads, LibraryThing,
 * The StoryGraph, Romance.io, etc.) - NOT retailer websites.
 * 
 * Uses Google Custom Search API for real web search (not LLM simulation).
 */

import { BookMetadata } from '../lib/config/taxonomy-context'
import { searchForContentWarnings, SearchResult } from '@/lib/google-search'

export interface EnrichmentResult {
  /** @deprecated Use combinedText for new code; kept for backward compatibility */
  enrichedContext: string | null
  source: 'web_search' | 'llm_fallback' | null
  foundContentWarnings: boolean
  /** Combined enrichment text for analysis input; empty string when no enrichment. */
  combinedText: string
  /** True when enrichment produced any combined text (had results). */
  hadResults: boolean
}

/**
 * Fetches and extracts the visible text of a trusted content-warning page.
 *
 * Google snippets are ~150 chars — far too thin for the second-pass model to recover a book's
 * real warnings (e.g. the domestic-violence thread in "It Ends With Us"). Pulling the actual
 * page text gives the model the full community CW list to work from. Defensive by design:
 * short timeout, browser-like UA, tag stripping, and a CW-focused text window.
 */
async function fetchPageText(url: string, maxChars: number = 3000): Promise<string | null> {
  try {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 6000)
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml',
      },
    }).finally(() => clearTimeout(timer))

    if (!res.ok) return null
    const html = await res.text()

    // Strip non-content markup, then collapse to readable text.
    const text = html
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;/gi, ' ')
      .replace(/&amp;/gi, '&')
      .replace(/&#\d+;/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()

    if (text.length <= maxChars) return text

    // The specific warnings can appear anywhere in a long review, so a single positional
    // window misses them. Instead, pull out every segment that actually mentions a content
    // warning or a concrete harm and concatenate those — this reliably captures the CW list
    // wherever it lives on the page.
    const CW_TERMS = [
      'trigger warning', 'content warning', 'tw:', 'cw:', 'self-harm', 'self harm', 'self injury',
      'suicid', 'sexual abuse', 'sexual assault', 'sexual violence', 'rape', 'non-consensual',
      'child abuse', 'csa', 'incest', 'pedophil', 'grooming', 'torture', 'domestic violence',
      'domestic abuse', 'eating disorder', 'abuse', 'graphic', 'molest', 'cutting', 'overdose',
      'infanticide', 'trafficking', 'gore', 'mutilation',
    ]
    const segments = text.split(/(?<=[.!?;:\n])\s+/)
    const picked: string[] = []
    let total = 0
    for (const seg of segments) {
      const low = seg.toLowerCase()
      if (CW_TERMS.some(t => low.includes(t))) {
        picked.push(seg.trim())
        total += seg.length
        if (total >= maxChars) break
      }
    }
    if (picked.length > 0) return picked.join(' ').slice(0, maxChars)
    return text.slice(0, maxChars)
  } catch {
    return null
  }
}

/**
 * Enriches book metadata with content warning information from community sources
 * 
 * This function should be called when:
 * - Initial scan returns 0 warnings, OR
 * - Initial scan returns only generic warnings (e.g., "romance themes" but no specific triggers)
 * 
 * It searches for content warnings/trigger warnings from safe community sources and
 * returns enriched context that can be fed into a new analysis call.
 */
export async function enrichWithWebSearch(
  metadata: BookMetadata,
  initialWarningsCount: number,
  onProgress?: (message: string) => void
): Promise<EnrichmentResult> {
  // Caller decides whether enrichment is warranted. We keep a lightweight guardrail to avoid
  // spending time on books that already have many warnings.
  if (initialWarningsCount > 7) {
    onProgress?.('ℹ️ Many warnings already present, skipping web enrichment')
    return { enrichedContext: null, source: null, foundContentWarnings: false, combinedText: '', hadResults: false }
  }

  onProgress?.('🔍 Searching for content warnings from community sources...')

  try {
    const hasGoogleKeys = !!process.env.GOOGLE_SEARCH_API_KEY && !!process.env.GOOGLE_SEARCH_ENGINE_ID

    // Perform REAL web search using Google Custom Search API (when configured)
    const searchResults = hasGoogleKeys
      ? await searchForContentWarnings(metadata.title, metadata.author || '')
      : []

    if (searchResults.length === 0) {
      if (!hasGoogleKeys) {
        // Fallback: no live web search configured. Use a cautious LLM-only enrichment that
        // focuses on "widely reported" triggers without claiming citations.
        onProgress?.('ℹ️ Web enrichment unavailable (missing Google Search API keys). Using fallback enrichment…')
        try {
          const { default: OpenAI } = await import('openai')
          const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

          const prompt = `List widely-reported content warnings / trigger warnings for the book "${metadata.title}" by ${metadata.author || 'Unknown Author'} (ISBN: ${metadata.isbn || 'unknown'}).

IMPORTANT:
- Do NOT quote or reproduce retailer descriptions.
- Do NOT fabricate citations or URLs.
- If you are uncertain about a warning, label it as "uncertain".

Focus especially on: torture, imprisonment/confinement, explicit sexual content, sexual violence, gore/dismemberment, grief/loss, abuse, and war violence.

Return a compact bullet list.`

          const isGpt5 = true
          const resp = await openai.chat.completions.create({
            model: 'gpt-5.2-2025-12-11',
            messages: [
              { role: 'system', content: 'You provide cautious, non-hallucinated content warning summaries. If uncertain, say so explicitly.' },
              { role: 'user', content: prompt },
            ],
            ...(isGpt5 ? { max_completion_tokens: 400 } : { max_tokens: 400 }),
          })

          const text = resp.choices?.[0]?.message?.content?.trim() || ''
          if (!text) {
            onProgress?.('ℹ️ Fallback enrichment returned no usable content')
            return { enrichedContext: null, source: null, foundContentWarnings: false, combinedText: '', hadResults: false }
          }

          const combined = `LLM fallback enrichment (no live web search configured):\n${text}`
          return {
            enrichedContext: combined,
            source: 'llm_fallback',
            foundContentWarnings: true,
            combinedText: combined,
            hadResults: true,
          }
        } catch (e) {
          onProgress?.('⚠️ Fallback enrichment failed')
          return { enrichedContext: null, source: null, foundContentWarnings: false, combinedText: '', hadResults: false }
        }
      }

      onProgress?.('ℹ️ No search results found from community sources')
      return { enrichedContext: null, source: null, foundContentWarnings: false, combinedText: '', hadResults: false }
    }

    // RELEVANCE GATE (two-part) — this is what prevents stray, unrelated snippets from
    // becoming warnings (e.g. a govt manual or random blog that merely mentions a title
    // getting a children's book tagged "severe domestic violence").
    //
    // Part 1: SOURCE ALLOWLIST. Only trust dedicated book content-warning databases and
    // community catalogues. A blocklist is not enough: anything not explicitly blocked was
    // trusted, so arbitrary pages (cyfd.nm.gov, personal blogs) slipped through.
    const trustedCwDomains = [
      'thestorygraph.com', 'booktriggerwarnings.com', 'triggerwarningdatabase.com',
      'commonsensemedia.org', 'doesthedogdie.com', 'romance.io', 'librarything.com',
      'goodreads.com', 'theliterarylifestyle.com', 'bookriot.com', 'bitsandbitesblog.com',
      'thestorygraphapp.com', 'readinggroupguides.com',
    ]
    const isTrustedCwSource = (link: string) =>
      trustedCwDomains.some(domain => link.toLowerCase().includes(domain))

    // Part 2: BOOK-REFERENCE CHECK. The result must actually be about THIS book — its title
    // (or a distinctive title token) or the author's surname must appear in the title/snippet.
    const stopwords = new Set([
      'the', 'a', 'an', 'of', 'and', 'or', 'to', 'in', 'on', 'with', 'for', 'is', 'it',
      'us', 'we', 'you', 'my', 'his', 'her', 'their', 'this', 'that', 'book', 'novel',
    ])
    const normalize = (s: string) => (s || '').toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim()
    const bookTitleCore = normalize(metadata.title.split(':')[0]) // drop subtitle
    const titleTokens = bookTitleCore.split(' ').filter(t => t.length >= 4 && !stopwords.has(t))
    const authorSurname = normalize(metadata.author || '').split(' ').filter(Boolean).pop() || ''

    const referencesBook = (result: SearchResult): boolean => {
      const hay = normalize(`${result.title} ${result.snippet}`)
      if (bookTitleCore.length >= 6 && hay.includes(bookTitleCore)) return true
      const tokenHits = titleTokens.filter(t => hay.includes(t)).length
      const authorHit = authorSurname.length >= 4 && hay.includes(authorSurname)
      // Require the author plus at least one title token, or (for multi-word titles) two title tokens.
      if (authorHit && tokenHits >= 1) return true
      if (titleTokens.length >= 2 && tokenHits >= 2) return true
      return false
    }

    const safeResults = searchResults.filter(result => {
      const link = (result.link || '').toLowerCase()
      return isTrustedCwSource(link) && referencesBook(result)
    })

    if (safeResults.length === 0) {
      console.warn('[Web Search Enrichment] No results from trusted CW sources that actually reference this book — skipping enrichment (avoids false positives)')
      onProgress?.('ℹ️ No relevant community content-warning sources found')
      return {
        enrichedContext: null,
        source: null,
        foundContentWarnings: false,
        combinedText: '',
        hadResults: false,
      }
    }

    // Fetch full page text for the top trusted results (concurrently, best-effort). This is
    // what actually lets the second pass recover a book's real warnings instead of guessing
    // from a one-line snippet. Falls back to the snippet whenever a fetch fails.
    const resultsToFetch = safeResults.slice(0, 3)
    const pageTexts = await Promise.all(resultsToFetch.map(r => fetchPageText(r.link)))

    // Combine into enrichment text (prefer fetched page body, fall back to snippet).
    const enrichmentText = safeResults
      .map((result, index) => {
        let domain = 'Unknown source'
        try {
          const url = new URL(result.link)
          domain = url.hostname.replace('www.', '')
        } catch (e) {
          domain = result.title
        }

        const body = pageTexts[index]
        const content = body && body.length > (result.snippet?.length || 0)
          ? `Page content: "${body}"`
          : `Snippet: "${result.snippet}"`
        return `Source ${index + 1} (${domain}):\nTitle: ${result.title}\n${content}`
      })
      .join('\n\n')

    // Check if we actually found content warnings in the snippets
    const contentWarningIndicators = [
      'content warning', 'trigger warning', 'tw:', 'cw:', 'grief', 'anxiety',
      'panic attack', 'depression', 'trauma', 'mental health', 'death', 'loss',
      'enemies to lovers', 'toxic', 'abuse', 'violence', 'self-harm', 'burnout',
      'ptsd', 'suicide', 'self harm',
      // High-signal "sanitized blurb" omissions
      'torture', 'imprisonment', 'confinement', 'captivity', 'kidnapping',
      'explicit sexual', 'explicit sex', 'smut', 'spice', 'sexual content',
      'sexual assault', 'rape', 'non-consensual', 'non consensual',
      'gore', 'dismember', 'dismemberment',
      // Infanticide/child harm indicators (for books like Verity)
      'infanticide', 'child murder', 'baby death', 'intentional child harm',
      'harm to children', 'child abuse', 'child death', 'murder of child',
      // Sexual violence indicators (for books like Normal People)
      'groping', 'unwanted touching', 'molestation', 'sexual assault',
      'non-consensual sex', 'forced sex', 'unwanted sexual'
    ]

    const foundContentWarnings = contentWarningIndicators.some(indicator => {
      const searchText = (enrichmentText + ' ' + safeResults.map(r => r.title).join(' ')).toLowerCase()
      return searchText.includes(indicator.toLowerCase())
    })

    if (!foundContentWarnings) {
      onProgress?.('ℹ️ Search results found but no explicit content warnings mentioned')
      // Still return the context - it might contain useful information even if not explicitly labeled
    } else {
      onProgress?.('✅ Found content warning information from community sources')
    }

    console.log(`[Web Search Enrichment] Found ${safeResults.length} safe results`)
    console.log('[Web Search Enrichment] Sample context:', enrichmentText.substring(0, 300))

    return {
      enrichedContext: enrichmentText,
      source: 'web_search',
      foundContentWarnings: foundContentWarnings,
      combinedText: enrichmentText,
      hadResults: true,
    }
  } catch (error) {
    console.error('[Web Search Enrichment] Error:', error)
    
    // Check if it's a rate limit or quota error
    const errorMessage = error instanceof Error ? error.message : String(error)
    if (errorMessage.includes('429') || errorMessage.includes('quota') || errorMessage.includes('Quota')) {
      onProgress?.('ℹ️ Web search quota exceeded, skipping enrichment (graceful degradation)')
    } else {
      onProgress?.('⚠️ Web search enrichment failed, continuing without enrichment')
    }
    
    return {
      enrichedContext: null,
      source: null,
      foundContentWarnings: false,
      combinedText: '',
      hadResults: false,
    }
  }
}

