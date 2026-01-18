/**
 * Adversarial Validation: Models debate each other's warnings
 * 
 * Each model reviews the other's warnings and provides feedback on:
 * - Whether the other model is too restrictive (missing warnings)
 * - Whether the other model is too lenient (over-warning)
 * - Justification for their positions
 * 
 * This creates a "debate" that helps refine the final warnings.
 */

import OpenAI from 'openai'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { EnhancedContentWarning } from '../config/taxonomy-context'
import { WARNING_CATEGORIES, TAXONOMY_VERSION, MODEL_VERSION } from '../config/taxonomy-v2'
// Build taxonomy context (duplicated from multi-model-analysis since it's not exported)
function buildTaxonomyContext(): string {
  const categories = WARNING_CATEGORIES.map(cat => {
    const subcats = cat.subcategories.map(sub =>
      `    - ${cat.id}.${sub.id}: ${sub.userLabel} (${sub.shortDescription}) [Default: ${sub.defaultSeverityHint || 'none'}]`
    ).join('\n')

    return `  ${cat.id} (${cat.userLabel}):\n${subcats}`
  }).join('\n\n')

  return categories
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '')

interface BookMetadata {
  title: string
  author: string
  description: string
  isbn: string
}

type ProgressCallback = (message: string) => void

interface AdversarialFeedback {
  subcategory_id: string
  critique_type: 'too_restrictive' | 'too_lenient' | 'severity_disagreement' | 'agree'
  reasoning: string
  suggested_action: 'add' | 'remove' | 'adjust_severity' | 'keep'
  suggested_severity?: 'mild' | 'moderate' | 'severe'
  confidence: number // 0-1
}

interface AdversarialValidationResult {
  openai_critiques_gemini: AdversarialFeedback[]
  gemini_critiques_openai: AdversarialFeedback[]
  refined_warnings: EnhancedContentWarning[]
}

/**
 * Have OpenAI critique Gemini's warnings
 */
