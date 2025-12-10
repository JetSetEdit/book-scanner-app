/**
 * Content Review Agent
 * 
 * Detects and fixes common issues in content warnings:
 * 1. Misclassification - Moderate warnings marked as severe
 * 2. Over-classification - AI assigned severe when it should be moderate
 * 3. Duplicate warnings - Same warning counted multiple times
 */

import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types/supabase'
import { getSeverityFromScore } from '@/lib/config/taxonomy-v2'

type SupabaseClient = ReturnType<typeof createClient<Database>>

export interface WarningIssue {
  type: 'duplicate' | 'misclassification' | 'over_classification'
  severity: 'error' | 'warning' | 'info'
  book_id: string
  book_title: string
  book_isbn: string
  warning_ids: string[]
  category_id?: string
  subcategory_id?: string
  current_severity?: string
  expected_severity?: string
  description: string
  recommendation?: string
}

export interface ReviewResult {
  book_id: string
  book_title: string
  book_isbn: string
  total_warnings: number
  issues: WarningIssue[]
  score_before: number
  score_after?: number
}

/**
 * Detect duplicate warnings for a book
 * Duplicates are warnings with:
 * - Same category_id
 * - Same subcategory_id (if both have one)
 * - Similar descriptions (fuzzy match)
 */
export function detectDuplicates(
  warnings: Array<{
    id: string
    category_id: string | null
    subcategory_id: string | null
    description: string
    severity: string
  }>
): WarningIssue[] {
  const issues: WarningIssue[] = []
  const seen = new Map<string, string[]>() // key -> warning IDs

  for (const warning of warnings) {
    // Create a key based on category + subcategory
    const categoryKey = warning.category_id || 'unknown'
    const subcategoryKey = warning.subcategory_id || 'none'
    const key = `${categoryKey}:${subcategoryKey}`

    // Check for exact duplicates (same category/subcategory)
    if (seen.has(key)) {
      const existingIds = seen.get(key)!
      // Check if descriptions are very similar (simple check)
      const existingWarning = warnings.find(w => w.id === existingIds[0])
      if (existingWarning) {
        const similarity = calculateSimilarity(
          warning.description.toLowerCase(),
          existingWarning.description.toLowerCase()
        )
        
        // If descriptions are >80% similar, consider duplicate
        if (similarity > 0.8) {
          issues.push({
            type: 'duplicate',
            severity: 'error',
            book_id: '', // Will be filled by caller
            book_title: '', // Will be filled by caller
            book_isbn: '', // Will be filled by caller
            warning_ids: [...existingIds, warning.id],
            category_id: warning.category_id || undefined,
            subcategory_id: warning.subcategory_id || undefined,
            description: `Duplicate warnings: "${warning.description}" and "${existingWarning.description}"`,
            recommendation: `Remove duplicate warning ID: ${warning.id}`
          })
        }
      }
      seen.get(key)!.push(warning.id)
    } else {
      seen.set(key, [warning.id])
    }
  }

  return issues
}

/**
 * Simple similarity calculation (Jaccard similarity on words)
 */
function calculateSimilarity(str1: string, str2: string): number {
  const words1 = new Set(str1.split(/\s+/).filter(w => w.length > 2))
  const words2 = new Set(str2.split(/\s+/).filter(w => w.length > 2))
  
  const intersection = new Set([...words1].filter(x => words2.has(x)))
  const union = new Set([...words1, ...words2])
  
  return intersection.size / union.size
}

/**
 * Detect misclassification - severity doesn't match the score
 * If a warning has a score < 0.56 but severity is "moderate" or "severe"
 * Or if score > 0.80 but severity is "mild" or "moderate"
 */
export function detectMisclassification(
  warnings: Array<{
    id: string
    severity: string
    score: number | null
    category_id: string | null
    description: string
  }>
): WarningIssue[] {
  // Skip if no score available (can't detect misclassification without score)
  if (!warnings.some(w => w.score !== null)) {
    return []
  }
  const issues: WarningIssue[] = []

  for (const warning of warnings) {
    if (warning.score === null) continue

    const expectedSeverity = getSeverityFromScore(warning.score)
    const actualSeverity = warning.severity

    // Check if severity matches score
    if (expectedSeverity !== actualSeverity && expectedSeverity !== 'none') {
      issues.push({
        type: 'misclassification',
        severity: 'warning',
        book_id: '', // Will be filled by caller
        book_title: '', // Will be filled by caller
        book_isbn: '', // Will be filled by caller
        warning_ids: [warning.id],
        category_id: warning.category_id || undefined,
        current_severity: actualSeverity,
        expected_severity: expectedSeverity,
        description: `Severity mismatch: score ${warning.score.toFixed(2)} suggests "${expectedSeverity}" but marked as "${actualSeverity}"`,
        recommendation: `Update severity from "${actualSeverity}" to "${expectedSeverity}"`
      })
    }
  }

  return issues
}

