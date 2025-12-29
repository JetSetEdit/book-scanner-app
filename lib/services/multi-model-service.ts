/**
 * Multi-Model Service
 * Runs multiple AI models (GPT-4o, Gemini) and combines/averages their outputs
 */

import { findBookAndGenerateWarnings } from '../content-warning-agent'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { getSeverityFromScore } from '../config/taxonomy-v2'

// Load env vars at runtime (Next.js serverless functions)
function getGeminiApiKey(): string | null {
  return process.env.GEMINI_API_KEY || null
}

export interface ModelResult {
  model: string
  content_warnings: any[]
  classification_rating?: string
  confidence: 'low' | 'medium' | 'high'
  reasoning: string
  timing: number
}

export interface CombinedResult {
  combined_warnings: any[]
  classification_rating?: string
  confidence: 'low' | 'medium' | 'high'
  model_results: ModelResult[]
  analysis: {
    agreement_score: number // 0-1, how much models agree
    unique_to_gpt4o: string[] // Categories only GPT-4o found
    unique_to_gemini: string[] // Categories only Gemini found
    severity_differences: Array<{
      category: string
      gpt4o_score: number
      gemini_score: number
      difference: number
    }>
    reasoning_insights: string
  }
}

/**
 * Generate warnings using Gemini
 */
async function generateWarningsWithGemini(
  isbn: string,
  bookTitle: string,
  bookAuthor: string,
  bookDescription?: string,
  bookCategories?: string[]
): Promise<{
  content_warnings: any[]
  classification_rating?: string
  confidence: 'low' | 'medium' | 'high'
  reasoning: string
}> {
  const apiKey = getGeminiApiKey()
  if (!apiKey) {
    console.warn('[Multi-Model] GEMINI_API_KEY not configured, returning empty result')
    return {
      content_warnings: [],
      confidence: 'low',
      reasoning: 'Gemini API key not configured. Please set GEMINI_API_KEY in environment variables to use multi-model analysis.'
    }
  }

  const genAI = new GoogleGenerativeAI(apiKey)
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })

  const instructions = `
You are an expert content warning generator for a book database. Analyze this book and generate content warnings based on Australian Classification Board standards.

Book Information:
- Title: ${bookTitle}
- Author: ${bookAuthor}
${bookDescription ? `- Description: ${bookDescription}` : '- Description: NOT PROVIDED'}
${bookCategories ? `- Categories: ${bookCategories.join(', ')}` : ''}
- ISBN: ${isbn}

## Instructions (Same as Hybrid Mode):
1. **Evidence-Based First**: Use verified information from book description, reviews, author sites
2. **Conservative Inference**: Only when evidence is insufficient, use genre-aware inference
3. **False Positive Checks**: Death ≠ Grief, Action ≠ Violence, Non-Fiction = Clinical

## Output Format (JSON):
{
  "content_warnings": [
    {
      "category_id": "mental_health" | "sexual_content" | "violence" | etc,
      "subcategory_id": "string (optional)",
      "description": "User-facing description",
      "score": 0.0-1.0,
      "reasoning": "Technical explanation",
      "presence": "on_page" | "off_page" | "flashback" | "referenced" | "implied",
      "detail_level": "graphic" | "moderate" | "vague" | "clinical",
      "is_spoiler": boolean
    }
  ],
  "classification_rating": "G" | "PG" | "M" | "MA15+" | "R18+",
  "confidence": "low" | "medium" | "high",
  "reasoning": "Overall reasoning"
}
`

  try {
    const result = await model.generateContent(instructions)
    const response = result.response
    const text = response.text()

    // Extract JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error('No JSON found in Gemini response')
    }

    const parsed = JSON.parse(jsonMatch[0])

    // Map to expected format
    const warnings = (parsed.content_warnings || []).map((w: any) => ({
      ...w,
      severity: getSeverityFromScore(w.score || 0),
      category: w.category_id,
      category_id: w.category_id || w.category
    }))

    return {
      content_warnings: warnings,
      classification_rating: parsed.classification_rating,
      confidence: parsed.confidence || 'medium',
      reasoning: parsed.reasoning || 'Gemini-generated analysis'
    }
  } catch (error) {
    console.error('Gemini error:', error)
    return {
      content_warnings: [],
      confidence: 'low',
      reasoning: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
  }
}

/**
 * Combine warnings from multiple models
 */
