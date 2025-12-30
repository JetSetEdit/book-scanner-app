/**
 * Dark Romance Context Utilities
 * Helps distinguish between tropes (what readers seek) vs triggers (what readers avoid)
 */

export type WarningContext = 
  | 'cnc-fantasy' 
  | 'dub-con-trope' 
  | 'actual-assault' 
  | 'protective-stalking' 
  | 'predatory-stalking' 
  | 'relationship-surveillance'
  | 'other'

export interface ContextInfo {
  label: string
  description: string
  color: string
  isTrope: boolean // true = trope readers seek, false = trigger readers avoid
}

/**
 * Determine the context of a warning based on subcategory and description
 */
export function getWarningContext(
  categoryId: string | null | undefined,
  subcategoryId: string | null | undefined,
  description: string
): WarningContext {
  const descLower = description.toLowerCase()
  const subcatLower = subcategoryId?.toLowerCase() || ''
  const catLower = categoryId?.toLowerCase() || ''

  // Sexual Content Context - Check subcategory FIRST (most reliable)
  if (catLower === 'sexual_content') {
    // Direct subcategory matching (most reliable)
    if (subcatLower === 'cnc') {
      return 'cnc-fantasy'
    }
    if (subcatLower === 'consent_ambiguity' || subcatLower === 'dub_con') {
      // For dub-con, check description to see if it's trope or trigger
      // If description mentions "trope", "power play", "fantasy", "within relationship" → trope
      // If description mentions "actual", "traumatic", "not consensual roleplay" → trigger
      if (descLower.includes('trope') || descLower.includes('power play') || descLower.includes('fantasy') || descLower.includes('within relationship') || descLower.includes('dark romance')) {
        return 'dub-con-trope'
      }
      // Default dub-con to trope (most dark romance dub-con is trope territory)
      // Only mark as actual-assault if explicitly stated
      if (descLower.includes('actual') || descLower.includes('traumatic') || descLower.includes('not consensual roleplay') || descLower.includes('real assault')) {
        return 'actual-assault'
      }
      // Default: assume dub-con is trope (dark romance context)
      return 'dub-con-trope'
    }
    // CRITICAL: sexual_violence subcategory = actual assault (trigger), not trope
    if (subcatLower === 'non_consensual_sexual_acts' || subcatLower === 'sexual_violence') {
      // Check if description clarifies it's CNC/roleplay vs actual assault
      if (descLower.includes('cnc') || descLower.includes('consensual roleplay') || descLower.includes('power play') || descLower.includes('fantasy') || descLower.includes('within relationship')) {
        return 'cnc-fantasy' // Misclassified - should be cnc but marked as non_consensual
      }
      if (descLower.includes('actual') || descLower.includes('traumatic') || descLower.includes('not consensual roleplay') || descLower.includes('real assault')) {
        return 'actual-assault'
      }
      // If subcategory is non_consensual_sexual_acts or sexual_violence but description doesn't clarify,
      // default to actual-assault (safer assumption - these are triggers, not tropes)
      return 'actual-assault'
    }
    
    // Fallback: Check description keywords if subcategory doesn't match
    if (descLower.includes('cnc') || descLower.includes('consensual non-consent') || descLower.includes('consensual roleplay') || descLower.includes('power play dynamics')) {
      return 'cnc-fantasy'
    }
    if (descLower.includes('dubious consent') || descLower.includes('dub-con')) {
      if (descLower.includes('trope') || descLower.includes('power play') || descLower.includes('fantasy') || descLower.includes('within relationship')) {
        return 'dub-con-trope'
      }
      // Default dub-con to trope
      return 'dub-con-trope'
    }
    if (descLower.includes('actual sexual assault') || descLower.includes('not consensual roleplay') || descLower.includes('traumatic assault') || descLower.includes('real non-consent')) {
      return 'actual-assault'
    }
    
    // Generic "sexual violence" or "sexual coercion" in description - need to infer
    // If it's in sexual_content category but no specific subcategory, check description
    // IMPORTANT: "sexual violence" in description usually means actual assault (trigger), not trope
    if (descLower.includes('sexual violence') || descLower.includes('sexual coercion') || descLower.includes('sexual assault') || descLower.includes('rape')) {
      // Only classify as trope if description explicitly mentions it's CNC/roleplay/power play
      if (descLower.includes('cnc') || descLower.includes('consensual roleplay') || descLower.includes('power play') || descLower.includes('fantasy') || descLower.includes('within relationship') || descLower.includes('dark romance trope')) {
        return 'dub-con-trope'
      }
      // Otherwise, assume it's actual assault (safer - "sexual violence" is typically a trigger)
      return 'actual-assault'
    }
  }

  // Stalking Context - Check subcategory FIRST
  if (catLower === 'emotional_abuse_or_toxic_relationships' && subcatLower === 'stalking') {
    // Check description for context
    if (descLower.includes('protective') || descLower.includes('obsessive') || descLower.includes('not threatening') || descLower.includes('dark romance trope') || descLower.includes('romantic')) {
      return 'protective-stalking'
    }
    if (descLower.includes('threatening') || descLower.includes('dangerous') || descLower.includes('creates fear') || descLower.includes('predatory')) {
      return 'predatory-stalking'
    }
    if (descLower.includes('surveillance') || descLower.includes('within relationship') || descLower.includes('established relationship') || descLower.includes('monitoring')) {
      return 'relationship-surveillance'
    }
    // Default: If it's stalking subcategory but no context, assume protective (dark romance context)
    // This is safer for dark romance readers who seek protective stalking
    return 'protective-stalking'
  }

  // Violence category with sexual_violence subcategory
  if (catLower === 'violence' && (subcatLower === 'sexual_violence' || descLower.includes('sexual violence'))) {
    // Check if it's described as CNC/roleplay
    if (descLower.includes('cnc') || descLower.includes('consensual roleplay') || descLower.includes('power play') || descLower.includes('fantasy')) {
      return 'cnc-fantasy'
    }
    // Otherwise assume actual assault
    return 'actual-assault'
  }

  return 'other'
}

