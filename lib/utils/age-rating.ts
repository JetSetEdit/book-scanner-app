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
import { getCategoryFromSubcategory } from './get-category-from-subcategory'

export type ClassificationRating = 'G' | 'PG' | 'M' | 'MA15+' | 'R18+' | 'RC'

interface AgeRatingResult {
  rating: ClassificationRating
  ageRecommendation: string
  reasoning: string
  keyElements: string[]
}

/**
 * Recompute raw numeric severity score (0-1) from severity_signals
 * This recovers the gradient that was lost when bucketing to mild/moderate/severe
 * 
 * @param warning The content warning with severity_signals
 * @returns Raw numeric severity score (0-1)
 */
function getRawSeverityScore(warning: EnhancedContentWarning): number {
  const signals = warning.severity_signals
  if (!signals) {
    // Fallback to bucket if signals missing
    return warning.severity === 'severe' ? 0.85 : 
           warning.severity === 'moderate' ? 0.55 : 0.35
  }
  
  // Recompute using same formula as computeSeverityFromSignals
  const baseScore = (signals.frequency * 0.3) + (signals.explicitness * 0.4)
  const proximityMultiplier = 1 + (signals.proximity * 0.2)
  const centralityMultiplier = 1 + (signals.centrality * 0.2)
  const intensityBonus = Math.min(signals.intensity_markers.length * 0.1, 0.3)
  
  const finalScore = (baseScore * proximityMultiplier * centralityMultiplier) + intensityBonus
  return Math.min(finalScore, 1.0)
}

/**
 * Check if a warning represents explicit on-page sexual content
 * This is an internal semantic flag derived from severity_signals, not a taxonomy change
 * 
 * @param warning The content warning with severity_signals
 * @returns true if the warning represents explicit on-page sexual content
 */