function combineWarnings(
  gpt4oWarnings: any[],
  geminiWarnings: any[]
): any[] {
  // Group warnings by category_id
  const categoryMap = new Map<string, any[]>()

  // Add GPT-4o warnings
  gpt4oWarnings.forEach(w => {
    const key = w.category_id || w.category || 'other'
    if (!categoryMap.has(key)) {
      categoryMap.set(key, [])
    }
    categoryMap.get(key)!.push({ ...w, source: 'gpt-4o' })
  })

  // Add Gemini warnings
  geminiWarnings.forEach(w => {
    const key = w.category_id || w.category || 'other'
    if (!categoryMap.has(key)) {
      categoryMap.set(key, [])
    }
    categoryMap.get(key)!.push({ ...w, source: 'gemini' })
  })

  // Combine warnings for each category
  const combined: any[] = []

  categoryMap.forEach((warnings, categoryId) => {
    if (warnings.length === 1) {
      // Only one model found this category - use it as-is
      combined.push({
        ...warnings[0],
        source: 'single',
        model_agreement: 'none'
      })
    } else {
      // Both models found this category - average the scores
      const scores = warnings.map(w => w.score || 0).filter(s => s > 0)
      const avgScore = scores.length > 0
        ? scores.reduce((a, b) => a + b, 0) / scores.length
        : 0

      // Use the more detailed description
      const descriptions = warnings.map(w => w.description || '').filter(d => d)
      const bestDescription = descriptions.reduce((a, b) => 
        a.length > b.length ? a : b
      , '')

      // Combine reasoning
      const reasoning = warnings.map(w => w.reasoning || '').filter(r => r).join(' | ')

      combined.push({
        category_id: categoryId,
        subcategory_id: warnings[0].subcategory_id || null,
        description: bestDescription || warnings[0].description,
        score: avgScore,
        severity: getSeverityFromScore(avgScore),
        reasoning: reasoning || `Combined analysis from ${warnings.length} models`,
        presence: warnings[0].presence || 'on_page',
        detail_level: warnings[0].detail_level || null,
        is_spoiler: warnings.some(w => w.is_spoiler) || false,
        source: 'combined',
        model_agreement: scores.length === 2 && Math.abs(scores[0] - scores[1]) < 0.2 ? 'high' : 'low',
        original_scores: warnings.map(w => ({ model: w.source, score: w.score }))
      })
    }
  })

  return combined
}

/**
 * Analyze differences between model results
 */
function analyzeDifferences(
  gpt4oResult: ModelResult,
  geminiResult: ModelResult
): CombinedResult['analysis'] {
  const gpt4oCategories = new Set(
    gpt4oResult.content_warnings.map(w => w.category_id || w.category)
  )
  const geminiCategories = new Set(
    geminiResult.content_warnings.map(w => w.category_id || w.category)
  )

  const commonCategories = Array.from(gpt4oCategories).filter(c => 
    geminiCategories.has(c)
  )
  const uniqueToGpt4o = Array.from(gpt4oCategories).filter(c => 
    !geminiCategories.has(c)
  )
  const uniqueToGemini = Array.from(geminiCategories).filter(c => 
    !gpt4oCategories.has(c)
  )

  // Calculate agreement score (0-1)
  const totalCategories = new Set([...gpt4oCategories, ...geminiCategories]).size
  const agreementScore = totalCategories > 0 
    ? commonCategories.length / totalCategories 
    : 0

  // Find severity differences for common categories
  const severityDifferences: CombinedResult['analysis']['severity_differences'] = []
  
  commonCategories.forEach(category => {
    const gpt4oWarning = gpt4oResult.content_warnings.find(
      w => (w.category_id || w.category) === category
    )
    const geminiWarning = geminiResult.content_warnings.find(
      w => (w.category_id || w.category) === category
    )

    if (gpt4oWarning && geminiWarning) {
      const gpt4oScore = gpt4oWarning.score || 0
      const geminiScore = geminiWarning.score || 0
      const difference = Math.abs(gpt4oScore - geminiScore)

      if (difference > 0.1) { // Only report significant differences
        severityDifferences.push({
          category,
          gpt4o_score: gpt4oScore,
          gemini_score: geminiScore,
          difference
        })
      }
    }
  })

  // Generate reasoning insights
  const insights: string[] = []
  
  if (agreementScore > 0.7) {
    insights.push(`High agreement (${Math.round(agreementScore * 100)}%) - both models found similar content warnings.`)
  } else if (agreementScore > 0.4) {
    insights.push(`Moderate agreement (${Math.round(agreementScore * 100)}%) - some differences in what each model detected.`)
  } else {
    insights.push(`Low agreement (${Math.round(agreementScore * 100)}%) - significant differences between models.`)
  }

  if (uniqueToGpt4o.length > 0) {
    insights.push(`GPT-4o uniquely found: ${uniqueToGpt4o.join(', ')}`)
  }
  if (uniqueToGemini.length > 0) {
    insights.push(`Gemini uniquely found: ${uniqueToGemini.join(', ')}`)
  }

  if (severityDifferences.length > 0) {
    insights.push(`Severity differences in ${severityDifferences.length} categories - averaging scores.`)
  }

  return {
    agreement_score: agreementScore,
    unique_to_gpt4o: uniqueToGpt4o,
    unique_to_gemini: uniqueToGemini,
    severity_differences: severityDifferences,
    reasoning_insights: insights.join(' ')
  }
}