/**
 * Get context badge information
 */
export function getContextInfo(context: WarningContext): ContextInfo {
  switch (context) {
    case 'cnc-fantasy':
      return {
        label: 'CNC/Fantasy Power Play',
        description: 'Consensual non-consent roleplay within the relationship',
        color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
        isTrope: true
      }
    case 'dub-con-trope':
      return {
        label: 'Dub-Con (Trope)',
        description: 'Dubious consent within dark romance power dynamics',
        color: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400',
        isTrope: true
      }
    case 'actual-assault':
      return {
        label: 'Sexual Assault/Real Non-Consent',
        description: 'Actual traumatic assault scenes (not consensual roleplay)',
        color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
        isTrope: false
      }
    case 'protective-stalking':
      return {
        label: 'Protective Stalking/Obsession',
        description: 'MMC watches from afar, framed as protective/romantic',
        color: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400',
        isTrope: true
      }
    case 'predatory-stalking':
      return {
        label: 'Predatory Stalking',
        description: 'Genuinely threatening behavior that creates fear',
        color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
        isTrope: false
      }
    case 'relationship-surveillance':
      return {
        label: 'Surveillance in Relationship',
        description: 'Tracking/monitoring within established relationship dynamic',
        color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
        isTrope: true
      }
    default:
      return {
        label: '',
        description: '',
        color: '',
        isTrope: false
      }
  }
}

/**
 * Check if a warning should be shown based on trope mode preference
 */
export function shouldShowWarning(
  context: WarningContext,
  tropeMode: 'tropes' | 'triggers' | 'both'
): boolean {
  if (tropeMode === 'both') return true
  
  const contextInfo = getContextInfo(context)
  
  // If context is 'other', show it in both modes (can't determine if trope or trigger)
  // This ensures we don't hide warnings we can't classify
  if (context === 'other') {
    return true // Show 'other' warnings in all modes to avoid hiding important content
  }
  
  if (tropeMode === 'tropes') {
    return contextInfo.isTrope
  } else { // triggers
    return !contextInfo.isTrope
  }
}

