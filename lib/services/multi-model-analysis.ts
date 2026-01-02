/**
 * Multi-Model Analysis Service
 * 
 * Analyzes books using both OpenAI and Gemini with Taxonomy v2.5.0
 * Combines results and provides progress updates
 */

import OpenAI from 'openai'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { WARNING_CATEGORIES, TAXONOMY_VERSION, MODEL_VERSION, getSubcategoryById } from '../config/taxonomy-v2'

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
   - description: Describe TYPES OF CONTENT, not specific plot events. Use trauma-aware, advisory language.
     * GOOD: "Depictions of explicit gun violence resulting in death"
     * GOOD: "Scenes involving sexual assault with graphic detail"
     * GOOD: "Descriptions of self-harm behaviors"
     * BAD: "Alicia shoots her husband five times"
     * BAD: "Character X is raped by Character Y"
     * BAD: "The protagonist cuts themselves in Chapter 12"
     Focus on content categories and types rather than specific character actions or plot details. This reduces spoilers and improves trauma-aware tone.
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
   - DO NOT quote the book description verbatim. Summarize the content type (e.g., "Depicts emotional abuse" instead of quoting a diary entry).
   - Use clinical, advisory language appropriate for content warnings.

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
          content: `You are a content warning analyzer using Taxonomy v${TAXONOMY_VERSION}. Always use the hierarchical category.subcategory format. Be precise, evidence-based, and avoid over-tagging. NEVER make assumptions based on genre or categories alone - only identify warnings from actual content described in the book description. If the description is too minimal or generic, return an empty warnings array.

CRITICAL: When writing descriptions, describe TYPES OF CONTENT (e.g., "Depictions of gun violence") rather than specific plot events (e.g., "Character X shoots Character Y"). Use trauma-aware, advisory language that focuses on content categories, not character actions or plot details. This reduces spoilers and improves the user experience.`
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
   - description: Describe TYPES OF CONTENT, not specific plot events. Use trauma-aware, advisory language.
     * GOOD: "Depictions of explicit gun violence resulting in death"
     * GOOD: "Scenes involving sexual assault with graphic detail"
     * GOOD: "Descriptions of self-harm behaviors"
     * BAD: "Alicia shoots her husband five times"
     * BAD: "Character X is raped by Character Y"
     * BAD: "The protagonist cuts themselves in Chapter 12"
     Focus on content categories and types rather than specific character actions or plot details. This reduces spoilers and improves trauma-aware tone.
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
    - DO NOT quote the book description verbatim. Summarize the content type (e.g., "Depicts emotional abuse" instead of quoting a diary entry).
    - Use clinical, advisory language appropriate for content warnings.

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
    // Use gemini-2.0-flash (fast and currently available)
    // Fallback to gemini-2.5-flash if needed
    let model
    try {
      model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })
    } catch (e) {
      console.warn('Primary model failed, trying fallback...')
      model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })
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
    if (error instanceof Error) {
      if (error.message.includes('not found') || error.message.includes('404')) {
        console.error('Gemini model not available - this may be a model name or API version issue')
        onProgress?.('⚠️ Gemini model unavailable - using OpenAI only. Check GEMINI_API_KEY and model availability.')
      } else if (error.message.includes('429') || error.message.includes('quota') || error.message.includes('rate limit')) {
        console.error('Gemini API rate limit exceeded - using OpenAI only')
        onProgress?.('⚠️ Gemini rate limit exceeded - using OpenAI only. Check your API quota.')
      } else {
        onProgress?.('⚠️ Gemini analysis failed, continuing with OpenAI only...')
      }
    } else {
      onProgress?.('⚠️ Gemini analysis failed, continuing with OpenAI only...')
    }
    return []
  }
}