/**
 * Detect over-classification - severe warnings that should be moderate
 * Uses heuristics based on description and category
 */
export function detectOverClassification(
  warnings: Array<{
    id: string
    severity: string
    score: number | null
    category_id: string | null
    subcategory_id: string | null
    description: string
    presence?: string | null
    detail_level?: string | null
  }>
): WarningIssue[] {
  const issues: WarningIssue[] = []

  for (const warning of warnings) {
    // Only check warnings marked as "severe"
    if (warning.severity !== 'severe') continue

    // Heuristics for over-classification:
    let shouldBeModerate = false
    let reason = ''

    // 1. Check if presence is "referenced" or "implied" - these shouldn't be severe
    if (warning.presence === 'referenced' || warning.presence === 'implied') {
      shouldBeModerate = true
      reason = `Content is ${warning.presence}, not directly shown`
    }

    // 2. Check if detail_level is "vague" or "clinical" - these shouldn't be severe
    if (warning.detail_level === 'vague' || warning.detail_level === 'clinical') {
      shouldBeModerate = true
      reason = `Detail level is ${warning.detail_level}, not graphic`
    }

    // 3. Check description keywords that suggest moderate, not severe
    const descLower = warning.description.toLowerCase()
    const moderateKeywords = [
      'mentioned', 'discussed', 'referenced', 'past event', 'historical',
      'implied', 'suggested', 'alluded to', 'hinted at', 'vague',
      'brief', 'minimal', 'off-page', 'off-screen', 'near death experience'
    ]
    
    if (moderateKeywords.some(keyword => descLower.includes(keyword))) {
      shouldBeModerate = true
      reason = 'Description suggests content is referenced/implied, not graphic'
    }
    
    // 3b. Specific case: "Near death experience" in romance/contemporary fiction should be moderate
    if (descLower.includes('near death experience') && 
        (warning.category_id === 'violence' || warning.category_id === 'death_or_grief')) {
      shouldBeModerate = true
      reason = 'Near death experience in contemporary fiction is typically moderate, not graphic'
    }

    // 4. Check score - if score < 0.81, it shouldn't be severe
    if (warning.score !== null && warning.score < 0.81) {
      shouldBeModerate = true
      reason = `Score ${warning.score.toFixed(2)} is below severe threshold (0.81)`
    }

    // 5. Category-specific checks
    if (warning.category_id === 'language' && warning.severity === 'severe') {
      // Language should rarely be severe unless it's slurs/hate speech
      if (!descLower.includes('slur') && !descLower.includes('hate speech')) {
        shouldBeModerate = true
        reason = 'Language warnings should only be severe for slurs/hate speech'
      }
    }

    if (shouldBeModerate) {
      issues.push({
        type: 'over_classification',
        severity: 'warning',
        book_id: '', // Will be filled by caller
        book_title: '', // Will be filled by caller
        book_isbn: '', // Will be filled by caller
        warning_ids: [warning.id],
        category_id: warning.category_id || undefined,
        subcategory_id: warning.subcategory_id || undefined,
        current_severity: 'severe',
        expected_severity: 'moderate',
        description: `Over-classified as severe: ${warning.description}`,
        recommendation: `Consider downgrading to moderate. Reason: ${reason}`
      })
    }
  }

  return issues
}

/**
 * Review all warnings for a book
 */
