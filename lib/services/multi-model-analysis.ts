/**
 * Multi-Model Analysis Service
 * 
 * Analyzes books using both OpenAI and Gemini with Taxonomy v2.5.0
 * Combines results and provides progress updates
 */

import OpenAI from 'openai'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { WARNING_CATEGORIES, TAXONOMY_VERSION, MODEL_VERSION } from '../config/taxonomy-v2'
import { ContextModifier, EvidenceSpan, EnhancedContentWarning } from '../config/taxonomy-context'
import { buildSeveritySignals, computeSeverityFromSignals } from '../utils/severity-computation'
import { isActualSexualViolence } from '../utils/sexual-violence-evaluation'
import { createClient } from '@supabase/supabase-js'

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

function buildTaxonomyContext(): string {
  const categories = WARNING_CATEGORIES.map(cat => {
    const subcats = cat.subcategories.map(sub => 
      `    - ${cat.id}.${sub.id}: ${sub.userLabel} (${sub.shortDescription}) [Default: ${sub.defaultSeverityHint || 'none'}]`
    ).join('\n')
    
    return `  ${cat.id} (${cat.userLabel}):\n${subcats}`
  }).join('\n\n')
  
  return categories
}

function buildContextModifiersList(): string {
  return `
Context Modifiers (add nuance):
  - historical_context: Content appears in historical setting
  - quoted_or_discussed: Content is quoted/discussed, not directly depicted
  - character_held_bias: Bias held by character, not narrative
  - condemned_by_narrative: Content explicitly condemned
  - endorsed_by_narrative: Content endorsed/normalized (rare)
  - educational_or_analytical: Educational/informational context
  - satire_or_parody: Satirical context
`
}