function isExplicitOnPageSexualContent(warning: EnhancedContentWarning): boolean {
  const categoryId = getCategoryFromSubcategory(warning.subcategory_id)
  
  // Only applies to sexual content
  if (categoryId !== 'sexual_content') {
    return false
  }
  
  const signals = warning.severity_signals
  if (!signals) {
    // Fallback: if subcategory is explicit_sexual_content, assume explicit
    return warning.subcategory_id?.includes('explicit_sexual_content') || false
  }
  
  // Explicit on-page sexual content:
  // - proximity >= 0.9 (on-page, not off-page or referenced)
  // - explicitness >= 0.6 (explicit acts, not just tension)
  // - frequency >= 0.35 (recurring, not one-off; lower threshold for literary fiction
  //   where scenes may be spaced out but still central to narrative)
  return signals.proximity >= 0.9 && 
         signals.explicitness >= 0.6 &&
         signals.frequency >= 0.35
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
  
  // Check for explicit on-page sexual content using internal semantic flag
  // This is derived from severity_signals, not just subcategory name
  const hasExplicitOnPageSexualContent = warnings.some(w => 
    isExplicitOnPageSexualContent(w)
  )
  
  // Legacy checks for backward compatibility (but prefer explicit flag)
  const hasExplicitSexualContent = warnings.some(w => 
    w.subcategory_id?.includes('explicit_sexual_content')
  )
  const hasIntenseRomanceOrSpice = warnings.some(w => 
    w.subcategory_id?.includes('intense_romance')
  )
  const hasIncestOrTabooSex = warnings.some(w =>
    w.subcategory_id?.includes('incest_taboo')
  )
  const hasSexualViolence = warnings.some(w =>
    w.subcategory_id?.includes('sexual_violence')
  )
  const hasGraphicViolence = warnings.some(w => 
    w.subcategory_id?.includes('graphic_violence')
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
        // Get category from subcategory using taxonomy lookup
        const categoryId = getCategoryFromSubcategory(w.subcategory_id)
        const subcategoryId = w.subcategory_id
        
        // Get escalation weight
        const escalationWeight = getEscalationWeight(categoryId, subcategoryId)
      
      // Get presentation multiplier
      const presentationMult = getPresentationMultiplier(w)
      
      // Use raw numeric severity score (0-1) instead of bucket
      // This preserves the gradient that was computed from signals
      const severityScore = getRawSeverityScore(w)
      
      // Calculate impact - ensure all values are numbers
      const safeSeverityScore = typeof severityScore === 'number' && !isNaN(severityScore) ? severityScore : 0.5
      const safeEscalationWeight = typeof escalationWeight === 'number' && !isNaN(escalationWeight) ? escalationWeight : 0.4
      const safePresentationMult = typeof presentationMult === 'number' && !isNaN(presentationMult) ? presentationMult : 1.0
      
      const impact = safeSeverityScore * safeEscalationWeight * safePresentationMult
      
      return {
        warning: w,
        impact: typeof impact === 'number' && !isNaN(impact) ? impact : 0,
        categoryId,
        subcategoryId,
        escalationWeight: safeEscalationWeight,
        presentationMult: safePresentationMult,
        severityScore: safeSeverityScore
      }
    })

  // Get max impact and top contributing warning
  // Ensure all impacts are valid numbers
  const validImpacts = warningImpacts
    .map(w => typeof w.impact === 'number' && !isNaN(w.impact) ? w.impact : 0)
    .filter(impact => impact >= 0)
  
  const maxImpact = validImpacts.length > 0 
    ? Math.max(...validImpacts, 0)
    : 0
  const topWarning = warningImpacts.find(w => w.impact === maxImpact)

  // Pre-compute MA15+ fallback conditions
  const highRiskCategories = ['violence', 'sexual_content', 'abuse']
  const hasHighRiskSevere = severeWarnings.some(w => {
    const cat = getCategoryFromSubcategory(w.subcategory_id)
    return highRiskCategories.includes(cat)
  })

  // RC should only trigger for truly extreme content, not just graphic violence in YA/dystopian fiction
  // Check for multiple extreme indicators OR truly extreme content types
  // NOTE: This must be calculated AFTER maxImpact is computed
  const extremeContentTypes = ['extreme_violence', 'extreme_gore', 'extreme_sexual_violence', 'torture_porn', 'snuff']
  const hasExtremeContentType = warnings.some(w => 
    extremeContentTypes.some(extremeType => w.subcategory_id?.includes(extremeType))
  )
  
  // Count warnings with very high explicitness (>= 0.9) - not just 0.8
  const veryHighExplicitnessCount = warnings.filter(w => 
    w.severity === 'severe' && (w.severity_signals?.explicitness ?? 0) >= 0.9
  ).length
  
  // RC requires: (extreme content type) OR (multiple very high explicitness warnings AND high impact)
  const hasExtremeContent = hasExtremeContentType || 
    (veryHighExplicitnessCount >= 3 && maxImpact >= 0.8)

  // RC (Refused Classification) - extreme content
  // RC should be very rare - only for truly extreme content that would be refused classification
  // Not just graphic violence in YA/dystopian fiction (which can be MA15+ or R18+)
  if (hasExtremeContent) {
    rating = 'RC'
    ageRecommendation = 'Not recommended - contains extreme content'
    reasoning = hasExtremeContentType 
      ? 'Contains extreme content types that may not be suitable for any age group.'
      : 'Contains multiple very high-impact extreme warnings. This content may not be suitable for any age group.'
  }
  // R18+ - explicit on-page sexual content OR high impact OR sexual violence
  // NEW: Use explicit flag instead of threshold hacks
  else if (hasSexualViolence || hasExplicitOnPageSexualContent || maxImpact >= 0.7) {
    rating = 'R18+'
    ageRecommendation = 'Recommended for ages 18+'
    if (hasSexualViolence) {
      reasoning = 'Contains sexual violence. Recommended for mature audiences only.'
    } else if (hasExplicitOnPageSexualContent) {
      reasoning = 'Contains explicit on-page sexual content. Recommended for mature audiences only.'
    } else {
      reasoning = `Contains high-impact content (impact score: ${maxImpact.toFixed(2)}) requiring mature audiences. Recommended for ages 18 and above.`
    }
  }
  // MA15+ - strong impact (impact >= 0.3 or severe warnings with meaningful impact)
  // Constrain fallback: require at least 0.2 impact for severe warnings, or high-risk categories
  else if (maxImpact >= 0.3 || 
      (hasHighRiskSevere && maxImpact >= 0.15) ||
      (severeWarnings.length > 0 && maxImpact >= 0.2)) {
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

  // Minimum floors for specific high-risk topics.
  // Even if the model marks these as "moderate" (low explicitness), they should not land at M.
  // This helps catch sanitized-blurb cases where taboo content is present but described vaguely.
  const ratingRank: Record<ClassificationRating, number> = { G: 0, PG: 1, M: 2, 'MA15+': 3, 'R18+': 4, RC: 5 }
  let floor: ClassificationRating | null = null
  if (hasSexualViolence) floor = 'R18+'
  else if (hasIncestOrTabooSex || hasExplicitSexualContent) floor = 'MA15+'

  if (floor && ratingRank[rating] < ratingRank[floor]) {
    rating = floor
    ageRecommendation = floor === 'R18+' ? 'Recommended for ages 18+' : 'Recommended for ages 15+'
    reasoning = `${floor} floor applied due to ${hasSexualViolence ? 'sexual violence' : hasIncestOrTabooSex ? 'incest/taboo sexual content' : 'explicit sexual content'}. ${reasoning}`
  }

  // Add explainable reasoning with top contributing warning
  // PRIORITY: If rating was triggered by explicit flag, use that warning (not impact leader)
  let driverWarning = topWarning
  
  if (rating === 'R18+' && hasExplicitOnPageSexualContent) {
    // Find the explicit sexual content warning that triggered R18+
    const explicitWarning = warningImpacts.find(w => {
      const cat = w.categoryId
      const subcat = w.subcategoryId || ''
      return cat === 'sexual_content' && 
             (subcat.includes('explicit_sexual_content') || 
              isExplicitOnPageSexualContent(w.warning))
    })
    if (explicitWarning) {
      driverWarning = explicitWarning
    }
  }
  
  if (driverWarning) {
    const category = driverWarning.categoryId
    const subcategory = driverWarning.subcategoryId?.split('.')[1] || 'general'
    const severity = driverWarning.warning.severity
    const proximity = driverWarning.warning.severity_signals?.proximity ?? 0.5
    const explicitness = driverWarning.warning.severity_signals?.explicitness ?? 0.5
    
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

