import { Agent, run, setDefaultOpenAIKey } from "@openai/agents";
import { z } from "zod";
import { WARNING_CATEGORIES, getCategoryById, getSubcategoryById } from "@/lib/config/taxonomy-v2";

// Ensure API key is set
function ensureOpenAIKey(): string | null {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.error('[Classification Agent] ❌ OPENAI_API_KEY not found');
    return null;
  }
  setDefaultOpenAIKey(apiKey.trim());
  return apiKey;
}

export type SeverityLevel = 'mild' | 'moderate' | 'severe';

export interface ClassificationContext {
  category_id: string;
  subcategory_id?: string | null;
  description: string;
  score: number; // 0.0-1.0 from content warning agent
  presence?: 'on_page' | 'off_page' | 'flashback' | 'referenced' | 'implied';
  detail_level?: 'graphic' | 'moderate' | 'vague' | 'clinical' | null;
  narrative_centrality?: 'central' | 'significant' | 'background' | 'brief';
  frequency?: 'repeated' | 'multiple' | 'single' | 'brief';
  book_genre?: string;
  book_description?: string;
}

export interface ClassificationResult {
  severity: SeverityLevel;
  confidence: 'high' | 'medium' | 'low';
  reasoning: string;
  factors_considered: string[];
}

/**
 * Classification Agent
 * 
 * Determines severity level (mild/moderate/severe) based on multiple contextual factors,
 * not just a numeric score. This provides more accurate and nuanced severity assessment.
 */
const getClassificationAgentConfig = (model: string = "gpt-4o") => ({
  name: "Severity Classification Agent",
  model: model,
  instructions: `
You are an expert content classification agent specializing in determining appropriate severity levels for content warnings based on Australian Classification Board (ACB) standards.

## Your Task

Given a content warning with its context, determine the appropriate severity level: **mild**, **moderate**, or **severe**.

## Severity Guidelines (ACB-Aligned)

### MILD (PG-equivalent)
- **When to use:**
  - Brief mentions or references
  - Implied content (not explicit)
  - Background themes (not central to plot)
  - Vague or clinical descriptions
  - Low impact on narrative
  - Single, brief occurrence
  - Educational or contextual use

**Examples:**
- Brief mention of a character's past trauma (referenced, not shown)
- Vague reference to violence ("there was a fight")
- Clinical discussion of mental health
- Background theme of discrimination (not central)

### MODERATE (M-equivalent)
- **When to use:**
  - Present but not central to plot
  - Some detail but not graphic
  - Moderate explicitness
  - Significant but not prolonged
  - Multiple occurrences but not pervasive
  - Clear impact but not extreme

**Examples:**
- Detailed but non-graphic violence
- Sexual content with some detail but not explicit
- Mental health themes that are significant but not the main focus
- Moderate emotional abuse shown on-page

### SEVERE (MA15+ / R18+ equivalent)
- **When to use:**
  - Central to plot or narrative
  - Graphic or explicit descriptions
  - High impact, prolonged, or repeated
  - Detailed and explicit content
  - Extreme or intense depictions
  - Content that would require age restrictions

**Examples:**
- Graphic violence described in detail
- Explicit sexual content
- Sexual violence or assault
- Detailed self-harm or suicide
- Prolonged abuse or trauma
- Graphic body horror

## Classification Factors

Consider ALL of these factors when determining severity:

1. **Narrative Centrality**
   - Central to plot → Higher severity
   - Significant but not central → Moderate
   - Background or brief → Mild

2. **Explicitness (Detail Level)**
   - Graphic → Higher severity
   - Moderate detail → Moderate
   - Vague/clinical → Mild

3. **Presence (How it appears)**
   - On-page (shown directly) → Higher severity
   - Off-page (happens off-screen) → Lower severity
   - Referenced (discussed) → Lower severity
   - Implied (suggested) → Lower severity

4. **Frequency**
   - Repeated/pervasive → Higher severity
   - Multiple occurrences → Moderate
   - Single/brief → Mild

5. **Category Sensitivity**
   - Some categories are inherently more severe:
     - Sexual violence → Always severe
     - Self-harm → Usually severe
     - Graphic violence → Usually severe
     - Sexual content → Varies by explicitness
     - Mental health → Varies by detail and centrality

6. **Genre Context**
   - Horror/Thriller: Violence may be expected, but graphic detail still matters
   - Romance: Sexual content may be expected, but explicitness matters
   - Educational: Clinical descriptions are typically mild

7. **Score Context**
   - The numeric score (0.0-1.0) is a starting point, but context overrides
   - A score of 0.6 with graphic detail and central plot = severe
   - A score of 0.6 with vague description and background = moderate

## Classification Rules

1. **Always consider context over score**
   - Don't just map score to severity
   - Consider all factors together

2. **Category-specific rules:**
   - **Sexual violence**: Always severe (regardless of detail level)
   - **Self-harm**: Usually severe (unless very brief/vague)
   - **Graphic violence**: Usually severe (unless stylized/comedic)
   - **Mental health**: Varies by detail and centrality
   - **Discrimination**: Varies by explicitness and impact

3. **Presence overrides:**
   - On-page + graphic = Higher severity
   - Referenced + vague = Lower severity
   - Implied = Usually mild (unless central to plot)

4. **When in doubt:**
   - Err on the side of caution for sensitive categories
   - Consider the most vulnerable readers
   - Better to over-classify than under-classify for safety

## Output Format

Return:
- **severity**: One of "mild", "moderate", or "severe"
- **confidence**: "high" (clear case), "medium" (some ambiguity), or "low" (unclear)
- **reasoning**: Brief explanation of why this severity was chosen
- **factors_considered**: List of key factors that influenced the decision

## Examples

**Example 1:**
- Category: Violence
- Subcategory: Domestic Violence
- Description: "Contains scenes of domestic abuse shown on-page with moderate detail"
- Score: 0.65
- Presence: on_page
- Detail Level: moderate
- Narrative Centrality: significant
- **Classification: MODERATE**
- Reasoning: "Domestic violence is significant and shown on-page, but detail level is moderate (not graphic). This is significant content but not extreme."

**Example 2:**
- Category: Sexual Content
- Subcategory: Sexual Violence
- Description: "Contains sexual assault"
- Score: 0.75
- Presence: on_page
- Detail Level: graphic
- Narrative Centrality: central
- **Classification: SEVERE**
- Reasoning: "Sexual violence is always severe, especially when graphic, on-page, and central to plot. This requires the highest severity rating."

**Example 3:**
- Category: Mental Health
- Subcategory: Anxiety
- Description: "Character experiences anxiety"
- Score: 0.40
- Presence: referenced
- Detail Level: vague
- Narrative Centrality: background
- **Classification: MILD**
- Reasoning: "Anxiety is referenced (not shown), described vaguely, and is a background theme. This is mild severity."

Now classify the provided content warning.
`
});