async function analyzeWithOpenAI(
  metadata: BookMetadata,
  onProgress?: ProgressCallback
): Promise<EnhancedContentWarning[]> {
  onProgress?.('Analyzing with OpenAI (GPT-4o)...')
  
  const taxonomyContext = buildTaxonomyContext()
  const modifiersList = buildContextModifiersList()
  
  const prompt = `Analyze this book for content warnings using Taxonomy v${TAXONOMY_VERSION}.

Book Information:
- Title: ${metadata.title}
- Author: ${metadata.author}
- ISBN: ${metadata.isbn}

Description:
${metadata.description}

Available Categories and Subcategories:
${taxonomyContext}
${modifiersList}

Instructions:
1. For each content warning found, provide:
   - subcategory_id (format: category.subcategory, e.g., "violence.graphic_violence")
   - description (brief, clear description - avoid revealing major plot twists or character relationships not mentioned in the book description)
   - presence (on_page, off_page, flashback, referenced, implied)
   - detail_level (graphic, moderate, vague, clinical)
   - context_modifiers (array of applicable modifiers, if any)
   - frequency_hint (single, repeated, theme)
   - centrality_hint (throwaway, minor, central)
   - is_spoiler (boolean: true if this warning reveals major plot twists, character deaths, relationship outcomes, or other significant plot points not already mentioned in the book description)
   - evidence (array with at least one evidence span containing: source: "text", excerpt: short quote, confidence: 0-1)
   - other_note (REQUIRED if subcategory_id starts with "other_"): A concise explanation (10-200 chars) of what specific content this refers to. Do NOT just copy the description. Instead, extract the key detail that makes this an "other" category. For example, if using "other_mental_health", explain what specific mental health aspect (e.g., "Depiction of social anxiety and difficulty reading social cues" not just the full description text).

2. CRITICAL: Be specific and evidence-based. Only include warnings you can identify from ACTUAL CONTENT in the description. 
   - DO NOT make assumptions based on genre, categories, or book title alone
   - DO NOT use phrases like "often includes", "typically features", "usually contains"
   - DO NOT infer warnings from genre labels (e.g., "dark romance", "thriller")
   - ONLY include warnings if you can point to specific content mentioned in the description
   - If the description is too short or generic (e.g., "A book by [Author]"), return an empty warnings array
   - If you cannot identify specific content warnings from the description, return [] (empty array)

3. For sexual content, carefully distinguish:
   - sexual_violence: Requires strong signals (force, threat, non-consent, victim framing)
   - consent_ambiguity (dub-con): Unclear consent in dark romance
   - cnc: Consensual non-consent play
   - explicit_sexual_content: Explicit but consensual

4. Spoiler detection: Mark is_spoiler=true if the warning reveals:
   - Character deaths or major character outcomes
   - Relationship status changes (who ends up together, breakups, etc.)
   - Major plot twists or reveals
   - Character identities or secrets not mentioned in the description
   - Anything that would significantly impact the reading experience if known beforehand

5. Return as JSON with this structure:
{
  "warnings": [
    {
      "subcategory_id": "category.subcategory",
      "description": "...",
      "presence": "on_page",
      "detail_level": "moderate",
      "context_modifiers": [],
      "frequency_hint": "theme",
      "centrality_hint": "central",
      "is_spoiler": false,
      "evidence": [
        {
          "source": "text",
          "excerpt": "...",
          "confidence": 0.8
        }
      ]
    }
  ]
}`

  try {
    const response = await openai.chat.completions.create({
      model: MODEL_VERSION,
      messages: [
        {
          role: 'system',
          content: `You are a content warning analyzer using Taxonomy v${TAXONOMY_VERSION}. Always use the hierarchical category.subcategory format. Be precise, evidence-based, and avoid over-tagging. NEVER make assumptions based on genre or categories alone - only identify warnings from actual content described in the book description. If the description is too minimal or generic, return an empty warnings array.`
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3,
    })

    const content = response.choices[0].message.content
    if (!content) {
      throw new Error('No response from OpenAI')
    }

    const analysis = JSON.parse(content)
    return processWarnings(analysis.warnings || [], 'openai')
  } catch (error) {
    console.error('OpenAI analysis error:', error)
    throw error
  }
}

async function analyzeWithGemini(
  metadata: BookMetadata,
  onProgress?: ProgressCallback
): Promise<EnhancedContentWarning[]> {
  onProgress?.('Analyzing with Gemini...')
  
  const taxonomyContext = buildTaxonomyContext()
  const modifiersList = buildContextModifiersList()
  
  const prompt = `Analyze this book for content warnings using Taxonomy v${TAXONOMY_VERSION}.

Book Information:
- Title: ${metadata.title}
- Author: ${metadata.author}
- ISBN: ${metadata.isbn}

Description:
${metadata.description}

Available Categories and Subcategories:
${taxonomyContext}
${modifiersList}

Instructions:
1. For each content warning found, provide:
   - subcategory_id (format: category.subcategory)
   - description (brief, clear description - avoid revealing major plot twists or character relationships not mentioned in the book description)
   - presence (on_page, off_page, flashback, referenced, implied)
   - detail_level (graphic, moderate, vague, clinical)
   - context_modifiers (array of applicable modifiers, if any)
   - frequency_hint (single, repeated, theme)
   - centrality_hint (throwaway, minor, central)
   - is_spoiler (boolean: true if this warning reveals major plot twists, character deaths, relationship outcomes, or other significant plot points not already mentioned in the book description)
   - evidence (array with evidence spans)
   - other_note (REQUIRED if subcategory_id starts with "other_"): A concise explanation (10-200 chars) of what specific content this refers to. Do NOT just copy the description. Instead, extract the key detail that makes this an "other" category. For example, if using "other_mental_health", explain what specific mental health aspect (e.g., "Depiction of social anxiety and difficulty reading social cues" not just the full description text).

2. CRITICAL: Be specific and evidence-based. Only include warnings you can identify from ACTUAL CONTENT in the description. 
   - DO NOT make assumptions based on genre, categories, or book title alone
   - DO NOT use phrases like "often includes", "typically features", "usually contains"
   - DO NOT infer warnings from genre labels (e.g., "dark romance", "thriller")
   - ONLY include warnings if you can point to specific content mentioned in the description
   - If the description is too short or generic (e.g., "A book by [Author]"), return an empty warnings array
   - If you cannot identify specific content warnings from the description, return [] (empty array)

3. For sexual content, carefully distinguish sexual_violence from consent_ambiguity/cnc.

4. Spoiler detection: Mark is_spoiler=true if the warning reveals:
   - Character deaths or major character outcomes
   - Relationship status changes (who ends up together, breakups, etc.)
   - Major plot twists or reveals
   - Character identities or secrets not mentioned in the description
   - Anything that would significantly impact the reading experience if known beforehand

5. Return as JSON with this structure:
{
  "warnings": [
    {
      "subcategory_id": "category.subcategory",
      "description": "...",
      "presence": "on_page",
      "detail_level": "moderate",
      "context_modifiers": [],
      "frequency_hint": "theme",
      "centrality_hint": "central",
      "is_spoiler": false,
      "evidence": [{"source": "text", "excerpt": "...", "confidence": 0.8}],
      "other_note": "Only include if subcategory_id starts with 'other_'. Provide a concise explanation of the specific content."
    }
  ]
}`

  try {
    // Try gemini-pro first (stable model), fallback to gemini-1.5-flash if needed
    // Note: gemini-1.5-pro is not available in v1beta API
    let model
    try {
      model = genAI.getGenerativeModel({ model: 'gemini-pro' })
    } catch (e) {
      // Fallback to flash if pro fails
      model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })
    }
    
    const result = await model.generateContent(prompt)
    const response = await result.response
    const text = response.text()
    
    // Extract JSON from response (might have markdown code blocks)
    let jsonText = text
    const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/) || text.match(/```\s*([\s\S]*?)\s*```/)
    if (jsonMatch) {
      jsonText = jsonMatch[1]
    }
    
    const analysis = JSON.parse(jsonText)
    return processWarnings(analysis.warnings || [], 'gemini')
  } catch (error) {
    console.error('Gemini analysis error:', error)
    // Check if it's a model availability error
    if (error instanceof Error && (error.message.includes('not found') || error.message.includes('404'))) {
      console.error('Gemini model not available - this may be a model name or API version issue')
      onProgress?.('⚠️ Gemini model unavailable - using OpenAI only. Check GEMINI_API_KEY and model availability.')
    } else {
      onProgress?.('⚠️ Gemini analysis failed, continuing with OpenAI only...')
    }
    // Don't throw - let the caller handle gracefully
    return []
  }
}

