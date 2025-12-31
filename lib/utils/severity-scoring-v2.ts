/**
 * Improved Severity Scoring System v2
 * 
 * Addresses mathematical issues:
 * 1. Linear mapping instead of hard buckets (fixes "Cliff Problem")
 * 2. Volume consideration for outlier detection (fixes "One Bad Apple")
 * 3. Logarithmic normalization (fixes "Ceiling Effect")
 * 4. Optional user-adjustable category weights (fixes "Bias")
 * 
 * This is a proposed replacement for severity-scoring.ts
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
  // If available, use the actual numeric score (0.0-1.0) for linear mapping
  confidence_score?: number | null
  // Context metadata for better scoring
  detail_level?: 'graphic' | 'moderate' | 'vague' | 'clinical' | null
  presence?: 'on_page' | 'off_page' | 'flashback' | 'referenced' | 'implied' | null
}

/**
 * Category sensitivity weights (can be made user-adjustable)
 * Default weights - can be overridden by user preferences
 */
export const DEFAULT_CATEGORY_WEIGHTS: Record<string, number> = {
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
 * Convert severity level to approximate numeric score
 * Used when confidence_score is not available
 */
function severityToScore(severity: 'mild' | 'moderate' | 'severe'): number {
  switch (severity) {
    case 'mild': return 0.45 // Middle of mild range (0.31-0.55)
    case 'moderate': return 0.68 // Middle of moderate range (0.56-0.80)
    case 'severe': return 0.90 // Middle of severe range (0.81-1.0)
  }
}

/**
 * Get the numeric score for a warning (0.0-1.0)
 * Uses confidence_score if available, otherwise estimates from severity
 */
function getWarningScore(warning: ContentWarning): number {
  // If we have an actual confidence score, use it
  if (warning.confidence_score != null && warning.confidence_score >= 0 && warning.confidence_score <= 1) {
    return warning.confidence_score
  }
  
  // Otherwise, estimate from severity level
  let baseScore = severityToScore(warning.severity)
  
  // Adjust based on detail level (if available)
  if (warning.detail_level) {
    switch (warning.detail_level) {
      case 'graphic':
        baseScore = Math.min(baseScore + 0.15, 1.0)
        break
      case 'moderate':
        baseScore = Math.min(baseScore + 0.05, 1.0)
        break
      case 'vague':
        baseScore = Math.max(baseScore - 0.1, 0.0)
        break
      case 'clinical':
        baseScore = Math.max(baseScore - 0.05, 0.0)
        break
    }
  }
  
  // Adjust based on presence (if available)
  if (warning.presence) {
    switch (warning.presence) {
      case 'on_page':
        baseScore = Math.min(baseScore + 0.1, 1.0)
        break
      case 'off_page':
        baseScore = Math.max(baseScore - 0.1, 0.0)
        break
      case 'flashback':
        baseScore = Math.min(baseScore + 0.05, 1.0)
        break
      case 'referenced':
        baseScore = Math.max(baseScore - 0.15, 0.0)
        break
      case 'implied':
        baseScore = Math.max(baseScore - 0.1, 0.0)
        break
    }
  }
  
  return Math.max(0.0, Math.min(1.0, baseScore))
}

/**
 * Calculate overall severity score for a book (IMPROVED VERSION)
 * 
 * Strategy: 
 * 1. LINEAR MAPPING: Use highest warning score directly (0.0-1.0 → 0-100)
 *    Fixes "Cliff Problem" - smooth transition instead of hard buckets
 * 
 * 2. VOLUME-AWARE WEIGHTED SUM: Logarithmic curve for multiple warnings
 *    Fixes "One Bad Apple" - single outlier can be detected and weighted
 *    Fixes "Ceiling Effect" - soft cap instead of hard clamp
 * 
 * 3. OUTLIER DETECTION: If one warning is much higher than others, reduce its impact
 *    Prevents single severe warning from dominating
 * 
 * @param warnings Array of content warnings
 * @param categoryWeights Optional custom weights (defaults to DEFAULT_CATEGORY_WEIGHTS)
 * @returns Overall severity score (0-150 range, but typically 0-120)
 */
export function calculateSeverityScoreV2(
  warnings: ContentWarning[],
  categoryWeights: Record<string, number> = DEFAULT_CATEGORY_WEIGHTS
): number {
  if (!warnings || warnings.length === 0) {
    return 0
  }

  // Get numeric scores for all warnings
  const warningScores = warnings.map(w => ({
    warning: w,
    score: getWarningScore(w),
    category: w.category_id || w.category || 'other'
  }))

  // FIX 1: LINEAR MAPPING instead of hard buckets
  // Find highest score and map linearly: 0.0-1.0 → 0-100
  const maxScore = Math.max(...warningScores.map(ws => ws.score))
  const primaryScore = maxScore * 100 // Smooth linear mapping

  // FIX 2: OUTLIER DETECTION
  // If one warning is significantly higher than others, it might be an outlier
  const scores = warningScores.map(ws => ws.score).sort((a, b) => b - a)
  const isOutlier = scores.length > 1 && scores[0] - scores[1] > 0.3 // 30% gap
  
  // If outlier detected, use average of top 2 instead of just max
  const effectiveMaxScore = isOutlier 
    ? (scores[0] * 0.7 + scores[1] * 0.3) // Weighted average favoring top
    : maxScore
  
  const adjustedPrimaryScore = effectiveMaxScore * 100

  // FIX 3: LOGARITHMIC NORMALIZATION for weighted sum
  // Calculate weighted sum of all warnings
  let weightedSum = 0
  warningScores.forEach(({ warning, score, category }) => {
    const categoryWeight = categoryWeights[category] || 1.0
    // Use the actual score (0.0-1.0) instead of discrete points
    const contribution = score * categoryWeight
    weightedSum += contribution
  })

  // Logarithmic curve: log(1 + x) / log(max) to create soft cap
  // This allows growth but with diminishing returns
  const maxPossibleSum = 10 * 1.5 // 10 severe warnings at 1.5x weight = 15
  const logNormalized = Math.log(1 + weightedSum) / Math.log(1 + maxPossibleSum) * 50
  
  // Alternative: Use square root for softer curve
  // const sqrtNormalized = Math.sqrt(weightedSum / maxPossibleSum) * 50
  
  const normalizedWeightedSum = Math.min(logNormalized, 50)

  // Final score: Primary (0-100) + Weighted Sum (0-50) = 0-150 range
  return adjustedPrimaryScore + normalizedWeightedSum
}

/**
 * Get severity level from score (same thresholds, but smoother distribution)
 */
export function getSeverityLevelFromScoreV2(score: number): 'none' | 'mild' | 'moderate' | 'severe' {
  if (score === 0) return 'none'
  if (score < 30) return 'mild'
  if (score < 80) return 'moderate'
  return 'severe'
}

/**
 * Compare two books by severity (for sorting)
 * Uses improved scoring algorithm
 */
export function compareBySeverityV2(
  a: { warnings: ContentWarning[] },
  b: { warnings: ContentWarning[] },
  categoryWeights?: Record<string, number>
): number {
  const scoreA = calculateSeverityScoreV2(a.warnings || [], categoryWeights)
  const scoreB = calculateSeverityScoreV2(b.warnings || [], categoryWeights)
  return scoreB - scoreA // Higher score = more severe = comes first
}

/**
 * Get user-customizable category weights
 * In a real implementation, this would load from user preferences
 */
export function getUserCategoryWeights(userId?: string): Record<string, number> {
  // TODO: Load from user preferences in database
  // For now, return defaults
  return DEFAULT_CATEGORY_WEIGHTS
}

/**
 * Example usage and comparison:
 * 
 * OLD SYSTEM:
 * - Warning at 0.80 → "moderate" → 50 points
 * - Warning at 0.81 → "severe" → 100 points
 * - Difference: 50 points for 0.01 difference
 * 
 * NEW SYSTEM:
 * - Warning at 0.80 → 80 points
 * - Warning at 0.81 → 81 points  
 * - Difference: 1 point for 0.01 difference (smooth!)
 * 
 * OLD SYSTEM:
 * - 1 severe warning → 100 points (always severe)
 * - 20 severe warnings → 100 points (same!)
 * 
 * NEW SYSTEM:
 * - 1 severe warning → ~90 points (may be moderate if outlier)
 * - 20 severe warnings → ~120 points (clearly severe, logarithmic growth)
 */

