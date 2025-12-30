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

  // Sexual Content Context
  if (categoryId === 'sexual_content') {
    if (subcatLower === 'cnc' || descLower.includes('cnc') || descLower.includes('consensual non-consent') || descLower.includes('consensual roleplay')) {
      return 'cnc-fantasy'
    }
    if (subcatLower === 'consent_ambiguity' || descLower.includes('dubious consent') || descLower.includes('dub-con')) {
      // Check if it's described as a trope vs actual assault
      if (descLower.includes('trope') || descLower.includes('power play') || descLower.includes('fantasy') || descLower.includes('within relationship')) {
        return 'dub-con-trope'
      }
    }
    if (subcatLower === 'non_consensual_sexual_acts' || descLower.includes('actual sexual assault') || descLower.includes('not consensual roleplay') || descLower.includes('traumatic assault')) {
      return 'actual-assault'
    }
  }

  // Stalking Context
  if (categoryId === 'emotional_abuse_or_toxic_relationships' && subcatLower === 'stalking') {
    if (descLower.includes('protective') || descLower.includes('obsessive') || descLower.includes('not threatening') || descLower.includes('dark romance trope')) {
      return 'protective-stalking'
    }
    if (descLower.includes('threatening') || descLower.includes('dangerous') || descLower.includes('creates fear')) {
      return 'predatory-stalking'
    }
    if (descLower.includes('surveillance') || descLower.includes('within relationship') || descLower.includes('established relationship')) {
      return 'relationship-surveillance'
    }
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
  
  if (tropeMode === 'tropes') {
    return contextInfo.isTrope
  } else { // triggers
    return !contextInfo.isTrope
  }
}

