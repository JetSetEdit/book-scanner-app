/**
 * Candidate Selection and Cover Enhancement Utilities
 * 
 * Intelligently selects the best candidate from multiple options,
 * cross-sources covers when needed, and verifies covers aren't placeholders.
 */

import { BookCandidate } from '@/lib/book-api'
import OpenAI from 'openai'

/**
 * Scores a candidate based on description quality and cover availability
 */
function scoreCandidate(candidate: BookCandidate): number {
  let score = 0
  
  // Description quality (0-100 points)
  const descLength = candidate.description?.length || 0
  if (descLength >= 500) score += 100
  else if (descLength >= 300) score += 80
  else if (descLength >= 150) score += 60
  else if (descLength >= 50) score += 40
  else if (descLength > 0) score += 20
  
  // Cover availability (0-50 points)
  if (candidate.cover_url) score += 50
  
  return score
}

/**
 * Validates if a cover URL is likely a placeholder using basic checks
 * Returns true if it appears to be a valid cover, false if placeholder
 */
async function isPlaceholderCover(url: string): Promise<boolean> {
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 5000)
    
    const response = await fetch(url, {
      method: 'HEAD',
      signal: controller.signal,
      headers: { 'User-Agent': 'Book-Scanner-App/1.0' },
      redirect: 'follow'
    })
    
    clearTimeout(timeout)
    
    if (!response.ok) return true // Invalid response = placeholder
    
    const contentType = response.headers.get('content-type')
    if (contentType && !contentType.startsWith('image/')) return true // Not an image
    
    const contentLength = response.headers.get('content-length')
    if (contentLength) {
      const size = parseInt(contentLength)
      if (size < 1000) return true // Too small = placeholder
      if (size === 15567) return true // Known Google Books placeholder size
    }
    
    // URL patterns that suggest placeholders
    if (url.includes('no-cover') || 
        url.includes('nocover') || 
        url.includes('placeholder') ||
        url.includes('default-cover')) {
      return true
    }
    
    return false // Appears to be a valid cover
  } catch (error) {
    // If validation fails, assume it might be a placeholder
    return true
  }
}

/**
 * Uses AI vision to verify if a cover image is actually a book cover or just a placeholder
 * Only called when basic validation is ambiguous (image exists and is valid size, but might be placeholder)
 */
async function verifyCoverWithAI(
  coverUrl: string,
  bookTitle: string,
  bookAuthor?: string
): Promise<boolean> {
  try {
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
    
    const prompt = `Analyze this book cover image. Is this a real book cover with actual cover art/design, or is it a placeholder image (e.g., "No cover available", generic placeholder, error image, or text saying "No cover")?

Book: "${bookTitle}" by ${bookAuthor || 'Unknown Author'}

Respond with ONLY "REAL_COVER" if it's a real cover, or "PLACEHOLDER" if it's a placeholder.`

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'You are a helpful assistant that analyzes book cover images. Respond with only "REAL_COVER" or "PLACEHOLDER".'
        },
        {
          role: 'user',
          content: [
            { type: 'text', text: prompt },
            { type: 'image_url', image_url: { url: coverUrl } }
          ]
        }
      ],
      max_tokens: 10
    })
    
    const result = response.choices[0]?.message?.content?.trim().toUpperCase()
    const isValid = result === 'REAL_COVER'
    console.log(`[Candidate Selection] AI cover verification: ${isValid ? 'REAL_COVER' : 'PLACEHOLDER'} for "${bookTitle}"`)
    return isValid
  } catch (error) {
    console.error('AI cover verification failed:', error)
    // If AI verification fails, default to treating it as potentially valid
    // (better to have a cover than not, even if uncertain)
    return true
  }
}

/**
 * Cross-sources covers: if a candidate has no cover or invalid cover, try to get it from another candidate
 */