async function openaiCritiquesGemini(
  geminiWarnings: EnhancedContentWarning[],
  openaiWarnings: EnhancedContentWarning[],
  metadata: BookMetadata,
  onProgress?: ProgressCallback
): Promise<AdversarialFeedback[]> {
  if (geminiWarnings.length === 0) {
    return []
  }

  onProgress?.('💬 OpenAI reviewing Gemini\'s warnings...')

  const taxonomyContext = buildTaxonomyContext()
  
  const geminiWarningsList = geminiWarnings.map((w, idx) => {
    const evidenceText = w.evidence[0]?.excerpt || 'No evidence provided'
    return `${idx + 1}. ${w.subcategory_id}
   Description: ${w.description || 'N/A'}
   Severity: ${w.severity}
   Evidence: "${evidenceText.substring(0, 150)}${evidenceText.length > 150 ? '...' : ''}"`
  }).join('\n\n')

  const openaiWarningsList = openaiWarnings.length > 0
    ? openaiWarnings.map((w, idx) => `${idx + 1}. ${w.subcategory_id} (${w.severity})`).join('\n')
    : 'None identified'

  const prompt = `You are reviewing another AI model's content warnings for the book "${metadata.title}" by ${metadata.author}.

Book Description:
${metadata.description}

**EXCEPTION FOR CANONICAL TEXTS**:
If the book is a literary classic (e.g. Jasper Jones, To Kill a Mockingbird), warnings inferred from "Canon Knowledge" (literary consensus) are VALID even if not explicitly in the blurb. Do NOT critique them as "unsupported" if they match the book's known themes (Suicide, Racism, Police Misconduct).

Taxonomy:
${taxonomyContext}

**Gemini's Warnings (to critique):**
${geminiWarningsList}

**Your Warnings (for reference):**
${openaiWarningsList}

Your task: Critique Gemini's warnings. For each warning, determine:

1. **Too Lenient?** Did Gemini miss important warnings that should be included? (e.g., "Gemini missed sexual violence that is clearly present")
2. **Too Restrictive?** Did Gemini include warnings that aren't well-supported? (e.g., "Gemini flagged mild romance as moderate sexual content")
3. **Severity Disagreement?** Do you disagree with Gemini's severity assessment? (e.g., "This should be severe, not moderate")
4. **Agree?** Do you agree with Gemini's assessment?

For each warning, provide:
- critique_type: "too_restrictive" | "too_lenient" | "severity_disagreement" | "agree"
- reasoning: Explain your position (2-3 sentences)
- suggested_action: "add" | "remove" | "adjust_severity" | "keep"
- suggested_severity: Only if adjusting severity
- confidence: 0-1 (how confident are you in this critique?)

Return JSON:
{
  "critiques": [
    {
      "subcategory_id": "category.subcategory",
      "critique_type": "too_restrictive",
      "reasoning": "Gemini flagged this as moderate, but the evidence only shows mild themes. This seems like an over-warning.",
      "suggested_action": "adjust_severity",
      "suggested_severity": "mild",
      "confidence": 0.8
    }
  ]
}

Be balanced and evidence-based. Don't just agree or disagree - provide thoughtful critique that helps improve accuracy.`

  try {
    const isGpt5 = MODEL_VERSION.includes('gpt-5') || MODEL_VERSION.includes('o1') || MODEL_VERSION.includes('o3')
    
    const response = await openai.chat.completions.create({
      model: MODEL_VERSION,
      messages: [
        {
          role: 'system',
          content: 'You are a content warning critic. Your job is to review another AI model\'s warnings and provide thoughtful, evidence-based critique. Be balanced: point out both over-warnings and missed warnings. Help improve accuracy through constructive criticism.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      response_format: { type: 'json_object' },
      ...(isGpt5 ? { max_completion_tokens: 2000 } : { temperature: 0.4, max_tokens: 2000 })
    })

    const content = response.choices[0].message.content
    if (!content) {
      throw new Error('No response from OpenAI')
    }

    const parsed = JSON.parse(content)
    return parsed.critiques || []
  } catch (error) {
    console.error('[Adversarial Validation] OpenAI critique failed:', error)
    return []
  }
}

/**
 * Have Gemini critique OpenAI's warnings
 */
async function geminiCritiquesOpenAI(
  openaiWarnings: EnhancedContentWarning[],
  geminiWarnings: EnhancedContentWarning[],
  metadata: BookMetadata,
  onProgress?: ProgressCallback
): Promise<AdversarialFeedback[]> {
  if (openaiWarnings.length === 0) {
    return []
  }

  onProgress?.('💬 Gemini reviewing OpenAI\'s warnings...')

  const taxonomyContext = buildTaxonomyContext()
  
  const openaiWarningsList = openaiWarnings.map((w, idx) => {
    const evidenceText = w.evidence[0]?.excerpt || 'No evidence provided'
    return `${idx + 1}. ${w.subcategory_id}
   Description: ${w.description || 'N/A'}
   Severity: ${w.severity}
   Evidence: "${evidenceText.substring(0, 150)}${evidenceText.length > 150 ? '...' : ''}"`
  }).join('\n\n')

  const geminiWarningsList = geminiWarnings.length > 0
    ? geminiWarnings.map((w, idx) => `${idx + 1}. ${w.subcategory_id} (${w.severity})`).join('\n')
    : 'None identified'

  const prompt = `You are reviewing another AI model's content warnings for the book "${metadata.title}" by ${metadata.author}.

Book Description:
${metadata.description}

**EXCEPTION FOR CANONICAL TEXTS**:
If the book is a literary classic (e.g. Jasper Jones, To Kill a Mockingbird), warnings inferred from "Canon Knowledge" (literary consensus) are VALID even if not explicitly in the blurb. Do NOT critique them as "unsupported" if they match the book's known themes (Suicide, Racism, Police Misconduct).

Taxonomy:
${taxonomyContext}

**OpenAI's Warnings (to critique):**
${openaiWarningsList}

**Your Warnings (for reference):**
${geminiWarningsList}

Your task: Critique OpenAI's warnings. For each warning, determine:

1. **Too Lenient?** Did OpenAI miss important warnings that should be included? (e.g., "OpenAI missed sexual violence that is clearly present")
2. **Too Restrictive?** Did OpenAI include warnings that aren't well-supported? (e.g., "OpenAI flagged mild romance as moderate sexual content")
3. **Severity Disagreement?** Do you disagree with OpenAI's severity assessment? (e.g., "This should be severe, not moderate")
4. **Agree?** Do you agree with OpenAI's assessment?

For each warning, provide:
- critique_type: "too_restrictive" | "too_lenient" | "severity_disagreement" | "agree"
- reasoning: Explain your position (2-3 sentences)
- suggested_action: "add" | "remove" | "adjust_severity" | "keep"
- suggested_severity: Only if adjusting severity
- confidence: 0-1 (how confident are you in this critique?)

Return JSON:
{
  "critiques": [
    {
      "subcategory_id": "category.subcategory",
      "critique_type": "too_lenient",
      "reasoning": "OpenAI missed explicit sexual content that is clearly present in the description. The book contains on-page sex scenes.",
      "suggested_action": "add",
      "confidence": 0.9
    }
  ]
}

Be balanced and evidence-based. Don't just agree or disagree - provide thoughtful critique that helps improve accuracy.`

  try {
    let model
    try {
      model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })
    } catch (e) {
      try {
        model = genAI.getGenerativeModel({ model: 'gemini-3-flash' })
      } catch (e2) {
        model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })
      }
    }

    const result = await model.generateContent(prompt)
    const response = result.response
    const text = response.text()

    // Extract JSON
    let jsonText = text
    const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/) || text.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      jsonText = jsonMatch[1] || jsonMatch[0]
    }

    const parsed = JSON.parse(jsonText)
    return parsed.critiques || []
  } catch (error) {
    console.error('[Adversarial Validation] Gemini critique failed:', error)
    return []
  }
}

/**
 * Apply adversarial feedback to refine warnings
 */