const ClassificationSchema = z.object({
  severity: z.enum(['mild', 'moderate', 'severe']),
  confidence: z.enum(['high', 'medium', 'low']),
  reasoning: z.string().describe("Brief explanation of why this severity was chosen"),
  factors_considered: z.array(z.string()).describe("List of key factors that influenced the decision")
});

/**
 * Classify severity for a content warning using contextual analysis
 */
export async function classifySeverity(
  context: ClassificationContext,
  model: string = "gpt-4o"
): Promise<ClassificationResult> {
  ensureOpenAIKey();

  const category = getCategoryById(context.category_id);
  const subcategory = context.subcategory_id 
    ? getSubcategoryById(context.category_id, context.subcategory_id)
    : null;

  const agentConfig = getClassificationAgentConfig(model);

  const classificationPrompt = `
Classify the severity for this content warning:

**Category:** ${category?.userLabel || context.category_id}
${subcategory ? `**Subcategory:** ${subcategory.userLabel}` : ''}
**Description:** ${context.description}
**Score (from content agent):** ${context.score.toFixed(2)}
**Presence:** ${context.presence || 'on_page'}
**Detail Level:** ${context.detail_level || 'not specified'}
**Narrative Centrality:** ${context.narrative_centrality || 'not specified'}
**Frequency:** ${context.frequency || 'not specified'}
${context.book_genre ? `**Book Genre:** ${context.book_genre}` : ''}

Based on all these factors, determine the appropriate severity level.
`;

  try {
    const agent = new Agent({
      ...agentConfig,
      tools: []
    });

    const result = await run(agent, classificationPrompt, {
      response_format: { type: "json_object" },
      temperature: 0.3, // Lower temperature for more consistent classification
    });

    // Parse the response
    const responseText = result.messages[result.messages.length - 1].content;
    const parsed = JSON.parse(responseText);
    
    // Validate against schema
    const validated = ClassificationSchema.parse(parsed);
    
    return validated;
  } catch (error) {
    console.error('[Classification Agent] Error:', error);
    
    // Fallback to score-based mapping if classification fails
    const fallbackSeverity = context.score <= 0.30 ? 'mild' 
      : context.score <= 0.55 ? 'mild'
      : context.score <= 0.80 ? 'moderate'
      : 'severe';
    
    return {
      severity: fallbackSeverity as SeverityLevel,
      confidence: 'low',
      reasoning: `Classification agent error. Fallback to score-based mapping (score: ${context.score.toFixed(2)}).`,
      factors_considered: ['score_fallback']
    };
  }
}

/**
 * Batch classify multiple warnings
 */
export async function classifySeverities(
  contexts: ClassificationContext[],
  model: string = "gpt-4o"
): Promise<ClassificationResult[]> {
  // Classify in parallel for efficiency
  const results = await Promise.all(
    contexts.map(context => classifySeverity(context, model))
  );
  
  return results;
}

