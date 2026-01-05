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
  enrichedContext: string | null
  source: 'web_search' | null
  foundContentWarnings: boolean
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
  // Only enrich if we got 0 warnings or very few generic warnings
  // This indicates the description may be too sanitized
  if (initialWarningsCount > 2) {
    onProgress?.('ℹ️ Sufficient warnings found, skipping web search enrichment')
    return {
      enrichedContext: null,
      source: null,
      foundContentWarnings: false
    }
  }

  onProgress?.('🔍 Searching for content warnings from community sources...')

  try {
    // Perform REAL web search using Google Custom Search API
    const searchResults = await searchForContentWarnings(
      metadata.title,
      metadata.author || ''
    )

    if (searchResults.length === 0) {
      onProgress?.('ℹ️ No search results found from community sources')
      return {
        enrichedContext: null,
        source: null,
        foundContentWarnings: false
      }
    }

    // Filter out retailer websites
    const retailerIndicators = [
      'amazon.com', 'qbd.com.au', 'booktopia.com.au', 'barnesandnoble.com',
      'waterstones.com', 'indigo.ca'
    ]

    const safeResults = searchResults.filter(result => {
      const link = result.link.toLowerCase()
      return !retailerIndicators.some(indicator => link.includes(indicator))
    })

    if (safeResults.length === 0) {
      console.warn('[Web Search Enrichment] All results were from retailer sites (rejected for TOS compliance)')
      onProgress?.('⚠️ Web search found only retailer content (rejected for TOS compliance)')
      return {
        enrichedContext: null,
        source: null,
        foundContentWarnings: false
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
      'ptsd', 'suicide', 'self harm'
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
      foundContentWarnings: foundContentWarnings
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
      foundContentWarnings: false
    }
  }
}

