/**
 * Calculate Australian Classification Board age rating from content warnings
 * Based on Guidelines for the Classification of Publications 2005 (F2008C00129)
 * and National Classification Code (F2013C00006)
 * 
 * The Board assesses 6 classifiable elements: themes, violence, sex, language, drug use, nudity
 * Ratings: G, PG, M, MA15+, R18+, RC
 */

import { EnhancedContentWarning } from '../config/taxonomy-context'
import { getEscalationWeight, getRatingFromEscalation } from '../config/age-escalation-weights'

export type ClassificationRating = 'G' | 'PG' | 'M' | 'MA15+' | 'R18+' | 'RC'

interface AgeRatingResult {
  rating: ClassificationRating
  ageRecommendation: string
  reasoning: string
  keyElements: string[]
}

/**
 * Derive presentation multiplier from severity signals
 * Uses existing severity_signals fields (explicitness and proximity) to determine
 * how the presentation style affects the impact of a warning.
 * 
 * @param warning The content warning with severity_signals
 * @returns Multiplier (typically 0.7-1.3) based on detail level and presence
 */
function getPresentationMultiplier(warning: EnhancedContentWarning): number {
  // Derive detail_level from explicitness (reverse mapping)
  const explicitness = warning.severity_signals?.explicitness ?? 0.5
  const detailLevelMult = 
    explicitness >= 0.8 ? 1.15 :  // graphic
    explicitness >= 0.5 ? 1.00 :  // moderate
    explicitness >= 0.3 ? 0.90 :  // vague/clinical
    0.85                            // very vague
  
  // Derive presence from proximity (reverse mapping)
  const proximity = warning.severity_signals?.proximity ?? 0.5
  const presenceMult =
    proximity >= 0.9 ? 1.10 :  // on_page
    proximity >= 0.6 ? 1.00 :  // flashback
    proximity >= 0.4 ? 0.95 :  // off_page
    proximity >= 0.25 ? 0.90 :  // referenced
    0.85                         // implied
  
  return detailLevelMult * presenceMult
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
  // Split explicit sexual content and intense romance/spice into separate checks
  const hasExplicitSexualContent = warnings.some(w => 
    w.subcategory_id?.includes('explicit_sexual_content')
  )
  const hasIntenseRomanceOrSpice = warnings.some(w => 
    w.subcategory_id?.includes('intense_romance_or_spice')
  )
  const hasGraphicViolence = warnings.some(w => 
    w.subcategory_id?.includes('graphic_violence')
  )
  const hasExtremeContent = warnings.some(w => 
    w.subcategory_id?.includes('extreme') || 
    (w.severity_signals?.explicitness >= 0.8 && w.severity === 'severe')
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
  // NEW: Use impact scores (severity × escalation × presentation) for all warnings
  let rating: ClassificationRating
  let ageRecommendation: string
  let reasoning: string

  // Calculate impact score for each warning (moderate+severe)
  const warningImpacts = warnings
    .filter(w => w.severity === 'severe' || w.severity === 'moderate')
    .map(w => {
      const categoryId = w.subcategory_id?.split('.')[0] || 'other'
      const subcategoryId = w.subcategory_id
      
      // Get escalation weight
      const escalationWeight = getEscalationWeight(categoryId, subcategoryId)
      
      // Get presentation multiplier
      const presentationMult = getPresentationMultiplier(w)
      
      // Convert severity to numeric (mild=0.3, moderate=0.6, severe=1.0)
      const severityScore = w.severity === 'severe' ? 1.0 : 
                           w.severity === 'moderate' ? 0.6 : 0.3
      
      // Calculate impact
      const impact = severityScore * escalationWeight * presentationMult
      
      return {
        warning: w,
        impact,
        categoryId,
        subcategoryId,
        escalationWeight,
        presentationMult,
        severityScore
      }
    })

  // Get max impact and top contributing warning
  const maxImpact = warningImpacts.length > 0 
    ? Math.max(...warningImpacts.map(w => w.impact), 0)
    : 0
  const topWarning = warningImpacts.find(w => w.impact === maxImpact)

  // RC (Refused Classification) - extreme content
  if (hasExtremeContent && severeWarnings.length >= 3) {
    rating = 'RC'
    ageRecommendation = 'Not recommended - contains extreme content'
    reasoning = 'Contains extreme content with multiple severe warnings. This content may not be suitable for any age group.'
  }
  // R18+ - high impact (impact >= 0.7 or sexual violence, or explicit sexual content with impact >= 0.5)
  else if (hasSexualViolence || maxImpact >= 0.7 || 
           (hasExplicitSexualContent && maxImpact >= 0.5)) {
    rating = 'R18+'
    ageRecommendation = 'Recommended for ages 18+'
    if (hasSexualViolence) {
      reasoning = 'Contains sexual violence with strong impact. Recommended for mature audiences only.'
    } else if (hasExplicitSexualContent) {
      reasoning = 'Contains explicit sexual content with strong impact. Recommended for mature audiences only.'
    } else {
      reasoning = `Contains high-impact content (impact score: ${maxImpact.toFixed(2)}) requiring mature audiences. Recommended for ages 18 and above.`
    }
  }
  // MA15+ - strong impact (impact >= 0.3 or severe warnings with lower impact)
  else if (maxImpact >= 0.3 || severeWarnings.length > 0) {
    rating = 'MA15+'
    ageRecommendation = 'Recommended for ages 15+'
    if (severeWarnings.length > 0) {
      reasoning = `Contains ${severeWarnings.length} severe warning${severeWarnings.length === 1 ? '' : 's'} with strong impact. Recommended for ages 15 and above.`
    } else {
      reasoning = `Contains content with strong impact (impact score: ${maxImpact.toFixed(2)}). Recommended for ages 15 and above.`
    }
  }
  // M - moderate impact (moderate warnings or low-impact severe, or combination of mild warnings)
  else if (moderateWarnings.length > 0 || maxImpact >= 0.1 || 
           (mildWarnings.length >= 3 && (hasExplicitSexualContent || hasIntenseRomanceOrSpice))) {
    rating = 'M'
    ageRecommendation = 'Recommended for ages 13+'
    if (moderateWarnings.length > 0) {
      reasoning = `Contains ${moderateWarnings.length} moderate warning${moderateWarnings.length === 1 ? '' : 's'} with moderate impact. Recommended for ages 13 and above.`
    } else if (maxImpact >= 0.1) {
      reasoning = `Contains content with moderate impact (impact score: ${maxImpact.toFixed(2)}). Recommended for ages 13 and above.`
    } else {
      reasoning = `Contains ${mildWarnings.length} mild warning${mildWarnings.length === 1 ? '' : 's'} with moderate impact. Recommended for ages 13 and above.`
    }
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

  // Add explainable reasoning with top contributing warning
  if (topWarning) {
    const category = topWarning.categoryId
    const subcategory = topWarning.subcategoryId?.split('.')[1] || 'general'
    const severity = topWarning.warning.severity
    const proximity = topWarning.warning.severity_signals?.proximity ?? 0.5
    const explicitness = topWarning.warning.severity_signals?.explicitness ?? 0.5
    
    const presence = proximity >= 0.9 ? 'on-page' : 
                     proximity >= 0.6 ? 'flashback' : 
                     proximity >= 0.4 ? 'off-page' :
                     proximity >= 0.25 ? 'referenced' : 'implied'
    
    const detail = explicitness >= 0.8 ? 'graphic' :
                   explicitness >= 0.5 ? 'moderate' : 'vague'
    
    reasoning = `${rating} driven by ${category}.${subcategory} (${severity}, ${presence}, ${detail} detail). ${reasoning}`
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

