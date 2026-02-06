/**
 * SSS (Subtext Suitability Scale) assignment service.
 * Assigns a reader-focused emotional intensity level (S1–S4) from content warnings and book metadata.
 * See OpenSpec: add-sss-assignment-agent, capability sss-assignment.
 */

import OpenAI from 'openai'
import type { EnhancedContentWarning } from '@/lib/config/taxonomy-context'

export type SSSLevel = 'S0_NO_INPUT' | 'S1_GENTLE' | 'S2_MILD' | 'S3_MODERATE' | 'S4_INTENSE'

export interface SSSAssignmentInput {
  warnings: EnhancedContentWarning[]
  title: string
  author?: string
  description?: string
}

export interface SSSAssignmentResult {
  sss_level: SSSLevel
  sss_notes: string
}

/** Default when no warnings: low intensity, note that assignment was defaulted. */
const DEFAULT_NO_WARNINGS: SSSAssignmentResult = {
  sss_level: 'S1_GENTLE',
  sss_notes: 'S1_GENTLE – No content warnings; defaulting to low emotional intensity.',
}

/** Result used when there is no description or enrichment to assess (0 warnings, no input). Used by scan pipeline. */
export const S0_NO_INPUT_SSS_RESULT: SSSAssignmentResult = {
  sss_level: 'S0_NO_INPUT',
  sss_notes:
    'No description or community content warnings were available, so emotional intensity could not be assessed.',
}

/**
 * System prompt for the SSS assignment agent.
 * Encodes the triage process: themes → explicitness/frequency → emotional-load band → short notes.
 * Exported so callers can inspect or document the agent behavior.
 *
 * Reader-activation / emotion-trigger framing informed by (ideas-only, cited):
 * - EmoTrigger: Singh et al., "Language Models (Mostly) Do Not Consider Emotion Triggers When Predicting Emotion", NAACL 2024. https://aclanthology.org/2024.naacl-short.51/
 * - CovidET: Zhan et al., "Why Do You Feel This Way? Summarizing Triggers of Emotions in Social Media Posts", EMNLP 2022. https://aclanthology.org/2022.emnlp-main.642/
 * See docs/THIRD_PARTY_RESOURCES.md.
 */
export const SSS_ASSIGNMENT_SYSTEM_PROMPT = `You assign the Subtext Suitability Scale (SSS) for a book. SSS is a **reader-focused** emotional intensity rating: how intense the reading experience will feel to a typical reader. It is **assigned** from judgment, not calculated from a formula, and is **independent** of legal or ACB classification.

## Your task
Given a list of content warnings (and optional book metadata), output exactly one SSS level and a short justification note. Consider what in the content may **trigger or activate** readers emotionally—i.e. what might evoke distress or strong feeling—not only which themes are present.

## Triage process
1. **Identify major sensitive themes** from the warnings across domains—e.g. violence; sexual violence; self-harm and suicide; stigma, bigotry, or discrimination; mental health; death, grief, and loss; abuse; other distressing content. Do not over-focus on violence or sexual content alone. Note whether themes are only referenced/implied or actually depicted on-page.
2. **Gauge explicitness and frequency**: Are there a few mild references, or frequent, graphic depictions? Soft anchors: "brief" might mean one short mention or a single scene; "frequent" might mean multiple chapters or key scenes. Consider whether the tone is reflective and distant or visceral and immersive.
3. **Assign the band by emotional load**:
   - **S0_NO_INPUT**: Use only when there is effectively no information to assess emotional intensity (no description, no warnings, and no external context). If you genuinely have no meaningful information (no warnings and no usable description/context), assign S0_NO_INPUT with a note explaining that emotional intensity could not be assessed.
   - **S1_GENTLE**: Very low-intensity, brief difficulty. Mild or low-stakes distress; mostly off-page or implied (e.g. vague references to past hardship).
   - **S2_MILD**: Some upsetting moments, light tone. Noticeable emotional weight but not overwhelming for most readers; sensitive topics may appear but are brief or mostly off-page.
   - **S3_MODERATE**: Recurring difficult content. Clear, on-page depictions of upsetting events; multiple instances; or a generally heavy tone.
   - **S4_INTENSE**: Sustained distressing content. Graphic, prolonged, or frequent depictions of traumatic content; likely to be very activating for trauma-affected readers.
4. **Write a short sss_notes** (one or two sentences) justifying the level, e.g.:
   - "S3_MODERATE – multiple on-page scenes of domestic violence, emotionally intense but not graphic."
   - "S4_INTENSE – graphic sexual violence described in detail and revisited in flashbacks."
   - "S2_MILD – themes of grief and loss, mostly referenced rather than depicted on-page."

## Output format
Respond with valid JSON only, no markdown or extra text:
{"sss_level":"S0_NO_INPUT"|"S1_GENTLE"|"S2_MILD"|"S3_MODERATE"|"S4_INTENSE","sss_notes":"Your short justification here."}`