function processWarnings(
  rawWarnings: any[],
  source: 'openai' | 'gemini'
): EnhancedContentWarning[] {
  const seenDescriptions = new Set<string>();

  return rawWarnings.reduce<EnhancedContentWarning[]>((acc, w) => {
    // Dedup descriptions
    const desc = w.description?.trim() || '';
    if (desc.length > 20 && seenDescriptions.has(desc)) {
      return acc;
    }
    seenDescriptions.add(desc);

    // Get taxonomy info for default severity
    let defaultSeverityHint: 'mild' | 'moderate' | 'severe' | undefined;
    if (w.subcategory_id) {
      const parts = w.subcategory_id.split('.');
      if (parts.length === 2) {
        const sub = getSubcategoryById(parts[0], parts[1]);
        defaultSeverityHint = sub?.defaultSeverityHint;
      }
    }

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
    const severity = computeSeverityFromSignals(signals, defaultSeverityHint)

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

    acc.push({
      subcategory_id: subcategoryId,
      severity,
      modifiers: (w.context_modifiers || []) as ContextModifier[],
      evidence: (w.evidence || []) as EvidenceSpan[],
      severity_signals: signals,
      taxonomy_version: TAXONOMY_VERSION,
      is_spoiler: w.is_spoiler === true || w.is_spoiler === 'true',
      other_note: w.other_note, // Preserve AI-provided other_note if available
      description: w.description, // Preserve description for fallback logic
    })

    return acc;
  }, [])
}

interface VerificationResult {
  subcategory_id: string
  action: 'keep' | 'drop' | 'adjust'
  adjusted_severity?: 'mild' | 'moderate' | 'severe'
  adjusted_subcategory_id?: string
  reason?: string
  drop_reason?: 'no_evidence' | 'misclassified' | 'duplicate' | 'other'
}

interface VerificationMetrics {
  unique_before: number
  kept: number
  dropped: number
  adjusted: number
  latency_ms: number
  failed: boolean
  dropped_reasons: {
    no_evidence: number
    misclassified: number
    duplicate: number
    other: number
  }
}