function applyAdversarialFeedback(
  warnings: EnhancedContentWarning[],
  critiques: AdversarialFeedback[]
): EnhancedContentWarning[] {
  const refined: EnhancedContentWarning[] = []
  const warningMap = new Map(warnings.map(w => [w.subcategory_id, w]))

  // Process critiques with high confidence first
  const sortedCritiques = critiques.sort((a, b) => b.confidence - a.confidence)

  for (const critique of sortedCritiques) {
    const warning = warningMap.get(critique.subcategory_id)
    
    if (!warning) {
      // Model suggested adding a warning - skip for now (would need to generate it)
      continue
    }

    switch (critique.suggested_action) {
      case 'remove':
        // Remove warning if confidence is high
        if (critique.confidence >= 0.7) {
          warningMap.delete(critique.subcategory_id)
          console.log(`[Adversarial] Removed ${critique.subcategory_id}: ${critique.reasoning}`)
        }
        break
      
      case 'adjust_severity':
        // Adjust severity if confidence is high
        if (critique.confidence >= 0.6 && critique.suggested_severity) {
          warning.severity = critique.suggested_severity
          console.log(`[Adversarial] Adjusted ${critique.subcategory_id} to ${critique.suggested_severity}: ${critique.reasoning}`)
        }
        break
      
      case 'keep':
        // Keep as-is (no change needed)
        break
    }
  }

  // Return refined warnings
  return Array.from(warningMap.values())
}

/**
 * Run adversarial validation: models critique each other's warnings
 */
export async function runAdversarialValidation(
  openaiWarnings: EnhancedContentWarning[],
  geminiWarnings: EnhancedContentWarning[],
  metadata: BookMetadata,
  onProgress?: ProgressCallback
): Promise<AdversarialValidationResult> {
  // Skip if one model failed
  if (openaiWarnings.length === 0 && geminiWarnings.length === 0) {
    return {
      openai_critiques_gemini: [],
      gemini_critiques_openai: [],
      refined_warnings: []
    }
  }

  onProgress?.('💬 Models debating each other\'s warnings...')

  // Run critiques in parallel
  const [openaiCritiques, geminiCritiques] = await Promise.allSettled([
    geminiWarnings.length > 0 
      ? openaiCritiquesGemini(geminiWarnings, openaiWarnings, metadata, onProgress)
      : Promise.resolve([]),
    openaiWarnings.length > 0
      ? geminiCritiquesOpenAI(openaiWarnings, geminiWarnings, metadata, onProgress)
      : Promise.resolve([])
  ])

  const openaiCritiquesResult = openaiCritiques.status === 'fulfilled' ? openaiCritiques.value : []
  const geminiCritiquesResult = geminiCritiques.status === 'fulfilled' ? geminiCritiques.value : []

  // Apply feedback to refine warnings
  // Start with combined warnings, then apply critiques
  const allWarnings = [...openaiWarnings, ...geminiWarnings]
  const uniqueWarnings = Array.from(
    new Map(allWarnings.map(w => [w.subcategory_id, w])).values()
  )

  // Apply OpenAI's critiques of Gemini (affects Gemini warnings)
  const geminiWarningsRefined = applyAdversarialFeedback(
    geminiWarnings,
    openaiCritiquesResult
  )

  // Apply Gemini's critiques of OpenAI (affects OpenAI warnings)
  const openaiWarningsRefined = applyAdversarialFeedback(
    openaiWarnings,
    geminiCritiquesResult
  )

  // Recombine refined warnings
  const refinedMap = new Map<string, EnhancedContentWarning>()
  openaiWarningsRefined.forEach(w => refinedMap.set(w.subcategory_id, w))
  geminiWarningsRefined.forEach(w => refinedMap.set(w.subcategory_id, w))
  const refinedWarnings = Array.from(refinedMap.values())

  // Log summary
  const openaiTooLenient = openaiCritiquesResult.filter(c => c.critique_type === 'too_lenient').length
  const openaiTooRestrictive = openaiCritiquesResult.filter(c => c.critique_type === 'too_restrictive').length
  const geminiTooLenient = geminiCritiquesResult.filter(c => c.critique_type === 'too_lenient').length
  const geminiTooRestrictive = geminiCritiquesResult.filter(c => c.critique_type === 'too_restrictive').length

  console.log('[Adversarial Validation]', {
    openai_critiques: {
      too_lenient: openaiTooLenient,
      too_restrictive: openaiTooRestrictive,
      total: openaiCritiquesResult.length
    },
    gemini_critiques: {
      too_lenient: geminiTooLenient,
      too_restrictive: geminiTooRestrictive,
      total: geminiCritiquesResult.length
    }
  })

  if (openaiCritiquesResult.length > 0 || geminiCritiquesResult.length > 0) {
    onProgress?.('✓ Adversarial validation complete - warnings refined based on cross-critique')
  }

  return {
    openai_critiques_gemini: openaiCritiquesResult,
    gemini_critiques_openai: geminiCritiquesResult,
    refined_warnings: refinedWarnings
  }
}

