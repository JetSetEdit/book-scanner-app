/**
 * Calculate Australian Classification Board age rating from content warnings
 * Based on Guidelines for the Classification of Publications 2005 (F2008C00129)
 * and National Classification Code (F2013C00006)
 * 
 * The Board assesses 6 classifiable elements: themes, violence, sex, language, drug use, nudity
 * Ratings: G, PG, M, MA15+, R18+, RC
 */

import { EnhancedContentWarning } from '../config/taxonomy-context'

export type ClassificationRating = 'G' | 'PG' | 'M' | 'MA15+' | 'R18+' | 'RC'

interface AgeRatingResult {
  rating: ClassificationRating
  ageRecommendation: string
  reasoning: string
  keyElements: string[]
}

/**
 * Calculate age rating based on warnings
 * Per Australian Classification Board methodology:
 * - G: Very mild impact (no warnings or only very mild)
 * - PG: Mild impact (mild warnings only)
 * - M: Moderate impact (moderate warnings, or combination of mild warnings)
 * - MA15+: Strong impact (severe warnings, or strong combination of moderate warnings)
 * - R18+: High impact (multiple severe warnings, explicit sexual content, extreme violence)
 * - RC: Very high impact (refused classification - extreme content)
 */
export function calculateAgeRating(warnings: EnhancedContentWarning[]): AgeRatingResult {
  if (!warnings || warnings.length === 0) {
    return {
      rating: 'G',
      ageRecommendation: 'Suitable for all ages',
      reasoning: 'No content warnings identified. Content is suitable for general audiences.',
      keyElements: []
    }
  }

  // Categorize warnings by severity
  const severeWarnings = warnings.filter(w => w.severity === 'severe')
  const moderateWarnings = warnings.filter(w => w.severity === 'moderate')
  const mildWarnings = warnings.filter(w => w.severity === 'mild')

  // Check for specific high-impact content
  const hasSexualViolence = warnings.some(w => 
    w.subcategory_id?.includes('sexual_violence')
  )
  const hasExplicitSexualContent = warnings.some(w => 
    w.subcategory_id?.includes('explicit_sexual_content') || 
    w.subcategory_id?.includes('intense_romance_or_spice')
  )
  const hasGraphicViolence = warnings.some(w => 
    w.subcategory_id?.includes('graphic_violence')
  )
  const hasExtremeContent = warnings.some(w => 
    w.subcategory_id?.includes('extreme') || 
    w.detail_level === 'graphic' && w.severity === 'severe'
  )

  // Map categories to classifiable elements
  const elementMap: Record<string, string> = {
    'violence': 'violence',
    'sexual_content': 'sex',
    'language': 'language',
    'substance_use_or_alcohol': 'drug use',
    'mental_health': 'themes',
    'abuse': 'themes',
    'emotional_abuse_or_toxic_relationships': 'themes',
    'death_or_grief': 'themes',
    'family_dynamics': 'themes'
  }

  const keyElements: string[] = []
  warnings.forEach(w => {
    const category = w.subcategory_id?.split('.')[0] || 'other'
    const element = elementMap[category] || 'themes'
    if (!keyElements.includes(element)) {
      keyElements.push(element)
    }
  })

  // Determine rating based on severity and content type
  let rating: ClassificationRating
  let ageRecommendation: string
  let reasoning: string

  // RC (Refused Classification) - extreme content
  if (hasExtremeContent && severeWarnings.length >= 3) {
    rating = 'RC'
    ageRecommendation = 'Not recommended - contains extreme content'
    reasoning = 'Contains extreme content with multiple severe warnings. This content may not be suitable for any age group.'
  }
  // R18+ - high impact (explicit sexual content, graphic violence, or multiple severe warnings)
  else if (hasSexualViolence || (hasExplicitSexualContent && severeWarnings.length >= 2) || (hasGraphicViolence && severeWarnings.length >= 2)) {
    rating = 'R18+'
    ageRecommendation = 'Recommended for ages 18+'
    reasoning = 'Contains explicit sexual content, sexual violence, or graphic violence with strong impact. Recommended for mature audiences only.'
  }
  // MA15+ - strong impact (severe warnings present)
  else if (severeWarnings.length > 0) {
    rating = 'MA15+'
    ageRecommendation = 'Recommended for ages 15+'
    reasoning = `Contains ${severeWarnings.length} severe warning${severeWarnings.length === 1 ? '' : 's'} with strong impact. Recommended for ages 15 and above.`
  }
  // M - moderate impact (moderate warnings, or combination of mild warnings)
  else if (moderateWarnings.length > 0 || (mildWarnings.length >= 3 && hasExplicitSexualContent)) {
    rating = 'M'
    ageRecommendation = 'Recommended for ages 13+'
    reasoning = `Contains ${moderateWarnings.length || mildWarnings.length} moderate warning${(moderateWarnings.length || mildWarnings.length) === 1 ? '' : 's'} with moderate impact. Recommended for ages 13 and above.`
  }
  // PG - mild impact (mild warnings only)
  else if (mildWarnings.length > 0) {
    rating = 'PG'
    ageRecommendation = 'Recommended for ages 8+'
    reasoning = `Contains ${mildWarnings.length} mild warning${mildWarnings.length === 1 ? '' : 's'} with mild impact. Parental guidance recommended for younger readers.`
  }
  // G - very mild (shouldn't reach here if warnings exist, but safety fallback)
  else {
    rating = 'G'
    ageRecommendation = 'Suitable for all ages'
    reasoning = 'Content warnings are present but impact is very mild. Suitable for general audiences.'
  }

  // Build detailed reasoning with key elements
  if (keyElements.length > 0) {
    const elementsText = keyElements.map(e => e.charAt(0).toUpperCase() + e.slice(1)).join(', ')
    reasoning += ` Key elements: ${elementsText}.`
  }

  return {
    rating,
    ageRecommendation,
    reasoning,
    keyElements
  }
}

