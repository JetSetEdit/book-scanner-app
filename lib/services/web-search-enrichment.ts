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

    // Filter out retailer websites and low-quality user-generated content
    const blockedDomains = [
      // Retailers
      'amazon.com', 'qbd.com.au', 'booktopia.com.au', 'barnesandnoble.com',
      'waterstones.com', 'indigo.ca', 'books.google.com',
      // Noisy UGC / Social Media (high hallucination risk)
      'reddit.com', 'pinterest.com', 'tumblr.com', 'twitter.com', 'x.com',
      'facebook.com', 'instagram.com', 'tiktok.com', 'youtube.com',
      'pastemagazine.com', 'buzzfeed.com', 'screenrant.com'
    ]

    const safeResults = searchResults.filter(result => {
      const link = result.link.toLowerCase()
      return !blockedDomains.some(indicator => link.includes(indicator))
    })

    if (safeResults.length === 0) {
      console.warn('[Web Search Enrichment] All results were from retailer sites (rejected for TOS compliance)')
      onProgress?.('⚠️ Web search found only retailer content (rejected for TOS compliance)')
      return {
        enrichedContext: null,
        source: null,
        foundContentWarnings: false,
        combinedText: '',
        hadResults: false,
      }
    }

    // Combine search snippets into enrichment text
    const enrichmentText = safeResults
      .map((result, index) => {
        // Extract domain from URL for attribution
        let domain = 'Unknown source'
        try {
          const url = new URL(result.link)
          domain = url.hostname.replace('www.', '')
        } catch (e) {
          // Invalid URL, use title as fallback
          domain = result.title
        }

        return `Source ${index + 1} (${domain}):\nTitle: ${result.title}\nSnippet: "${result.snippet}"`
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

