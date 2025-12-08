/**
 * Severity Scoring System
 * 
 * This module defines how to calculate an overall "severity score" for a book
 * based on its content warnings. The score considers:
 * 1. The highest severity warning (primary factor)
 * 2. The weighted sum of all warnings (secondary factor)
 * 3. Category sensitivity (some categories are inherently more sensitive)
 */

export interface WarningSummary {
  severe: number
  moderate: number
  mild: number
}

export interface ContentWarning {
  severity: 'mild' | 'moderate' | 'severe'
  category?: string
  category_id?: string
}

/**
 * Category sensitivity weights
 * Some categories are inherently more sensitive and should be weighted higher
 */
export const CATEGORY_WEIGHTS: Record<string, number> = {
  // High sensitivity categories
  'sexual_content': 1.5,
  'self_harm_or_suicidal_ideation': 1.5,
  'emotional_abuse_or_toxic_relationships': 1.3,
  
  // Medium-high sensitivity
  'violence': 1.2,
  'mental_health': 1.2,
  'bullying_or_social_cruelty': 1.1,
  
  // Standard weight
  'death_or_grief': 1.0,
  'substance_use_or_alcohol': 1.0,
  'discrimination': 1.0,
  
  // Lower sensitivity
  'language': 0.8,
  'other': 0.8,
}

/**
 * Base severity point values
 */
export const SEVERITY_POINTS = {
  severe: 3,
  moderate: 2,
  mild: 1,
}

/**
 * Calculate overall severity score for a book
 * 
 * Strategy: 
 * 1. Highest severity warning is the primary factor (any severe > any moderate > any mild)
 * 2. Weighted sum of all warnings provides secondary differentiation
 * 3. Category sensitivity adjusts weights for inherently more sensitive content
 * 
 * @param warnings Array of content warnings
 * @returns Overall severity score (higher = more severe)
 */
export function calculateSeverityScore(warnings: ContentWarning[]): number {
  if (!warnings || warnings.length === 0) {
    return 0
  }

  // Get summary counts
  const summary: WarningSummary = {
    severe: warnings.filter(w => w.severity === 'severe').length,
    moderate: warnings.filter(w => w.severity === 'moderate').length,
    mild: warnings.filter(w => w.severity === 'mild').length,
  }

  // Primary factor: Highest severity level (0-100 base score)
  let primaryScore = 0
  if (summary.severe > 0) {
    primaryScore = 100 // Any severe warnings = base 100
  } else if (summary.moderate > 0) {
    primaryScore = 50 // Any moderate warnings = base 50
  } else if (summary.mild > 0) {
    primaryScore = 10 // Any mild warnings = base 10
  }

  // Secondary factor: Weighted sum of all warnings
  let weightedSum = 0
  warnings.forEach(warning => {
    const basePoints = SEVERITY_POINTS[warning.severity]
    const categoryWeight = warning.category_id 
      ? (CATEGORY_WEIGHTS[warning.category_id] || 1.0)
      : (warning.category ? CATEGORY_WEIGHTS[warning.category] || 1.0 : 1.0)
    
    weightedSum += basePoints * categoryWeight
  })

  // Normalize weighted sum to 0-50 range (secondary factor)
  // Max possible: 3 severe * 1.5 weight * 10 warnings = 45, so we'll cap at 50
  const normalizedWeightedSum = Math.min(weightedSum * 2, 50)

  // Final score: Primary (0-100) + Secondary (0-50) = 0-150 range
  return primaryScore + normalizedWeightedSum
}

/**
 * Get severity level from score
 */
export function getSeverityLevelFromScore(score: number): 'none' | 'mild' | 'moderate' | 'severe' {
  if (score === 0) return 'none'
  if (score < 30) return 'mild'
  if (score < 80) return 'moderate'
  return 'severe'
}

/**
 * Compare two books by severity (for sorting)
 * Returns: -1 if a < b, 0 if equal, 1 if a > b
 */
export function compareBySeverity(
  a: { warnings: ContentWarning[] },
  b: { warnings: ContentWarning[] }
): number {
  const scoreA = calculateSeverityScore(a.warnings || [])
  const scoreB = calculateSeverityScore(b.warnings || [])
  return scoreB - scoreA // Higher score = more severe = comes first
}