/**
 * Run both models and combine results
 */
export async function runMultiModelAnalysis(
  isbn: string,
  bookTitle: string,
  bookAuthor: string,
  bookDescription?: string,
  bookCategories?: string[]
): Promise<CombinedResult> {
  const startTime = Date.now()

  // Run both models in parallel with error handling
  const [gpt4oResult, geminiResult] = await Promise.allSettled([
    (async () => {
      const start = Date.now()
      try {
        const result = await findBookAndGenerateWarnings(isbn, 'gpt-4o', 'hybrid')
        return {
          model: 'gpt-4o',
          content_warnings: result.content_warnings || [],
          classification_rating: result.classification_rating,
          confidence: result.confidence,
          reasoning: result.reasoning,
          timing: Date.now() - start
        } as ModelResult
      } catch (error) {
        console.error('[Multi-Model] GPT-4o error:', error)
        return {
          model: 'gpt-4o',
          content_warnings: [],
          confidence: 'low' as const,
          reasoning: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
          timing: Date.now() - start
        } as ModelResult
      }
    })(),
    (async () => {
      const start = Date.now()
      try {
        const result = await generateWarningsWithGemini(
          isbn,
          bookTitle,
          bookAuthor,
          bookDescription,
          bookCategories
        )
        return {
          model: 'gemini-2.5-flash',
          content_warnings: result.content_warnings || [],
          classification_rating: result.classification_rating,
          confidence: result.confidence,
          reasoning: result.reasoning,
          timing: Date.now() - start
        } as ModelResult
      } catch (error) {
        console.error('[Multi-Model] Gemini error:', error)
        return {
          model: 'gemini-2.5-flash',
          content_warnings: [],
          confidence: 'low' as const,
          reasoning: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
          timing: Date.now() - start
        } as ModelResult
      }
    })()
  ]).then(results => [
    results[0].status === 'fulfilled' ? results[0].value : {
      model: 'gpt-4o',
      content_warnings: [],
      confidence: 'low' as const,
      reasoning: `Failed: ${results[0].status === 'rejected' ? results[0].reason : 'Unknown error'}`,
      timing: 0
    } as ModelResult,
    results[1].status === 'fulfilled' ? results[1].value : {
      model: 'gemini-2.5-flash',
      content_warnings: [],
      confidence: 'low' as const,
      reasoning: `Failed: ${results[1].status === 'rejected' ? results[1].reason : 'Unknown error'}`,
      timing: 0
    } as ModelResult
  ])

  // Combine warnings
  const combinedWarnings = combineWarnings(
    gpt4oResult.content_warnings,
    geminiResult.content_warnings
  )

  // Analyze differences
  const analysis = analyzeDifferences(gpt4oResult, geminiResult)

  // Determine combined classification (use more restrictive)
  const ratings = ['G', 'PG', 'M', 'MA15+', 'R18+']
  const gpt4oIndex = gpt4oResult.classification_rating 
    ? ratings.indexOf(gpt4oResult.classification_rating)
    : -1
  const geminiIndex = geminiResult.classification_rating
    ? ratings.indexOf(geminiResult.classification_rating)
    : -1
  const combinedRating = gpt4oIndex >= 0 && geminiIndex >= 0
    ? ratings[Math.max(gpt4oIndex, geminiIndex)] // More restrictive
    : gpt4oResult.classification_rating || geminiResult.classification_rating

  // Combined confidence (use lower of the two)
  const confidenceLevels = ['low', 'medium', 'high']
  const gpt4oConfIndex = confidenceLevels.indexOf(gpt4oResult.confidence)
  const geminiConfIndex = confidenceLevels.indexOf(geminiResult.confidence)
  const combinedConfidence = gpt4oConfIndex <= geminiConfIndex
    ? gpt4oResult.confidence
    : geminiResult.confidence

  return {
    combined_warnings: combinedWarnings,
    classification_rating: combinedRating,
    confidence: combinedConfidence,
    model_results: [gpt4oResult, geminiResult],
    analysis
  }
}