async function enhanceCandidateWithCrossSourceCover(
  candidate: BookCandidate,
  allCandidates: BookCandidate[],
  useAIVerification: boolean = false
): Promise<BookCandidate> {
  // If candidate already has a cover, validate it
  if (candidate.cover_url) {
    const isPlaceholder = await isPlaceholderCover(candidate.cover_url)
    if (!isPlaceholder) {
      // Basic validation passed - optionally verify with AI if enabled
      if (useAIVerification) {
        const isValid = await verifyCoverWithAI(
          candidate.cover_url,
          candidate.title,
          candidate.author
        )
        if (isValid) {
          return candidate // Already has valid cover verified by AI
        }
        // AI says it's a placeholder, try to find better cover
      } else {
        return candidate // Already has valid cover (basic validation passed)
      }
    }
    // Basic validation failed or AI said placeholder - try to find better cover
  }
  
  // Try to find a valid cover from other candidates
  for (const otherCandidate of allCandidates) {
    if (otherCandidate === candidate) continue
    if (!otherCandidate.cover_url) continue
    
    // Validate the other candidate's cover
    const isPlaceholder = await isPlaceholderCover(otherCandidate.cover_url)
    if (!isPlaceholder) {
      // Basic validation passed - optionally verify with AI if enabled
      let isValid = true
      if (useAIVerification) {
        isValid = await verifyCoverWithAI(
          otherCandidate.cover_url,
          otherCandidate.title,
          otherCandidate.author
        )
      }
      
      if (isValid) {
        console.log(`[Candidate Selection] Cross-sourcing cover from ${otherCandidate.source} to ${candidate.source}`)
        return {
          ...candidate,
          cover_url: otherCandidate.cover_url
        }
      }
    }
  }
  
  // No valid cover found from other sources
  return candidate
}

/**
 * Selects the best candidate from multiple options
 * Prioritizes candidates with both good descriptions and valid covers
 */
export async function selectBestCandidate(
  candidates: BookCandidate[],
  useAIVerification: boolean = false
): Promise<BookCandidate | null> {
  if (candidates.length === 0) return null
  if (candidates.length === 1) {
    // Even with one candidate, enhance it with cross-source cover if needed
    return await enhanceCandidateWithCrossSourceCover(candidates[0], candidates, useAIVerification)
  }
  
  // Step 1: Score all candidates
  const scoredCandidates = await Promise.all(
    candidates.map(async (candidate) => {
      // First, enhance with cross-source cover
      const enhanced = await enhanceCandidateWithCrossSourceCover(candidate, candidates, useAIVerification)
      
      // Validate cover if present
      let hasValidCover = false
      if (enhanced.cover_url) {
        const isPlaceholder = await isPlaceholderCover(enhanced.cover_url)
        if (isPlaceholder) {
          // Basic validation clearly indicates placeholder - skip it
          hasValidCover = false
        } else {
          // Basic validation passed - image exists and looks valid
          // Use AI verification if enabled to confirm it's actually a real cover (not "No cover" text)
          if (useAIVerification) {
            console.log(`[Candidate Selection] Using AI to verify cover for "${enhanced.title}" (basic check passed, verifying with AI)`)
            hasValidCover = await verifyCoverWithAI(
              enhanced.cover_url,
              enhanced.title,
              enhanced.author
            )
          } else {
            // Basic validation passed and AI not enabled - trust it
            hasValidCover = true
          }
        }
      }
      
      const score = scoreCandidate(enhanced)
      return {
        candidate: enhanced,
        score,
        hasValidCover,
        descriptionLength: enhanced.description?.length || 0
      }
    })
  )
  
  // Step 2: Sort by score (description + cover)
  scoredCandidates.sort((a, b) => {
    // First priority: has valid cover
    if (a.hasValidCover && !b.hasValidCover) return -1
    if (!a.hasValidCover && b.hasValidCover) return 1
    
    // Second priority: higher score
    if (a.score !== b.score) return b.score - a.score
    
    // Third priority: longer description
    return b.descriptionLength - a.descriptionLength
  })
  
  const best = scoredCandidates[0]
  console.log(`[Candidate Selection] Selected "${best.candidate.title}" (score: ${best.score}, has cover: ${best.hasValidCover})`)
  
  return best.candidate
}