async function verifyUniqueWarnings(
  uniqueWarnings: EnhancedContentWarning[],
  metadata: BookMetadata,
  verifierModel: 'openai' | 'gemini',
  onProgress?: ProgressCallback
): Promise<{
  verified: EnhancedContentWarning[]
  metrics: VerificationMetrics
}> {
  const startTime = Date.now()
  const metrics: VerificationMetrics = {
    unique_before: uniqueWarnings.length,
    kept: 0,
    dropped: 0,
    adjusted: 0,
    latency_ms: 0,
    failed: false,
    dropped_reasons: {
      no_evidence: 0,
      misclassified: 0,
      duplicate: 0,
      other: 0
    }
  }

  // If no unique warnings, return early
  if (uniqueWarnings.length === 0) {
    return { verified: [], metrics }
  }

  onProgress?.(`🔍 Verifying ${uniqueWarnings.length} unique warning(s) with ${verifierModel === 'openai' ? 'OpenAI' : 'Gemini'}...`)

  try {
    const taxonomyContext = buildTaxonomyContext()

    // Build the verification prompt
    const warningsList = uniqueWarnings.map((w, idx) => {
      const evidenceText = w.evidence[0]?.excerpt || 'No evidence excerpt provided'
      return `${idx + 1}. subcategory_id: ${w.subcategory_id}
   description: ${w.description || 'N/A'}
   severity: ${w.severity}
   evidence: "${evidenceText.substring(0, 200)}${evidenceText.length > 200 ? '...' : ''}"
   confidence: ${w.evidence[0]?.confidence || 0.5}`
    }).join('\n\n')

    const prompt = `You are verifying content warnings that were identified by only ONE AI model. Your job is to validate whether these warnings are accurate and should be included.

Book Information:
- Title: ${metadata.title}
- Author: ${metadata.author}
- ISBN: ${metadata.isbn}

Description:
${metadata.description}

Available Categories and Subcategories:
${taxonomyContext}

Unique Warnings to Verify:
${warningsList}

Instructions:
For each warning, determine:
1. Does the evidence support this warning? (Check if the evidence excerpt actually supports the claimed subcategory)
2. Is the subcategory_id correct? (Verify it matches the taxonomy and the evidence)
3. Is the severity appropriate? (mild/moderate/severe based on detail_level, presence, etc.)
4. Should this warning be included? (include if valid, drop if false positive or unsupported)

Return JSON with this structure:
{
  "verifications": [
    {
      "subcategory_id": "category.subcategory",
      "action": "keep" | "drop" | "adjust",
      "adjusted_severity": "mild" | "moderate" | "severe" (only if action is "adjust"),
      "adjusted_subcategory_id": "category.subcategory" (only if subcategory is wrong),
      "reason": "Brief explanation (1-2 sentences)",
      "drop_reason": "no_evidence" | "misclassified" | "duplicate" | "other" (REQUIRED if action is "drop")
    }
  ]
}

For drop_reason:
- "no_evidence": Evidence doesn't support the warning
- "misclassified": Wrong subcategory (but content exists)
- "duplicate": Duplicate of another warning
- "other": Any other reason

Be balanced: Keep warnings that have reasonable evidence from the book description. Only drop warnings that are clearly false positives or completely unsupported. When in doubt, keep the warning rather than drop it. Adjust severity/subcategory if close but not quite right.

IMPORTANT: If a warning's description reads like a plot summary (e.g., "Character X does Y to Character Z"), suggest a rewrite to describe content types instead (e.g., "Depictions of [content type]"). Use the "reason" field to note description improvements.`

    let verificationResults: VerificationResult[] = []

    // Add timeout wrapper (10 seconds max for verification)
    const verificationPromise = (async () => {
      if (verifierModel === 'openai') {
        const response = await openai.chat.completions.create({
          model: MODEL_VERSION,
          messages: [
            {
              role: 'system',
              content: 'You are a content warning verifier. Be balanced and evidence-based. Keep warnings that have reasonable support from the evidence. Only drop warnings that are clearly false positives or completely unsupported. When in doubt, err on the side of keeping the warning to ensure readers are properly informed.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          response_format: { type: 'json_object' },
          temperature: 0.3, // Slightly higher temperature for more balanced verification
          max_tokens: 2000
        })

        const content = response.choices[0].message.content
        if (!content) {
          throw new Error('No response from OpenAI verifier')
        }

        const parsed = JSON.parse(content)
        return parsed.verifications || []
      } else {
        // Use Gemini for verification
        try {
          const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })
          const result = await model.generateContent(prompt)
          const response = result.response
          const text = response.text()

          // Extract JSON from response (may have markdown code blocks)
          const jsonMatch = text.match(/\{[\s\S]*\}/)
          if (!jsonMatch) {
            throw new Error('No JSON found in Gemini response')
          }

          const parsed = JSON.parse(jsonMatch[0])
          return parsed.verifications || []
        } catch (geminiError) {
          // Fallback to gemini-2.5-flash
          console.warn('gemini-2.0-flash failed, trying gemini-2.5-flash:', geminiError)
          const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })
          const result = await model.generateContent(prompt)
          const response = result.response
          const text = response.text()

          const jsonMatch = text.match(/\{[\s\S]*\}/)
          if (!jsonMatch) {
            throw new Error('No JSON found in Gemini response')
          }

          const parsed = JSON.parse(jsonMatch[0])
          return parsed.verifications || []
        }
      }
    })()

    // Add timeout (10 seconds)
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Verification timeout after 10s')), 10000)
    })

    try {
      verificationResults = await Promise.race([verificationPromise, timeoutPromise])
    } catch (timeoutError) {
      throw timeoutError // Re-throw to be caught by outer try-catch
    }

    // Helper function to normalize other_note for other_* subcategories
    const normalizeOtherNote = (warning: EnhancedContentWarning): string | undefined => {
      const subcategoryId = warning.subcategory_id.split('.')[1] || warning.subcategory_id
      if (!subcategoryId.startsWith('other_')) {
        return warning.other_note
      }

      // Priority: AI-provided other_note > extracted from description > evidence excerpt > generated note
      if (warning.other_note && warning.other_note.trim().length >= 10) {
        return warning.other_note.trim()
      }

      // Extract meaningful context from description/evidence
      const evidenceText = warning.evidence[0]?.excerpt || ''
      const descriptionText = warning.description || ''

      const extractKeyPhrase = (text: string, maxLength: number = 150): string => {
        if (!text || text.length <= maxLength) return text.trim()

        // Try to find a sentence or phrase that captures the essence
        const sentences = text?.match(/[^.!?]+[.!?]+/g) || []
        if (sentences.length > 0) {
          const firstSentence = sentences[0].trim()
          if (firstSentence.length >= 10 && firstSentence.length <= maxLength) {
            return firstSentence
          }
          if (firstSentence.length > maxLength) {
            const truncated = firstSentence.substring(0, maxLength)
            const lastSpace = truncated.lastIndexOf(' ')
            return lastSpace > 0 ? truncated.substring(0, lastSpace) + '...' : truncated + '...'
          }
        }

        // Fallback: truncate at word boundary
        const truncated = text.substring(0, maxLength)
        const lastSpace = truncated.lastIndexOf(' ')
        return lastSpace > 0 ? truncated.substring(0, lastSpace) + '...' : truncated + '...'
      }

      // Prefer evidence excerpt (more specific) over description
      const sourceText = evidenceText || descriptionText
      if (sourceText && sourceText.trim().length >= 10) {
        return extractKeyPhrase(sourceText, 150)
      }

      // Last resort: create a descriptive note based on subcategory
      const categoryName = subcategoryId.replace('other_', '').replace(/_/g, ' ')
      return `Content related to ${categoryName} as described in the book.`
    }

    // Apply verification results
    const verified: EnhancedContentWarning[] = []
    const verificationMap = new Map(verificationResults.map(v => [v.subcategory_id, v]))

    for (const warning of uniqueWarnings) {
      const verification = verificationMap.get(warning.subcategory_id)

      if (!verification) {
        // No verification result for this warning - keep it (fallback)
        const keptWarning = { ...warning }
        // Ensure other_note is normalized if needed
        const subcategoryId = keptWarning.subcategory_id.split('.')[1] || keptWarning.subcategory_id
        if (subcategoryId.startsWith('other_')) {
          keptWarning.other_note = normalizeOtherNote(keptWarning)
        }
        verified.push(keptWarning)
        metrics.kept++
        continue
      }

      if (verification.action === 'drop') {
        metrics.dropped++
        // Categorize drop reason
        const dropReason = verification.drop_reason || 'other'
        if (dropReason === 'no_evidence' || dropReason === 'misclassified' || dropReason === 'duplicate') {
          metrics.dropped_reasons[dropReason]++
        } else {
          metrics.dropped_reasons.other++
        }
        continue // Skip this warning
      }

      if (verification.action === 'adjust') {
        metrics.adjusted++
        // Create adjusted warning
        const adjusted: EnhancedContentWarning = {
          ...warning,
          severity: verification.adjusted_severity || warning.severity,
          subcategory_id: verification.adjusted_subcategory_id || warning.subcategory_id
        }

        // Safety check: If adjusted to other_* subcategory, ensure other_note is normalized
        const newSubcategoryId = adjusted.subcategory_id.split('.')[1] || adjusted.subcategory_id
        if (newSubcategoryId.startsWith('other_')) {
          adjusted.other_note = normalizeOtherNote(adjusted)
          // If we can't generate a valid other_note, filter out the warning
          if (!adjusted.other_note || adjusted.other_note.trim().length < 10) {
            console.warn(`[Verification] Adjusted warning to ${adjusted.subcategory_id} but cannot generate valid other_note, dropping`)
            metrics.dropped++
            metrics.dropped_reasons.other++
            continue
          }
        }

        verified.push(adjusted)
      } else {
        // action === 'keep'
        const keptWarning = { ...warning }
        // Ensure other_note is normalized if needed
        const subcategoryId = keptWarning.subcategory_id.split('.')[1] || keptWarning.subcategory_id
        if (subcategoryId.startsWith('other_')) {
          keptWarning.other_note = normalizeOtherNote(keptWarning)
        }
        metrics.kept++
        verified.push(keptWarning)
      }
    }

    metrics.latency_ms = Date.now() - startTime
    const dropReasonSummary = Object.entries(metrics.dropped_reasons)
      .filter(([_, count]) => count > 0)
      .map(([reason, count]) => `${reason}:${count}`)
      .join(', ')
    const dropSummary = dropReasonSummary ? ` (${dropReasonSummary})` : ''
    onProgress?.(`✅ Verification complete: ${metrics.kept} kept, ${metrics.dropped} dropped${dropSummary}, ${metrics.adjusted} adjusted (${metrics.latency_ms}ms)`)

    return { verified, metrics }
  } catch (error) {
    console.error('Verification failed:', error)
    metrics.failed = true
    metrics.latency_ms = Date.now() - startTime
    onProgress?.('⚠️ Verification failed, using original unique warnings')

    // Fallback: return original warnings
    return { verified: uniqueWarnings, metrics }
  }
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
    verification_metrics?: VerificationMetrics
  }
  model_results: {
    openai: EnhancedContentWarning[]
    gemini: EnhancedContentWarning[]
  }
}> {
  onProgress?.('Starting AI content analysis with OpenAI...')

  // Run OpenAI analysis only (Gemini disabled)
  const openaiWarnings = await analyzeWithOpenAI(metadata, onProgress).catch(err => {
    console.error('OpenAI analysis failed:', err)
    onProgress?.('⚠️ OpenAI analysis failed')
    return []
  })

  // Gemini disabled - return empty array
  const geminiWarnings: EnhancedContentWarning[] = []

  onProgress?.('Processing results...')

  const { combined, analysis } = combineResults(openaiWarnings, geminiWarnings)

  // POC: Verify unique warnings only
  const allUniqueWarnings = [...analysis.unique_to_openai, ...analysis.unique_to_gemini]
  let finalWarnings = combined
  let verificationMetrics: VerificationMetrics | undefined = undefined

  if (allUniqueWarnings.length > 0) {
    // Use the opposite model for verification (if OpenAI found it, verify with Gemini, and vice versa)
    // For simplicity, verify all unique warnings together using OpenAI (more reliable)
    const { verified, metrics } = await verifyUniqueWarnings(
      allUniqueWarnings,
      metadata,
      'openai', // Use OpenAI for verification (more reliable)
      onProgress
    )

    verificationMetrics = metrics

    // Replace unique warnings in combined list with verified ones
    // Remove original unique warnings
    const uniqueSubcategoryIds = new Set(allUniqueWarnings.map(w => w.subcategory_id))
    finalWarnings = combined.filter(w => !uniqueSubcategoryIds.has(w.subcategory_id))

    // Add verified warnings
    finalWarnings.push(...verified)

    // Log metrics
    console.log('[Verification Metrics]', {
      unique_before: metrics.unique_before,
      kept: metrics.kept,
      dropped: metrics.dropped,
      dropped_reasons: metrics.dropped_reasons,
      adjusted: metrics.adjusted,
      latency_ms: metrics.latency_ms,
      failed: metrics.failed
    })
  }

  onProgress?.(`Analysis complete: ${finalWarnings.length} warnings found${verificationMetrics ? ` (${verificationMetrics.dropped} unique warnings dropped)` : ''}`)

  return {
    warnings: finalWarnings,
    analysis: {
      ...analysis,
      verification_metrics: verificationMetrics
    },
    model_results: {
      openai: openaiWarnings,
      gemini: geminiWarnings
    }
  }
}