function processWarnings(
  rawWarnings: any[],
  source: 'openai' | 'gemini'
): EnhancedContentWarning[] {
  return rawWarnings.map((w) => {
    // Build severity signals
    const signals = buildSeveritySignals({
      presence: w.presence,
      detail_level: w.detail_level,
      description: w.description,
      category_id: w.subcategory_id?.split('.')[0],
      frequency_hint: w.frequency_hint,
      centrality_hint: w.centrality_hint
    })
    
    // Compute severity from signals
    const severity = computeSeverityFromSignals(signals)
    
    // Validate sexual violence if applicable
    let subcategoryId = w.subcategory_id
    if (subcategoryId?.includes('sexual')) {
      const violenceCheck = isActualSexualViolence({
        subcategory_id: subcategoryId,
        description: w.description,
        reasoning: w.reasoning || ''
      } as any)
      
      if (!violenceCheck.isViolence && subcategoryId === 'sexual_content.sexual_violence') {
        subcategoryId = 'sexual_content.consent_ambiguity'
      }
    }
    
    return {
      subcategory_id: subcategoryId,
      severity,
      modifiers: (w.context_modifiers || []) as ContextModifier[],
      evidence: (w.evidence || []) as EvidenceSpan[],
      severity_signals: signals,
      taxonomy_version: TAXONOMY_VERSION,
      is_spoiler: w.is_spoiler === true || w.is_spoiler === 'true',
      other_note: w.other_note, // Preserve AI-provided other_note if available
      description: w.description, // Preserve description for fallback logic
    }
  })
}

