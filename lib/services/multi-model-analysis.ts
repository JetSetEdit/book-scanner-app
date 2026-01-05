/**
 * Multi-Model Analysis Service
 * 
 * Analyzes books using both OpenAI and Gemini with Taxonomy v2.5.0
 * Combines results and provides progress updates
 */

import OpenAI from 'openai'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { WARNING_CATEGORIES, TAXONOMY_VERSION, MODEL_VERSION, getSubcategoryById } from '../config/taxonomy-v2'

import { ContextModifier, EvidenceSpan, EnhancedContentWarning, SeveritySignals } from '../config/taxonomy-context'
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

/**
 * Map severity to Australian Classification Board intensity terminology
 */
function getIntensityTerm(severity: 'mild' | 'moderate' | 'severe'): string {
  switch (severity) {
    case 'severe': return 'Strong'
    case 'moderate': return 'Moderate'
    case 'mild': return 'Mild'
    default: return 'Moderate'
  }
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
): Promise<{ warnings: EnhancedContentWarning[], noWarningsReasoning?: string }> {
  onProgress?.('Analyzing with OpenAI (GPT-4o)...')

  const taxonomyContext = buildTaxonomyContext()
  const modifiersList = buildContextModifiersList()

  const prompt = `Analyze this book for content warnings using Taxonomy v${TAXONOMY_VERSION}, following the Australian Classification Board's methodology.

Official References:
- Guidelines for the Classification of Publications 2005 (F2008C00129)
- National Classification Code (F2013C00006)
- https://www.classification.gov.au/classification-ratings/how-rating-decided

The Board assesses content based on six classifiable elements: themes, violence, language, drug use, nudity, and sex. Ratings are determined by the IMPACT of these elements (very mild, mild, moderate, strong, high).

Per the Publications Guidelines (p.124-129), impact is assessed through:
- Emphasis: How prominently the element is featured
- Tone: The manner in which content is presented
- Frequency: How often the element appears
- Context: The setting and justification for the content
- Detail: The amount of visual or written detail
- Cumulative effect: How elements combine to create overall impact

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
   - description: Write a clear, specific advisory description in the style of the Australian Classification Board (classification.gov.au). Use standardized terminology: "Strong [content type]", "Moderate [content type]", "Mild [content type]", or "[Content type] themes". Be direct and avoid euphemism. Describe the nature and intensity (impact) of the content clearly.
     * GOOD: "Strong themes of emotional abuse and psychological manipulation within relationships."
     * GOOD: "Moderate violence, including physical abuse and scenes of domestic violence."
     * GOOD: "Strong themes of mental health struggles, including depression and psychological trauma."
     * GOOD: "Mild themes of grief and loss."
     * BAD: "The book centers around a troubled relationship..." (too narrative, not advisory)
     * BAD: "Passages from Amy's diary reveal..." (too quote-like, not descriptive enough)
     * BAD: "Alicia shoots her husband five times" (too specific, reveals plot)
     Use the format: "[Intensity] [content type]" or "[Content type] themes" - be concise, clear, and direct about what content is present.
   - presence (on_page, off_page, flashback, referenced, implied)
   - detail_level (graphic, moderate, vague, clinical)
   - context_modifiers (array of applicable modifiers, if any):
     * Use context modifiers to indicate contextual nuance that affects impact:
       - historical_context: Content in historical setting (reduces impact)
       - educational_or_analytical: Educational/informational context (reduces impact)
       - condemned_by_narrative: Content explicitly condemned (reduces impact)
       - quoted_or_discussed: Content quoted/discussed rather than directly depicted (reduces impact)
       - endorsed_by_narrative: Content endorsed/normalized (increases impact)
       - character_held_bias: Bias held by character, not narrative (reduces impact)
       - satire_or_parody: Satirical context (reduces impact)
     * IMPORTANT: Context modifiers should influence severity assessment. Educational/historical/condemned content should generally have lower severity than exploitative/endorsed content, even if the content itself is similar.
   - frequency_hint (single, repeated, theme)
   - centrality_hint (throwaway, minor, central)
   - is_spoiler (boolean: true if this warning reveals major plot twists, character deaths, relationship outcomes, or other significant plot points not already mentioned in the book description)
   - evidence (array with at least one evidence span containing: source: "text", excerpt: short quote, confidence: 0-1)
   - reasoning: A clear explanation of why this warning was assigned, using Australian Classification Board style language. Explain what evidence supports the warning and why the severity level (Strong/Moderate/Mild) is appropriate. When assessing impact, explicitly consider: Emphasis (how prominently featured), Tone (manner of presentation), Frequency (how often it appears), Context (setting and justification), Detail (amount of detail), and Cumulative effect (how it combines with other elements). CRITICAL: If context modifiers are applied (e.g., educational_or_analytical, historical_context, condemned_by_narrative), explicitly explain how the context reduces the impact and justifies a lower severity level. Conversely, if content is endorsed_by_narrative or exploitative, explain how this increases impact. DO NOT mention specific character names, plot events, or story details. Keep it generic and focused on content types.
     * GOOD: "Strong themes of emotional abuse are present as a central element of the narrative (emphasis: central, frequency: repeated theme). The content explores psychological manipulation and control within relationships with moderate detail (detail: moderate), presented in a serious tone (tone: serious), which justifies a high severity classification."
     * GOOD: "Moderate violence is depicted, including physical abuse within relationships. The content includes scenes of domestic violence (frequency: repeated scenes, detail: moderate, context: relationship setting), supporting a moderate severity rating."
     * BAD: "The disappearance of [Character Name] is central to the plot..." (mentions character names - spoiler)
     * BAD: "A character dies in Chapter 12..." (mentions specific plot events - spoiler)
   - other_note (REQUIRED if subcategory_id starts with "other_"): A concise explanation (10-200 chars) of what specific content this refers to. Do NOT just copy the description. Instead, extract the key detail that makes this an "other" category. For example, if using "other_mental_health", explain what specific mental health aspect (e.g., "Depiction of social anxiety and difficulty reading social cues" not just the full description text).

2. CRITICAL: Be specific and evidence-based. Only include warnings you can identify from ACTUAL CONTENT in the description. 
   - DO NOT make assumptions based on genre, categories, or book title alone
   - DO NOT use phrases like "often includes", "typically features", "usually contains"
   - DO NOT infer warnings from genre labels (e.g., "dark romance", "thriller")
   - ONLY include warnings if you can point to specific content mentioned in the description
   - If the description is too short or generic (e.g., "A book by [Author]"), return an empty warnings array
   - If you cannot identify specific content warnings from the description, return [] (empty array)
   - DO NOT quote the book description verbatim. Use Australian Classification Board terminology (e.g., "Strong themes of emotional abuse" instead of quoting a diary entry).
   - Use the Board's standardized advisory language. Reference: https://www.classification.gov.au/classification-ratings/how-rating-decided
   - IMPORTANT: Pay special attention to RELATIONSHIP AND EMOTIONAL CONTENT that may be triggering:
     * Deception, lying, or secret-keeping (e.g., "lying through their teeth", "haven't told anyone", "pretending to be together")
     * Relationship breakdown, separation, or breakups (e.g., "broke up", "divorced", "separated")
     * Emotional stress from relationship issues (e.g., "can't bear to", "pretending", "faking", "hiding feelings")
     * Pressure to maintain appearances or keep secrets from friends/family
     * These should be flagged as:
       - "family_dynamics.deception_or_secrets" for deception/lying to friends or family
       - "family_dynamics.divorce" for relationship breakdown/separation
       - "family_dynamics.other_family_dynamics" for other family/social dynamics
   - IMPORTANT: If the warnings array is empty, you MUST provide a "no_warnings_reasoning" field. 
     * BEFORE returning empty, explicitly ask yourself: "Does this book contain grief, anxiety, panic attacks, or intense emotional distress?"
     * If YES, these are CONTENT WARNINGS. Do not return empty. Create a warning for "mental_health" or "themes".
     * If NO, and it is truly lighthearted (e.g., "Cozy Mystery", "RomCom" with no angst), then return empty.
     * In your reasoning, explicitly state: "No content warnings found. Review of themes (grief, anxiety, violence) came back negative. Tone is lighthearted."

2a. GENRE AWARENESS FOR ROMANCE BOOKS:
   - If the book appears to be a Romance novel (based on title, description, or categories like "Sports Romance", "Small Town Romance", "Contemporary Romance", "Romance", etc.), you MUST be especially thorough:
   - **CRITICAL FIRST STEP**: If the description or categories identify this as a romance book (e.g., mentions "romance", "romantic novel", "romance book", or categories include "Romance"), you MUST create at least one warning for general relationship/romance content:
     * Flag as "emotional_abuse_or_toxic_relationships.other_toxic_relationships" with mild severity
     * Description: "Mild themes of romantic relationships and relationship dynamics."
     * Reasoning: "This is a romance novel, which inherently involves romantic relationships, emotional content, and relationship dynamics that some readers may want to be aware of."
     * This ensures readers are informed about romantic/relationship content, even if specific tropes or conflicts aren't explicitly mentioned in the description
   - Look for HEAT/SPICE LEVEL indicators in the description:
     * Explicit sexual content (detailed sexual scenes)
     * Moderate sexual content (fade-to-black or moderate detail)
     * Mild sexual content (kissing, implied intimacy)
     * No sexual content (sweet/clean romance)
   - Look for COMMON ROMANCE TROPES that are content warnings:
     * Cheating/infidelity themes
     * Secret baby/pregnancy tropes
     * Loss of a parent/child (grief themes)
     * Emotional abuse/manipulation in relationships
     * Dubious consent (dub-con) or power imbalances
     * Age gap relationships (especially significant age differences)
     * Stalking or obsessive behavior
     * Toxic relationship dynamics
     * **Enemies-to-lovers (REQUIRED WARNING)**: If the description explicitly mentions "enemies to lovers", "enemies-to-lovers", "enemies to lovers dynamic", or describes characters who "put aside their dislike", "start as adversaries", or have "mutual dislike" that develops into romance, you MUST flag this as "emotional_abuse_or_toxic_relationships.other_toxic_relationships" with a description like "Mild themes of relationship conflict and adversarial dynamics (enemies-to-lovers trope)." This is triggering for readers sensitive to relationship conflict, tension, or adversarial dynamics.
     * Second chance romance (past relationship trauma, breakups, reconciliation stress)
   - Look for RELATIONSHIP STRESS AND DECEPTION themes:
     * Deception or lying to friends/family (e.g., "lying through their teeth", "pretending to be together", "haven't told anyone")
     * Secret keeping or hiding relationship status
     * Relationship breakdown or separation (breakups, divorce, estrangement)
     * Emotional stress from relationship issues (pretending, faking, hiding feelings)
     * Pressure to maintain appearances or keep secrets
     * These should be flagged as:
       - "family_dynamics.deception_or_secrets" for deception/lying to friends or family
       - "family_dynamics.divorce" for relationship breakdown/separation
       - "family_dynamics.other_family_dynamics" for other family/social dynamics
   - Look for MENTAL HEALTH AND EMOTIONAL TRAUMA (Critical for Contemporary Romance):
     * Romance novels often explore heavy internal struggles alongside the love story. You MUST check for:
     * Grief / Death of a parent, friend, or loved one (past or present)
     * Anxiety, Panic Attacks, or "struggling to breathe/cope"
     * Depression, "darkness", "numbness", or "brain fog"
     * Burnout, feeling overwhelmed, or emotional collapse
     * If these are present, flag them as "mental_health.mental_health_struggles" (or appropriate category) with "mild" or "moderate" severity depending on intensity.
     * Example: "struggling to navigate life after her father's death" → Warning: "Themes of grief and loss"
     * Example: "prone to panic attacks" → Warning: "Depiction of panic attacks/anxiety"
   - Assess EMOTIONAL INTENSITY:
     * High emotional intensity (angst, trauma, heavy themes)
     * Moderate emotional intensity (some conflict, but generally light)
     * Low emotional intensity (lighthearted, low conflict)
   - IMPORTANT: If the description explicitly mentions "enemies to lovers", "enemies-to-lovers", or similar phrases, you MUST create a warning. This is not optional - enemies-to-lovers is a content warning because it involves relationship conflict, adversarial dynamics, and emotional tension that can be triggering.
   - IMPORTANT: If the description is vague or minimal (especially if it's just marketing copy like "bestselling author" or "highly anticipated"), you should:
     * Still look for ANY romance tropes mentioned (even briefly) in the description
     * If "enemies to lovers" or similar is mentioned, ALWAYS flag it - do not skip it because the description is "cozy" or "lighthearted"
     * Flag common romance tropes that might be present even if not explicitly stated (e.g., if it's a romance book, enemies-to-lovers, second chance, etc. are common)
     * Note in "no_warnings_reasoning" that "Analysis based on minimal blurb only; community reviews may indicate different heat/spice levels or tropes not mentioned in the description."
     * If the description mentions ANY relationship tension, conflict, or adversarial dynamics, flag it as "emotional_abuse_or_toxic_relationships.other_toxic_relationships" or "family_dynamics.other_family_dynamics" with mild severity
   - CRITICAL: For ANY romance book (identified by title, description, or categories containing "Romance"), you MUST flag general relationship/romance content:
     * If the description identifies it as a "romance", "romantic novel", "romance book", or similar, flag it as "emotional_abuse_or_toxic_relationships.other_toxic_relationships" with mild severity and description like "Mild themes of romantic relationships and relationship dynamics."
     * Romance books inherently involve relationship dynamics, emotional content, and romantic themes that some readers may want to be aware of, even if the description doesn't explicitly mention conflict or tension
     * This ensures readers are informed that the book contains romantic/relationship content, regardless of whether specific tropes or conflicts are mentioned
     * Only skip this if the book is clearly NOT a romance (e.g., non-fiction, thriller without romance subplot, etc.)

3. For sexual content, carefully distinguish:
   - sexual_violence: Requires strong signals (force, threat, non-consent, victim framing)
   - consent_ambiguity (dub-con): Unclear consent in dark romance
   - cnc: Consensual non-consent play
   - explicit_sexual_content: Explicit but consensual
   - IMPORTANT: For dark romance, thriller, or psychological thriller genres, explicitly check for sexual content indicators:
     * Explicit sexual scenes, detailed sexual content, steamy/spicy content
     * Sexual violence, non-consensual sexual content, rape, sexual assault
     * Dubious consent, power imbalances in sexual relationships
     * If the book description mentions "dark", "thriller", "psychological thriller", "steamy", "spicy", "explicit", or similar terms, you MUST check for sexual content warnings even if not explicitly mentioned in the description
     * For books known to contain graphic sexual content (e.g., "Verity" by Colleen Hoover), flag sexual content warnings based on genre indicators and book reputation

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
      "reasoning": "Detailed explanation of why this warning was assigned...",
      "evidence": [
        {
          "source": "text",
          "excerpt": "...",
          "confidence": 0.8
        }
      ]
    }
  ],
  "no_warnings_reasoning": "If warnings array is empty, provide a brief explanation (2-4 sentences) of why no content warnings were identified. Explain what content was reviewed (e.g., 'romance themes', 'lighthearted tone', 'no violence or sensitive themes mentioned') and why it does not meet the threshold for content warnings. Use Australian Classification Board terminology. This field should only be present when warnings array is empty."
}`

  try {
    const response = await openai.chat.completions.create({
      model: MODEL_VERSION,
      messages: [
        {
          role: 'system',
          content: `You are a content warning analyzer using Taxonomy v${TAXONOMY_VERSION}, following the Australian Classification Board's methodology.

Official References:
- Guidelines for the Classification of Publications 2005 (F2008C00129)
- National Classification Code (F2013C00006)
- https://www.classification.gov.au/classification-ratings/how-rating-decided

The Australian Classification Board assesses content based on six classifiable elements: themes, violence, language, drug use, nudity, and sex. Ratings are determined by the IMPACT of these elements (very mild, mild, moderate, strong, high).

Per the Publications Guidelines (p.124-129), impact is assessed through:
- Emphasis: How prominently the element is featured
- Tone: The manner in which content is presented
- Frequency: How often the element appears
- Context: The setting and justification for the content
- Detail: The amount of visual or written detail
- Cumulative effect: How elements combine to create overall impact

CRITICAL INSTRUCTIONS:
1. Always use the hierarchical category.subcategory format.
2. Be precise, evidence-based, and avoid over-tagging.
3. NEVER make assumptions based on genre or categories alone - only identify warnings from actual content described in the book description.
4. If the description is too minimal or generic, return an empty warnings array.
5. GENRE-SPECIFIC AWARENESS: For Romance books (including "Sports Romance", "Small Town Romance", "Contemporary Romance", etc.), be especially thorough:
   - Look for heat/spice level indicators (explicit, moderate, mild, or clean/sweet)
   - Identify common romance tropes that are content warnings (cheating, secret baby, loss/grief, emotional abuse, dubious consent, age gaps, stalking, toxic dynamics)
   - Assess emotional intensity levels
   - If the description is vague about heat level or tropes, note in reasoning that "Analysis based on blurb only; community reviews may indicate different content."
6. When assessing impact, ALWAYS consider all six factors from the Publications Guidelines:
   - Emphasis: How prominently the element is featured (e.g., "central theme", "incidental reference")
   - Tone: The manner in which content is presented (e.g., "serious", "graphic", "discreet")
   - Frequency: How often the element appears (e.g., "throughout", "repeated scenes", "single incident")
   - Context: The setting and justification (e.g., "relationship setting", "historical context", "gratuitous")
   - Detail: The amount of visual or written detail (e.g., "moderate detail", "graphic", "vague")
   - Cumulative effect: How elements combine to create overall impact
6. CONTEXT MODIFIERS AFFECT SEVERITY: Apply context modifiers appropriately and adjust severity accordingly:
   - Educational/historical/condemned content → Lower severity (e.g., "severe" becomes "moderate", "moderate" becomes "mild")
   - Exploitative/endorsed content → Higher or maintained severity
   - Example: Violence in historical/educational context with condemned_by_narrative should be "moderate" or "mild", not "severe"
   - Example: Violence that is endorsed_by_narrative and gratuitous should be "severe"
7. In your reasoning, explicitly reference these impact factors AND context modifiers when explaining severity levels.

DESCRIPTION FORMAT (Australian Classification Board style):
- Use standardized terminology with intensity descriptors: "Strong [content type]", "Moderate [content type]", "Mild [content type]", or "[Content type] themes"
- Be direct, clear, and avoid euphemism
- Examples: "Strong themes of violence", "Moderate sexual content", "Mild language", "Strong themes of emotional abuse"
- Focus on content categories and intensity (impact), not specific plot events or character actions
- Reference the official Publications Guidelines methodology`
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
    const warnings = processWarnings(analysis.warnings || [], 'openai')
    const noWarningsReasoning = analysis.no_warnings_reasoning || undefined
    return { warnings, noWarningsReasoning }
  } catch (error) {
    console.error('OpenAI analysis error:', error)
    
    // Check if it's a rate limit error - these should be thrown, not caught
    const errorMessage = error instanceof Error ? error.message : String(error)
    const errorCode = (error as any)?.status || (error as any)?.code
    
    const isRateLimit = errorCode === 429 || 
                       errorMessage.includes('429') || 
                       errorMessage.includes('rate limit') || 
                       errorMessage.includes('quota') ||
                       errorMessage.includes('Rate limit') ||
                       errorMessage.includes('rate_limit')
    
    if (isRateLimit) {
      console.error('OpenAI rate limit exceeded - throwing error to prevent false "no warnings" result')
      onProgress?.('⚠️ OpenAI rate limit exceeded - analysis cannot complete')
      // Throw a specific error that can be caught and handled appropriately
      const rateLimitError = new Error('OpenAI rate limit exceeded')
      ;(rateLimitError as any).isRateLimit = true
      throw rateLimitError
    }
    
    // For other errors, also throw to prevent false "no warnings"
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
   - description: Write a clear, specific advisory description in the style of the Australian Classification Board (classification.gov.au). Use standardized terminology: "Strong [content type]", "Moderate [content type]", "Mild [content type]", or "[Content type] themes". Be direct and avoid euphemism. Describe the nature and intensity of the content clearly.
     * GOOD: "Strong themes of emotional abuse and psychological manipulation within relationships."
     * GOOD: "Moderate violence, including physical abuse and scenes of domestic violence."
     * GOOD: "Strong themes of mental health struggles, including depression and psychological trauma."
     * GOOD: "Mild themes of grief and loss."
     * BAD: "The book centers around a troubled relationship..." (too narrative, not advisory)
     * BAD: "Passages from Amy's diary reveal..." (too quote-like, not descriptive enough)
     * BAD: "Alicia shoots her husband five times" (too specific, reveals plot)
     Use the format: "[Intensity] [content type]" or "[Content type] themes" - be concise, clear, and direct about what content is present.
   - presence (on_page, off_page, flashback, referenced, implied)
   - detail_level (graphic, moderate, vague, clinical)
   - context_modifiers (array of applicable modifiers, if any):
     * Use context modifiers to indicate contextual nuance that affects impact:
       - historical_context: Content in historical setting (reduces impact)
       - educational_or_analytical: Educational/informational context (reduces impact)
       - condemned_by_narrative: Content explicitly condemned (reduces impact)
       - quoted_or_discussed: Content quoted/discussed rather than directly depicted (reduces impact)
       - endorsed_by_narrative: Content endorsed/normalized (increases impact)
       - character_held_bias: Bias held by character, not narrative (reduces impact)
       - satire_or_parody: Satirical context (reduces impact)
     * IMPORTANT: Context modifiers should influence severity assessment. Educational/historical/condemned content should generally have lower severity than exploitative/endorsed content, even if the content itself is similar.
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

4. SPECIAL FOCUS: INTERNAL STRUGGLES (Romance/Contemporary)
   - Do not overlook internal emotional content.
   - Explicitly tag: Grief, Depression, Anxiety, Panic Attacks, Burnout.
   - These are valid content warnings even if the rest of the book is "safe".
   - Romance novels often explore heavy internal struggles alongside the love story. Check for:
     * Grief / Death of a parent, friend, or loved one (past or present)
     * Anxiety, Panic Attacks, or "struggling to breathe/cope"
     * Depression, "darkness", "numbness", or "brain fog"
     * Burnout, feeling overwhelmed, or emotional collapse
   - If these are present, flag them as "mental_health.mental_health_struggles" (or appropriate category) with "mild" or "moderate" severity depending on intensity.

5. Spoiler detection: Mark is_spoiler=true if the warning reveals:
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

/**
 * Update reasoning text to match computed severity
 * Replaces AI's severity claim with the actual computed severity
 * Handles cases where AI confuses "detail level" (graphic/moderate/vague) with "severity" (mild/moderate/severe)
 */
function updateDescriptionForSeverity(
  originalDescription: string | undefined,
  computedSeverity: 'mild' | 'moderate' | 'severe'
): string {
  if (!originalDescription) {
    // Generate basic description if none provided
    const intensityMap = {
      severe: 'Strong',
      moderate: 'Moderate',
      mild: 'Mild'
    }
    return `${intensityMap[computedSeverity]} themes of sensitive content.`
  }

  const intensityMap = {
    severe: 'Strong',
    moderate: 'Moderate',
    mild: 'Mild'
  }
  const targetIntensity = intensityMap[computedSeverity]
  
  let updatedDescription = originalDescription.trim()
  
  // Pattern to match intensity word at the start
  const intensityStartPattern = /^(Strong|Moderate|Mild|Graphic|Explicit|Intense|Heavy|Light|Subtle)\s+/i
  
  if (intensityStartPattern.test(updatedDescription)) {
    // Extract the current intensity word and everything after it
    const match = updatedDescription.match(intensityStartPattern)
    if (match) {
      const currentIntensity = match[1]
      const restOfDescription = updatedDescription.substring(match[0].length).trim()
      
      // Check if "themes" is missing (common AI error: "Moderate of..." instead of "Moderate themes of...")
      const hasThemes = /^themes?\s+of/i.test(restOfDescription)
      const hasDirectOf = /^of\s+/i.test(restOfDescription)
      
      // If we have "Moderate of..." (missing themes), add "themes"
      if (hasDirectOf && !hasThemes) {
        updatedDescription = `${targetIntensity} themes ${restOfDescription}`
      } else if (hasThemes) {
        // Already has "themes of", just replace intensity if needed
        if (currentIntensity.toLowerCase() !== targetIntensity.toLowerCase()) {
          updatedDescription = `${targetIntensity} ${restOfDescription}`
        }
        // If intensity already matches, keep as-is
      } else {
        // Has intensity word but no "themes" or "of" - check if it's a valid format
        // Examples: "Moderate violence", "Strong content" - these are fine
        // But if it starts with "of", we need to add "themes"
        if (restOfDescription.startsWith('of ')) {
          updatedDescription = `${targetIntensity} themes ${restOfDescription}`
        } else if (currentIntensity.toLowerCase() !== targetIntensity.toLowerCase()) {
          // Just replace intensity, keep rest
          updatedDescription = `${targetIntensity} ${restOfDescription}`
        }
      }
    }
  } else {
    // Description doesn't start with intensity word - prepend it with "themes of"
    // Remove leading articles if present
    const content = updatedDescription.replace(/^(The|A|An)\s+/i, '').trim()
    // Ensure first letter is lowercase after prepending
    const firstChar = content.charAt(0)
    const rest = content.slice(1)
    updatedDescription = `${targetIntensity} themes of ${firstChar.toLowerCase()}${rest}`
  }

  return updatedDescription
}

function updateReasoningForSeverity(
  originalReasoning: string | undefined,
  computedSeverity: 'mild' | 'moderate' | 'severe',
  signals: SeveritySignals
): string {
  if (!originalReasoning) {
    // Generate basic reasoning if none provided
    const severityText = computedSeverity.charAt(0).toUpperCase() + computedSeverity.slice(1)
    return `${severityText} severity based on computed signals (frequency: ${signals.frequency.toFixed(1)}, centrality: ${signals.centrality.toFixed(1)}, proximity: ${signals.proximity.toFixed(1)}, explicitness: ${signals.explicitness.toFixed(1)}).`
  }

  const severityText = computedSeverity.charAt(0).toUpperCase() + computedSeverity.slice(1)
  
  // Pattern to match severity classification claims (not detail level)
  const severityClassificationPatterns = [
    /\b(mild|moderate|severe)\s+severity\s+classification\b/gi,
    /\bjustifying\s+a\s+(mild|moderate|severe)\s+severity\s+classification\b/gi,
    /\b(mild|moderate|severe)\s+severity\s+rating\b/gi,
    /\b(mild|moderate|severe)\s+severity\b/gi,
    /\bclassified\s+as\s+(mild|moderate|severe)\s+severity\b/gi,
    /\bwarrants\s+(mild|moderate|severe)\s+severity\b/gi,
  ]

  let updatedReasoning = originalReasoning
  
  // Replace severity classification claims
  for (const pattern of severityClassificationPatterns) {
    updatedReasoning = updatedReasoning.replace(pattern, (match, claimedSeverity) => {
      if (claimedSeverity.toLowerCase() !== computedSeverity.toLowerCase()) {
        return match.replace(claimedSeverity, severityText)
      }
      return match
    })
  }

  // Check if reasoning explicitly states the severity classification
  const hasExplicitSeverityClaim = severityClassificationPatterns.some(pattern => pattern.test(originalReasoning))
  
  // If no explicit severity claim found, append it
  if (!hasExplicitSeverityClaim) {
    // Check if reasoning ends with a period or other punctuation
    const trimmed = updatedReasoning.trim()
    const endsWithPunctuation = /[.!?]$/.test(trimmed)
    const separator = endsWithPunctuation ? ' ' : '. '
    
    updatedReasoning = `${trimmed}${separator}This content is classified as ${severityText.toLowerCase()} severity based on computed signals (frequency: ${signals.frequency.toFixed(1)}, centrality: ${signals.centrality.toFixed(1)}, proximity: ${signals.proximity.toFixed(1)}, explicitness: ${signals.explicitness.toFixed(1)}).`
  }

  return updatedReasoning
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

    // Update description to match computed severity
    const updatedDescription = updateDescriptionForSeverity(
      w.description,
      severity
    )

    // Update reasoning to match computed severity
    const updatedReasoning = updateReasoningForSeverity(
      w.reasoning,
      severity,
      signals
    )

    acc.push({
      subcategory_id: subcategoryId,
      severity,
      modifiers: (w.context_modifiers || []) as ContextModifier[],
      evidence: (w.evidence || []) as EvidenceSpan[],
      severity_signals: signals,
      taxonomy_version: TAXONOMY_VERSION,
      is_spoiler: w.is_spoiler === true || w.is_spoiler === 'true',
      other_note: w.other_note, // Preserve AI-provided other_note if available
      description: updatedDescription, // Use updated description that matches computed severity
      reasoning: updatedReasoning, // Use updated reasoning that matches computed severity
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
        const sentences = text.match(/[^.!?]+[.!?]+/g) || []
        if (sentences.length > 0 && sentences[0]) {
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
        const adjustedSeverity = verification.adjusted_severity || warning.severity
        const adjusted: EnhancedContentWarning = {
          ...warning,
          severity: adjustedSeverity,
          subcategory_id: verification.adjusted_subcategory_id || warning.subcategory_id
        }

        // If severity was adjusted, update description and reasoning to match the new severity
        if (verification.adjusted_severity && verification.adjusted_severity !== warning.severity) {
          adjusted.description = updateDescriptionForSeverity(
            warning.description,
            adjustedSeverity
          )
          adjusted.reasoning = updateReasoningForSeverity(
            warning.reasoning,
            adjustedSeverity,
            warning.severity_signals || buildSeveritySignals({
              presence: undefined,
              detail_level: undefined,
              description: warning.description,
              category_id: adjusted.subcategory_id.split('.')[0],
              frequency_hint: undefined,
              centrality_hint: undefined
            })
          )
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
  noWarningsReasoning?: string
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
  // IMPORTANT: Don't catch errors here - let them propagate to scan-service
  // If we catch and return empty array, it will be treated as "no warnings" which is wrong
  // Rate limit errors should cause the book to show as "Unknown" (not analyzed), not "Comfort Read" (analyzed and safe)
  const openaiResult = await analyzeWithOpenAI(metadata, onProgress)
  const openaiWarnings = openaiResult.warnings
  const openaiNoWarningsReasoning = openaiResult.noWarningsReasoning

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

  // Web Search Enrichment: If we got 0 warnings or very few warnings,
  // search for content warnings from community sources
  // This helps catch mental health themes that may be missing from sanitized descriptions
  if (finalWarnings.length <= 2) {
    // Check if we only have generic romance warnings (which might indicate sanitized description)
    const hasOnlyGenericWarnings = finalWarnings.length > 0 && 
      finalWarnings.every(w => 
        w.subcategory_id === 'emotional_abuse_or_toxic_relationships.other_toxic_relationships' ||
        w.subcategory_id === 'substance_use_or_alcohol.alcohol'
      )

    // Trigger enrichment if:
    // 1. We have 0 warnings (definitely need enrichment)
    // 2. We only have generic warnings (likely sanitized)
    // 3. We have 1-2 warnings but they're all relationship/alcohol (might be missing mental health)
    const shouldEnrich = finalWarnings.length === 0 || 
      hasOnlyGenericWarnings ||
      (finalWarnings.length <= 2 && 
       !finalWarnings.some(w => 
         w.subcategory_id?.includes('mental_health') ||
         w.subcategory_id?.includes('grief') ||
         w.subcategory_id?.includes('death')
       ))

    if (shouldEnrich) {
      onProgress?.('🔍 Initial scan found few/no warnings - searching community sources for content warnings...')
      
      try {
        const { enrichWithWebSearch } = await import('./web-search-enrichment')
        const enrichmentResult = await enrichWithWebSearch(
          metadata,
          finalWarnings.length,
          onProgress
        )

        if (enrichmentResult.enrichedContext && enrichmentResult.foundContentWarnings) {
          onProgress?.('📄 Enriching description with community-sourced content warnings...')
          
          // Create enriched metadata with community-sourced context
          const enrichedMetadata: BookMetadata = {
            ...metadata,
            description: `${metadata.description}\n\nAdditional context from community sources:\n${enrichmentResult.enrichedContext}`
          }

          // Run a second analysis with enriched description
          onProgress?.('🔄 Re-analyzing with enriched context...')
          const enrichedResult = await analyzeWithOpenAI(enrichedMetadata, onProgress)
          const enrichedWarnings = enrichedResult.warnings

          if (enrichedWarnings.length > finalWarnings.length) {
            onProgress?.(`✅ Enrichment found ${enrichedWarnings.length - finalWarnings.length} additional warning(s)`)
            
            // Combine original warnings with enriched warnings (deduplicate by subcategory_id)
            const existingSubcategoryIds = new Set(finalWarnings.map(w => w.subcategory_id))
            const newWarnings = enrichedWarnings.filter(w => !existingSubcategoryIds.has(w.subcategory_id))
            
            finalWarnings = [...finalWarnings, ...newWarnings]
            
            // Update noWarningsReasoning if we now have warnings
            if (finalWarnings.length > 0 && openaiNoWarningsReasoning) {
              // Clear noWarningsReasoning since we now have warnings
            }
          } else {
            onProgress?.('ℹ️ Enrichment did not find additional warnings beyond initial scan')
          }
        }
      } catch (error) {
        console.error('[Web Search Enrichment] Error during enrichment:', error)
        onProgress?.('⚠️ Web search enrichment failed, continuing with initial results')
        // Continue with original warnings - don't fail the entire scan
      }
    }
  }

  return {
    warnings: finalWarnings,
    noWarningsReasoning: finalWarnings.length === 0 ? openaiNoWarningsReasoning : undefined,
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