const VALID_LEVELS: SSSLevel[] = ['S0_NO_INPUT', 'S1_GENTLE', 'S2_MILD', 'S3_MODERATE', 'S4_INTENSE']

function parseResponse(text: string): SSSAssignmentResult | null {
  const trimmed = text.trim().replace(/^```json?\s*|\s*```$/g, '').trim()
  try {
    const parsed = JSON.parse(trimmed) as { sss_level?: string; sss_notes?: string }
    const level = parsed.sss_level as SSSLevel | undefined
    const notes = typeof parsed.sss_notes === 'string' ? parsed.sss_notes.trim() : ''
    if (VALID_LEVELS.includes(level!) && notes.length > 0) {
      return { sss_level: level!, sss_notes: notes }
    }
  } catch {
    // ignore
  }
  return null
}

/**
 * Assign SSS level and notes from content warnings and book metadata.
 * When warnings are absent or sparse, returns S1_GENTLE with a default note (no API call).
 */
export async function assignSSS(input: SSSAssignmentInput): Promise<SSSAssignmentResult> {
  const { warnings, title, author, description } = input

  if (!warnings || warnings.length === 0) {
    return DEFAULT_NO_WARNINGS
  }

  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    console.warn('[SSS] OPENAI_API_KEY missing; returning default S2_MILD.')
    return {
      sss_level: 'S2_MILD',
      sss_notes: 'S2_MILD – SSS assignment skipped (no API key); default moderate-low intensity.',
    }
  }

  const warningsSummary = warnings.map(w => ({
    subcategory_id: w.subcategory_id,
    severity: w.severity,
    description: w.description ?? undefined,
    reasoning: w.reasoning ?? undefined,
  }))

  const userMessage = `Book: "${title}" by ${author || 'Unknown Author'}
${description ? `Description (excerpt): ${description.slice(0, 500)}${description.length > 500 ? '…' : ''}` : ''}

Content warnings (${warnings.length}):
${JSON.stringify(warningsSummary, null, 2)}

Assign SSS level and write sss_notes. Reply with JSON only.`

  try {
    const openai = new OpenAI({ apiKey })
    const completion = await openai.chat.completions.create({
      model: process.env.SSS_MODEL || 'gpt-4o-mini',
      messages: [
        { role: 'system', content: SSS_ASSIGNMENT_SYSTEM_PROMPT },
        { role: 'user', content: userMessage },
      ],
      response_format: { type: 'json_object' },
      max_tokens: 300,
    })

    const content = completion.choices[0]?.message?.content
    if (content) {
      const result = parseResponse(content)
      if (result) return result
    }
  } catch (err) {
    console.error('[SSS] Assignment failed:', err)
  }

  return {
    sss_level: 'S2_MILD',
    sss_notes: 'S2_MILD – SSS assignment could not be completed; defaulting to moderate-low intensity.',
  }
}