function combineResults(
  openaiWarnings: EnhancedContentWarning[],
  geminiWarnings: EnhancedContentWarning[]
): {
  combined: EnhancedContentWarning[]
  analysis: {
    agreement_score: number
    unique_to_openai: EnhancedContentWarning[]
    unique_to_gemini: EnhancedContentWarning[]
    severity_differences: Array<{
      subcategory_id: string
      openai_severity: string
      gemini_severity: string
    }>
  }
} {
  // Create maps by subcategory_id
  const openaiMap = new Map(openaiWarnings.map(w => [w.subcategory_id, w]))
  const geminiMap = new Map(geminiWarnings.map(w => [w.subcategory_id, w]))
  
  const combined: EnhancedContentWarning[] = []
  const uniqueToOpenAI: EnhancedContentWarning[] = []
  const uniqueToGemini: EnhancedContentWarning[] = []
  const severityDifferences: Array<{
    subcategory_id: string
    openai_severity: string
    gemini_severity: string
  }> = []
  
  // Process OpenAI warnings
  for (const warning of openaiWarnings) {
    const geminiWarning = geminiMap.get(warning.subcategory_id)
    
    if (!geminiWarning) {
      uniqueToOpenAI.push(warning)
      combined.push(warning)
    } else {
      // Both found it - check severity
      if (warning.severity !== geminiWarning.severity) {
        severityDifferences.push({
          subcategory_id: warning.subcategory_id,
          openai_severity: warning.severity,
          gemini_severity: geminiWarning.severity
        })
      }
      
      // Use the more severe one, or OpenAI if equal
      combined.push(warning.severity === 'severe' || 
                   (warning.severity === 'moderate' && geminiWarning.severity === 'mild')
                   ? warning : geminiWarning)
    }
  }
  
  // Process Gemini-only warnings
  for (const warning of geminiWarnings) {
    if (!openaiMap.has(warning.subcategory_id)) {
      uniqueToGemini.push(warning)
      combined.push(warning)
    }
  }
  
  // Calculate agreement score
  const totalWarnings = Math.max(openaiWarnings.length, geminiWarnings.length)
  const agreedWarnings = combined.length - uniqueToOpenAI.length - uniqueToGemini.length
  const agreementScore = totalWarnings > 0 ? agreedWarnings / totalWarnings : 0
  
  return {
    combined,
    analysis: {
      agreement_score: agreementScore,
      unique_to_openai: uniqueToOpenAI,
      unique_to_gemini: uniqueToGemini,
      severity_differences: severityDifferences
    }
  }
}

export async function analyzeBookWithMultiModel(
  metadata: BookMetadata,
  onProgress?: ProgressCallback
): Promise<{
  warnings: EnhancedContentWarning[]
  analysis: {
    agreement_score: number
    unique_to_openai: EnhancedContentWarning[]
    unique_to_gemini: EnhancedContentWarning[]
    severity_differences: Array<{
      subcategory_id: string
      openai_severity: string
      gemini_severity: string
    }>
  }
  model_results: {
    openai: EnhancedContentWarning[]
    gemini: EnhancedContentWarning[]
  }
}> {
  onProgress?.('Starting multi-model analysis...')
  
  // Run both analyses in parallel
  const [openaiWarnings, geminiWarnings] = await Promise.all([
    analyzeWithOpenAI(metadata, onProgress).catch(err => {
      console.error('OpenAI analysis failed:', err)
      onProgress?.('⚠️ OpenAI analysis failed, continuing with Gemini...')
      return []
    }),
    analyzeWithGemini(metadata, onProgress).catch(err => {
      console.error('Gemini analysis failed:', err)
      onProgress?.('⚠️ Gemini analysis failed, continuing with OpenAI...')
      return []
    })
  ])
  
  onProgress?.('Combining results from both models...')
  
  const { combined, analysis } = combineResults(openaiWarnings, geminiWarnings)
  
  onProgress?.(`Analysis complete: ${combined.length} warnings found`)
  
  return {
    warnings: combined,
    analysis,
    model_results: {
      openai: openaiWarnings,
      gemini: geminiWarnings
    }
  }
}