export async function reviewBookWarnings(
  supabase: SupabaseClient,
  bookId: string
): Promise<ReviewResult | null> {
  // Fetch book and warnings
  const { data: book } = await supabase
    .from('books')
    .select('id, title, isbn')
    .eq('id', bookId)
    .single()

  if (!book) return null

  const { data: warnings, error: warningsError } = await supabase
    .from('content_warnings')
    .select('id, category_id, subcategory_id, severity, description, confidence_score, presence, detail_level')
    .eq('book_id', bookId)

  if (warningsError) {
    console.error(`Error fetching warnings for book ${bookId}:`, warningsError)
  }

  // Use confidence_score as score (score column doesn't exist in DB)
  const warningsWithScore = warnings?.map(w => ({
    ...w,
    score: w.confidence_score ?? null
  })) || []

  if (!warningsWithScore || warningsWithScore.length === 0) {
    return {
      book_id: book.id,
      book_title: book.title,
      book_isbn: book.isbn,
      total_warnings: 0,
      issues: [],
      score_before: 0
    }
  }

  // Calculate current score
  const { calculateSeverityScore } = await import('@/lib/utils/severity-scoring')
  const scoreBefore = calculateSeverityScore(
    warningsWithScore.map(w => ({
      severity: w.severity as 'mild' | 'moderate' | 'severe',
      category_id: w.category_id || undefined,
      category: w.category_id || undefined
    }))
  )

  // Detect all issues
  const duplicateIssues = detectDuplicates(warningsWithScore.map(w => ({
    id: w.id,
    category_id: w.category_id,
    subcategory_id: w.subcategory_id,
    description: w.description,
    severity: w.severity
  }))).map(issue => ({
    ...issue,
    book_id: book.id,
    book_title: book.title,
    book_isbn: book.isbn
  }))

  const misclassificationIssues = detectMisclassification(warningsWithScore.map(w => ({
    id: w.id,
    severity: w.severity,
    score: w.score,
    category_id: w.category_id,
    description: w.description
  }))).map(issue => ({
    ...issue,
    book_id: book.id,
    book_title: book.title,
    book_isbn: book.isbn
  }))

  const overClassificationIssues = detectOverClassification(warningsWithScore.map(w => ({
    id: w.id,
    severity: w.severity,
    score: w.score,
    category_id: w.category_id,
    subcategory_id: w.subcategory_id,
    description: w.description,
    presence: w.presence,
    detail_level: w.detail_level
  }))).map(issue => ({
    ...issue,
    book_id: book.id,
    book_title: book.title,
    book_isbn: book.isbn
  }))

  const allIssues = [...duplicateIssues, ...misclassificationIssues, ...overClassificationIssues]

  return {
    book_id: book.id,
    book_title: book.title,
    book_isbn: book.isbn,
    total_warnings: warningsWithScore.length,
    issues: allIssues,
    score_before: scoreBefore
  }
}

/**
 * Review all books in the database
 */
export async function reviewAllBooks(
  supabase: SupabaseClient,
  limit?: number,
  onlyWithIssues: boolean = false
): Promise<ReviewResult[]> {
  const { data: books } = await supabase
    .from('books')
    .select('id')
    .limit(limit || 1000)

  if (!books) return []

  const results: ReviewResult[] = []
  
  for (const book of books) {
    const result = await reviewBookWarnings(supabase, book.id)
    if (result) {
      if (!onlyWithIssues || result.issues.length > 0) {
        results.push(result)
      }
    }
  }

  return results
}

/**
 * Apply fixes to warnings based on review results
 */
export async function applyFixes(
  supabase: SupabaseClient,
  reviewResult: ReviewResult,
  dryRun: boolean = true
): Promise<{ fixed: number; errors: number }> {
  let fixed = 0
  let errors = 0

  for (const issue of reviewResult.issues) {
    try {
      if (issue.type === 'duplicate' && issue.warning_ids.length > 1) {
        // Keep the first warning, delete duplicates
        const duplicates = issue.warning_ids.slice(1)
        if (!dryRun) {
          const { error } = await supabase
            .from('content_warnings')
            .delete()
            .in('id', duplicates)
          
          if (error) {
            errors++
            continue
          }
        }
        fixed += duplicates.length
      } else if (issue.type === 'misclassification' && issue.expected_severity) {
        // Update severity to match score
        if (!dryRun) {
          const { error } = await supabase
            .from('content_warnings')
            .update({ severity: issue.expected_severity })
            .eq('id', issue.warning_ids[0])
          
          if (error) {
            errors++
            continue
          }
        }
        fixed++
      } else if (issue.type === 'over_classification' && issue.expected_severity) {
        // Downgrade severity from severe to moderate
        if (!dryRun) {
          const { error } = await supabase
            .from('content_warnings')
            .update({ severity: issue.expected_severity })
            .eq('id', issue.warning_ids[0])
          
          if (error) {
            errors++
            continue
          }
        }
        fixed++
      }
    } catch (error) {
      errors++
      console.error(`Error fixing issue ${issue.type}:`, error)
    }
  }

  return { fixed, errors }
}

