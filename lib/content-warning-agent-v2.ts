/**
 * Modern Agent Implementation using Runner + withTrace API
 * 
 * This is the EXPERIMENTAL/DEBUGGING agent implementation using the new Runner API.
 * 
 * Performance: 22-39% slower than the old run() API pattern
 * Observability: Excellent - provides detailed traces for debugging
 * Status: Use for staging, debugging, and internal tooling
 * 
 * PRODUCTION: Use lib/content-warning-agent.ts (old pattern) for all user-facing flows
 * 
 * Strategy: See docs/AGENT_PATTERN_STRATEGY.md
 * 
 * FILTER CONFIGURATION:
 * To change the warning filter behavior, modify the filter logic below.
 * - Currently: No filter (keeps all warnings)
 * - Options: See filter logic comments in code
 */

import { Agent, Runner, withTrace, tool, setDefaultOpenAIKey, type AgentInputItem } from "@openai/agents";
import { z } from "zod";
import { 
  WARNING_CATEGORIES, 
  SEVERITY_MAPPING, 
  getSeverityFromScore,
  getValidSubcategoriesForCategory,
  validateSubcategoryParent,
  PRESENCE_TYPES,
  DETAIL_LEVELS,
  type PresenceType,
  type DetailLevel
} from "./config/taxonomy-v2";

// Import web search and other utilities from original
import { performWebSearch } from "./content-warning-agent";

// Re-export types for compatibility
export type ContentWarning = {
  category_id: string;
  subcategory_id?: string | null;
  description: string;
  score: number;
  severity: 'mild' | 'moderate' | 'severe';
  reasoning: string;
  presence?: PresenceType;
  detail_level?: DetailLevel | null;
  source_url?: string | null;
  category?: string; // Legacy field
  id?: string;
  helpful_count?: number;
  not_helpful_count?: number;
  is_spoiler?: boolean;
  is_author_verified?: boolean;
};

// Import schemas from original (or define here)
const ContentWarningSchema = z.object({
  category_id: z.enum([
    'mental_health',
    'sexual_content',
    'emotional_abuse_or_toxic_relationships',
    'bullying_or_social_cruelty',
    'violence',
    'substance_use_or_alcohol',
    'death_or_grief',
    'discrimination',
    'language',
    'other'
  ]),
  subcategory_id: z.string().optional().nullable(),
  description: z.string(),
  score: z.number().min(0).max(1),
  reasoning: z.string(),
  presence: z.enum(['on_page', 'off_page', 'flashback', 'referenced', 'implied']).optional().default('on_page'),
  detail_level: z.enum(['graphic', 'moderate', 'vague', 'clinical']).optional().nullable(),
  is_spoiler: z.boolean().optional().default(false),
  is_author_verified: z.boolean().optional().default(false),
  source_url: z.string().optional().nullable(),
}).refine(
  (data) => {
    if (data.subcategory_id) {
      return validateSubcategoryParent(data.category_id, data.subcategory_id);
    }
    return true;
  },
  {
    message: "subcategory_id must belong to the specified category_id",
    path: ["subcategory_id"]
  }
);

const FindBookOutputSchema = z.object({
  book_found: z.boolean(),
  book_title: z.string().optional().nullable(),
  book_author: z.string().optional().nullable(),
  book_description: z.string().optional().nullable(),
  book_categories: z.array(z.string()).optional().nullable(),
  book_cover_url: z.string().optional().nullable(),
  content_warnings: z.array(ContentWarningSchema).optional().default([]),
  classification_rating: z.enum(['G', 'PG', 'M', 'MA15+', 'R18+']).optional().nullable(),
  confidence: z.enum(['low', 'medium', 'high']).optional().default('medium'),
  reasoning: z.string().optional().default("AI-found book information and generated warnings")
});

// Helper to ensure API key
function ensureOpenAIKey(): string | null {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.error('[Agent V2] ❌ OPENAI_API_KEY not found');
    return null;
  }
  const trimmedKey = apiKey.trim();
  if (!trimmedKey.startsWith('sk-')) {
    console.warn('[Agent V2] ⚠️ OPENAI_API_KEY format looks invalid');
  }
  setDefaultOpenAIKey(trimmedKey);
  console.log('[Agent V2] ✅ OpenAI API key configured (length:', trimmedKey.length, ')');
  return trimmedKey;
}

// Web search tool
const webSearchTool = tool({
  description: 'Search the web for book information, plot summaries, and content warnings. Use this when the book description is missing or insufficient. IMPORTANT: Use this tool FIRST if no description was provided. Search by ISBN first, then by title+author if needed.',
  parameters: z.object({
    query: z.string().describe('The search query. For best results: 1) Start with ISBN: "ISBN 9780593440872" or just "9780593440872", 2) Then try title+author: "Book Lovers Emily Henry plot summary", 3) Finally try: "Book Lovers Emily Henry content warnings"')
  }),
  execute: performWebSearch
});

// Instruction modes (same as original)
const getOldInstructions = () => `
**STRATEGY**: 
1. If description missing/short → web search for plot summary
2. **Use internal knowledge** if search fails - you know popular books (e.g., "1984" has violence/torture, "Twisted Love" has dark romance themes)
3. **Genre awareness**: Romance/fantasy typically has sexual content, violence, mature themes
4. **Well-known books**: Use training knowledge for recognized books
5. **When search fails**: Generate warnings from genre conventions, author patterns, title keywords
6. **Always include classification_rating** (G/PG/M/MA15+/R18+)
7. **Err on caution** - better to warn than miss
8. **Author sites = GOLD STANDARD** - set is_author_verified=true if found
9. **Use subcategories** for specificity
`;

const getNewInstructions = () => `
**NO ASSUMPTIONS - EVIDENCE ONLY**:
1. **ONLY analyze THIS BOOK** - No assumptions from author reputation, genre, or similar books
2. **Evidence-based**: Use description or web search results for THIS SPECIFIC BOOK only
3. **If insufficient info**: Return [] with confidence='low', reasoning="Insufficient information about this specific book"
4. **Author sites = GOLD STANDARD** - set is_author_verified=true if found
5. **Always include classification_rating** (G/PG/M/MA15+/R18+)
6. **Use subcategories** for specificity
7. **Reasoning must cite evidence** - reference description or search results, not author/genre patterns
`;

const getHybridInstructions = () => `
**HYBRID APPROACH**:
1. **Evidence First**: Use description or web search for THIS SPECIFIC BOOK. Author sites = GOLD STANDARD (set is_author_verified=true)
2. **ANALYZE DESCRIPTIONS THOROUGHLY**: When a description exists, you MUST analyze it for:
   - Subtle themes (e.g., "cutthroat", "toxic", "controlling", "manipulative", "abusive", "trauma", "grief", "loss", "anxiety", "depression")
   - Workplace dynamics that could indicate controlling behavior or emotional abuse
   - Relationship dynamics that suggest toxic patterns
   - Mental health themes (anxiety, depression, trauma, grief)
   - Professional pressure that could indicate controlling behavior
3. **Inference Second**: Only if evidence insufficient. Romance: no explicit sex unless "Steamy/Spice/Erotica". Thriller: no gore unless "Horror/Slasher/Dark"
4. **False Positive Checks**: Death≠Grief (unless processing loss), Action≠Violence (unless gore), Non-fiction=clinical detail
5. **Always include classification_rating** (G/PG/M/MA15+/R18+)
6. **Reasoning**: State evidence_type (verified/inferred), sources_checked, key_evidence. MUST cite specific words/phrases from description that indicate warnings
7. **Use subcategories** for specificity
8. **Dark Romance**: Distinguish tropes (CNC/dub-con) vs triggers (actual assault). Clarify in reasoning
`;

// Base agent config
const getBaseAgentConfig = (model: string = "gpt-4o", instructionMode: 'old' | 'new' | 'hybrid' = 'hybrid') => ({
  name: "Content Warning Agent",
  model: model,
  instructions: `
You generate content warnings for books using Australian Classification Board standards.

## Taxonomy
Use category_id (required) and subcategory_id (recommended). Categories:
${WARNING_CATEGORIES.map(cat => `- ${cat.id}: ${cat.subcategories.map(s => s.id).join(', ')}`).join('\n')}

## Reasoning Rules (CRITICAL)
- Use categorical language: "Contains themes of X" NOT "Character Y does Z"
- NO plot details, character names, or story events
- Examples: ✅ "Contains themes of sexual violence" ❌ "Protagonist is raped"

## Context Fields
- presence: on_page|off_page|flashback|referenced|implied
- detail_level: graphic|moderate|vague|clinical
- is_spoiler: true if reveals major plot twist

## Severity Scores (0.0-1.0)
- 0.0-0.30: G (Very Mild)
- 0.31-0.55: PG (Mild)
- 0.56-0.80: M (Moderate)
- 0.81-1.0: MA15+/R18+ (Severe)

## Classification
Based on highest score: G (0-0.20), PG (0.21-0.40), M (0.41-0.70), MA15+ (0.71-0.90), R18+ (0.91-1.0)

${instructionMode === 'old' ? getOldInstructions() : instructionMode === 'new' ? getNewInstructions() : getHybridInstructions()}

**Final Check**: Review reasoning - use categorical language only. If no warnings needed, return empty array: []`
});

// Classification context type
type ClassificationContext = any;

// Simplified classification (same fallback as original)
function classifySeverity(context: ClassificationContext, model?: string): { severity: 'mild' | 'moderate' | 'severe'; reasoning?: string } {
  // Fallback implementation - same as original
  const score = context.score || 0;
  return {
    severity: getSeverityFromScore(score) === 'none' ? 'mild' : getSeverityFromScore(score) as 'mild' | 'moderate' | 'severe',
    reasoning: `Score-based classification: ${score.toFixed(2)}`
  };
}

/**
 * Modern version using Runner + withTrace
 */
export const findBookAndGenerateWarningsV2 = async (
  isbn: string,
  model: string = "gpt-4o",
  instructionMode: 'old' | 'new' | 'hybrid' = 'hybrid'
): Promise<{
  book_found: boolean;
  book_title?: string;
  book_author?: string;
  book_description?: string;
  book_categories?: string[];
  book_cover_url?: string;
  content_warnings: ContentWarning[];
  classification_rating?: 'G' | 'PG' | 'M' | 'MA15+' | 'R18+';
  confidence: 'low' | 'medium' | 'high';
  reasoning: string;
  raw_output?: any;
}> => {
  const apiKey = ensureOpenAIKey();
  if (!apiKey) {
    return {
      book_found: false,
      content_warnings: [],
      confidence: 'low',
      reasoning: 'Configuration error: OPENAI_API_KEY not set',
    };
  }

  console.log('[findBookAndGenerateWarningsV2] ✅ API key available, creating agent...');
  let capturedOutput: z.infer<typeof FindBookOutputSchema> | null = null;

  const submitTool = tool({
    name: 'submit_findings',
    description: 'Submit the final findings of the book analysis. You MUST call this tool to finish the task.',
    parameters: FindBookOutputSchema,
    execute: async (args) => {
      console.log('[Agent V2] submit_findings execute() called');
      console.log('[Agent V2] submit_findings args type:', typeof args);
      console.log('[Agent V2] submit_findings args keys:', Object.keys(args || {}));
      console.log('[Agent V2] submit_findings called with:', JSON.stringify({
        book_found: args.book_found,
        book_title: args.book_title,
        book_author: args.book_author,
        description_length: args.book_description?.length || 0,
        warnings_count: args.content_warnings?.length || 0,
        confidence: args.confidence,
        reasoning: args.reasoning?.substring(0, 200),
      }, null, 2));
      if (args.content_warnings && args.content_warnings.length > 0) {
        console.log('[Agent V2] Warnings submitted:', args.content_warnings.map((w: any) => ({
          category: w.category_id,
          subcategory: w.subcategory_id,
          score: w.score,
          description: w.description?.substring(0, 60),
        })));
      } else {
        console.log('[Agent V2] ⚠️ NO WARNINGS submitted by agent despite description length:', args.book_description?.length || 0);
      }
      // Deep clone to prevent mutation
      capturedOutput = JSON.parse(JSON.stringify(args));
      console.log('[Agent V2] capturedOutput set, value:', capturedOutput ? 'exists' : 'null', 'warnings:', capturedOutput?.content_warnings?.length || 0);
      console.log('[Agent V2] Full capturedOutput:', JSON.stringify(capturedOutput, null, 2));
      return "Findings submitted.";
    },
  });

  const agentConfig = getBaseAgentConfig(model, instructionMode);
  const agent = new Agent({
    ...agentConfig,
    modelSettings: {
      store: true // Store conversation for context
    },
    tools: [webSearchTool, submitTool],
    instructions: agentConfig.instructions + `

**WORKFLOW (MANDATORY):**
1. Search for book info (if description missing)
2. **ANALYZE THE DESCRIPTION THOROUGHLY**: If a book description is provided (even if short), you MUST:
   - Read the ENTIRE description carefully
   - Look for keywords indicating themes: "cutthroat", "toxic", "controlling", "manipulative", "abusive", "trauma", "grief", "loss", "anxiety", "depression", "pressure", "stress", "conflict", "violence", "death", "loss"
   - Identify workplace dynamics that suggest controlling behavior (e.g., "cutthroat literary agent" suggests professional pressure/controlling behavior)
   - Identify relationship dynamics that suggest toxic patterns
   - Identify mental health themes
   - Generate warnings for ANY themes found, even if subtle
3. Generate warnings based on the description analysis - be thorough, not conservative
4. **CALL submit_findings tool** - This is REQUIRED to finish. Even if you find no warnings, you must still call this tool with an empty array.

**CRITICAL**: If a description exists (any length > 0), you MUST analyze it completely. Look for subtle themes, not just explicit content. Words like "cutthroat", "toxic", "controlling", "pressure", "stress" indicate potential warnings.`
  });

  console.log('[findBookAndGenerateWarningsV2] Agent created successfully');

  // Prepare input text (same as original)
  const inputText = instructionMode === 'old' ? `
I need you to find information about a book with ISBN: ${isbn}

**SEARCH STRATEGY:**
1. Use web search with the ISBN directly: "${isbn}" or "isbn ${isbn}" - the search tool will automatically detect ISBNs and search Google Books
2. Also try searching for variations like "ISBN ${isbn} book" or "${isbn} book title author"
3. If the ISBN search fails to return a description or cover, try searching for the book by Title + Author if you can find that information.

**OUTPUT REQUIREMENTS:**
1. Return the book metadata (title, author, description, cover URL).
2. Analyze the content and return a list of warnings with scores (0.0-1.0).
3. Assign a classification rating (G, PG, M, MA15+, R18+).
4. Provide a confidence level and reasoning.
5. **MANDATORY FINAL STEP: You MUST call the submit_findings tool with your results. This is REQUIRED to complete the task.**

**CRITICAL: Categorical Reasoning Enforcement**
- For each warning's \`reasoning\` field, use ONLY categorical taxonomy language (e.g., "Contains themes of X", "Depictions of Y")
- DO NOT include specific plot points, character names, story events, or narrative details
- Example: "Contains pervasive themes of sexual violence and exploitation" NOT "Character is sold as a prostitute"
- The reasoning should describe the TYPE of content, not specific plot occurrences
` : `
I need you to find information about a book with ISBN: ${isbn}

**SEARCH STRATEGY:**
1. Use web search with the ISBN directly: "${isbn}" or "isbn ${isbn}" - the search tool will automatically detect ISBNs and search Google Books
2. Also try searching for variations like "ISBN ${isbn} book" or "${isbn} book title author"
3. If the ISBN search fails to return a description or cover, try searching for the book by Title + Author if you can find that information.

**CRITICAL - NO ASSUMPTIONS:**
- Only generate warnings based on verified information about THIS SPECIFIC BOOK (identified by ISBN ${isbn})
- Do NOT make assumptions based on author's other works, genre conventions, or similar books
- If you cannot find verified information about THIS SPECIFIC BOOK, set book_found: false or return empty warnings with confidence: 'low'

**OUTPUT REQUIREMENTS:**
1. Return the book metadata (title, author, description, cover URL) ONLY if you can verify this is the correct book for ISBN ${isbn}.
2. Analyze the content of THIS SPECIFIC BOOK and return a list of warnings with scores (0.0-1.0) based ONLY on verified information about THIS BOOK.
3. Assign a classification rating (G, PG, M, MA15+, R18+) based on THIS BOOK's content.
4. Provide a confidence level and reasoning that cites specific evidence from THIS BOOK's description or verified sources.
5. **MANDATORY FINAL STEP: You MUST call the submit_findings tool with your results. This is REQUIRED to complete the task.**

**CRITICAL: Categorical Reasoning Enforcement**
- For each warning's \`reasoning\` field, use ONLY categorical taxonomy language (e.g., "Contains themes of X", "Depictions of Y")
- DO NOT include specific plot points, character names, story events, or narrative details
- Example: "Contains pervasive themes of sexual violence and exploitation" NOT "Character is sold as a prostitute"
- The reasoning should describe the TYPE of content, not specific plot occurrences
`;

  // Helper for TPM-aware retry with Runner API
  const runWithRetry = async (maxRetries = 2): Promise<any> => {
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await withTrace("findBookAndGenerateWarningsV2", async () => {
          const conversationHistory: AgentInputItem[] = [
            { 
              role: "user", 
              content: [{ type: "input_text", text: inputText }] 
            }
          ];

          const runner = new Runner({
            traceMetadata: {
              __trace_source__: "content-warning-agent-v2",
              instruction_mode: instructionMode,
              isbn: isbn,
            }
          });

          // Add timeout wrapper
          const runPromise = runner.run(agent, conversationHistory);
          const timeoutPromise = new Promise<never>((_, reject) => {
            setTimeout(() => reject(new Error('Agent execution timeout after 60s')), 60000);
          });

          const result = await Promise.race([runPromise, timeoutPromise]);
          
          // Log the result structure to understand what we're getting
          console.log('[Agent V2] Runner result type:', typeof result);
          console.log('[Agent V2] Runner result keys:', result ? Object.keys(result).join(', ') : 'null');
          if (result && typeof result === 'object') {
            console.log('[Agent V2] Runner result.newItems:', result.newItems ? `${result.newItems.length} items` : 'none');
            console.log('[Agent V2] Runner result.finalOutput:', result.finalOutput ? typeof result.finalOutput : 'none');
            console.log('[Agent V2] Runner result.state:', result.state ? Object.keys(result.state).join(', ') : 'none');
            
            // Try to extract tool calls from newItems
            if (result.newItems && Array.isArray(result.newItems)) {
              console.log('[Agent V2] newItems sample:', JSON.stringify(result.newItems.slice(0, 2).map((item: any) => ({
                type: item.type,
                rawItemType: item.rawItem?.type,
                role: item.rawItem?.role,
                name: item.rawItem?.name,
                hasContent: !!item.rawItem?.content,
              })), null, 2));
              
              // Look for tool call output items
              const toolOutputs = result.newItems.filter((item: any) => 
                item.rawItem?.type === 'tool_output' ||
                item.rawItem?.role === 'tool' ||
                item.type === 'tool_output'
              );
              console.log('[Agent V2] Found tool outputs in newItems:', toolOutputs.length);
              
              // Also check state for tool calls
              if (result.state?._generatedItems) {
                const generatedItems = result.state._generatedItems;
                console.log('[Agent V2] Generated items count:', Array.isArray(generatedItems) ? generatedItems.length : 'not array');
                if (Array.isArray(generatedItems)) {
                  const toolItems = generatedItems.filter((item: any) => 
                    item.type === 'tool_call' || item.type === 'tool_output'
                  );
                  console.log('[Agent V2] Tool items in generatedItems:', toolItems.length);
                  if (toolItems.length > 0) {
                    console.log('[Agent V2] Tool items sample:', JSON.stringify(toolItems.slice(0, 2), null, 2).substring(0, 500));
                  }
                }
              }
            }
          }
          
          return result;
        });
      } catch (error: any) {
        const errorMessage = error?.message || '';
        const isRateLimit = error?.status === 429 || 
                          errorMessage.includes('429') || 
                          errorMessage.includes('rate limit') || 
                          errorMessage.includes('TPM');
        
        if (isRateLimit && attempt < maxRetries) {
          const resetHeader = error?.headers?.get?.('x-ratelimit-reset-tokens') || 
                             error?.headers?.['x-ratelimit-reset-tokens'] ||
                             error?.error?.headers?.['x-ratelimit-reset-tokens'];
          
          const resetSeconds = resetHeader ? parseFloat(resetHeader) : 45;
          const waitTime = Math.ceil((resetSeconds + 0.5) * 1000);
          
          console.log(`[Agent V2] Rate limit hit, waiting ${waitTime}ms before retry ${attempt + 1}/${maxRetries}...`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
          continue;
        }
        
        throw error;
      }
    }
  };

  try {
    const result = await runWithRetry();
    
    console.log('[Agent V2] After runWithRetry, capturedOutput:', capturedOutput ? 'exists' : 'null');
    if (capturedOutput) {
      console.log('[Agent V2] capturedOutput content:', {
        book_found: capturedOutput.book_found,
        warnings_count: capturedOutput.content_warnings?.length || 0,
      });
    }

    // Fallback if agent didn't call submit tool
    if (!capturedOutput) {
      console.warn('[Agent V2] Agent did not call submit_findings, using fallback');
      capturedOutput = {
        book_found: false,
        content_warnings: [],
        confidence: 'low' as const,
        reasoning: 'Agent workflow incomplete',
        classification_rating: 'PG' as const,
      };
    }

    const parsed = capturedOutput as z.infer<typeof FindBookOutputSchema>;
    
    console.log('[Agent V2] Parsed output:', {
      book_found: parsed.book_found,
      has_description: !!parsed.book_description,
      description_length: parsed.book_description?.length || 0,
      raw_warnings_count: parsed.content_warnings?.length || 0,
      confidence: parsed.confidence,
      warnings_detail: parsed.content_warnings?.map((w: any) => ({
        category: w.category_id,
        subcategory: w.subcategory_id,
        score: w.score,
        score_type: typeof w.score,
      })) || [],
    });
    
    // Process warnings (same logic as original)
    const classificationContexts: ClassificationContext[] = (parsed.content_warnings || []).map(w => ({
      category_id: w.category_id,
      subcategory_id: w.subcategory_id || null,
      description: w.description,
      score: w.score,
      presence: w.presence || 'on_page',
      detail_level: w.detail_level || null,
      book_genre: parsed.book_categories?.join(', ') || undefined,
      book_description: parsed.book_description || undefined
    }));

    // Classify all warnings
    let classificationResults;
    try {
      if (classificationContexts.length > 0) {
        classificationResults = await Promise.all(
          classificationContexts.map(context => classifySeverity(context, model))
        );
        console.log(`[Agent V2] Classified ${classificationResults.length} warnings`);
      } else {
        classificationResults = null;
      }
    } catch (error) {
      console.warn('[Agent V2] Classification failed, falling back to score-based mapping:', error);
      classificationResults = null;
    }

    const mappedWarnings: ContentWarning[] = (parsed.content_warnings || []).map((w, index) => {
      console.log(`[Agent V2] Processing warning ${index + 1}:`, {
        category: w.category_id,
        subcategory: w.subcategory_id,
        score: w.score,
        score_type: typeof w.score,
      });
      
      // Validate subcategory
      let validatedSubcategoryId = w.subcategory_id;
      if (w.subcategory_id && !validateSubcategoryParent(w.category_id, w.subcategory_id)) {
        console.warn(`Invalid subcategory ${w.subcategory_id} for category ${w.category_id}, removing subcategory`);
        validatedSubcategoryId = null;
      }

      // Use classification result if available
      let severity: 'mild' | 'moderate' | 'severe';
      if (classificationResults && classificationResults[index]) {
        severity = classificationResults[index].severity;
        if (classificationResults[index].reasoning) {
          w.reasoning = `${w.reasoning || ''} [Classification: ${classificationResults[index].reasoning}]`.trim();
        }
        console.log(`[Agent V2] Warning ${index + 1} severity from classification:`, severity);
      } else {
        const scoreBasedSeverity = getSeverityFromScore(w.score);
        console.log(`[Agent V2] Warning ${index + 1} score-based severity:`, scoreBasedSeverity, `(score: ${w.score})`);
        severity = scoreBasedSeverity === 'none' ? 'mild' : scoreBasedSeverity as 'mild' | 'moderate' | 'severe';
      }

      return {
        ...w,
        subcategory_id: validatedSubcategoryId,
        severity: severity,
        category: w.category_id,
        id: crypto.randomUUID(),
        helpful_count: 0,
        not_helpful_count: 0
      };
    });

    // Filter logic: Choose one option below by uncommenting it
    
    // OPTION 1: No filter - keep all warnings (even score 0.0) - CURRENTLY ACTIVE
    const activeWarnings = mappedWarnings;
    
    // OPTION 2: Filter only very low scores (< 0.1)
    // const activeWarnings = mappedWarnings.filter(w => w.score >= 0.1);
    
    // OPTION 3: Filter 'none' severity (score <= 0.30) - original behavior
    // const activeWarnings = mappedWarnings.filter(w => getSeverityFromScore(w.score) !== 'none');
    
    // OPTION 4: Custom threshold - keep warnings with score >= threshold
    // const FILTER_THRESHOLD = 0.2; // Adjust this value (0.0 = no filter, 0.3 = filter 'none' severity)
    // const activeWarnings = mappedWarnings.filter(w => {
    //   if (w.score >= FILTER_THRESHOLD) {
    //     return true;
    //   }
    //   console.log(`[Agent V2] Filtering out warning with score ${w.score} (below threshold ${FILTER_THRESHOLD})`);
    //   return false;
    // });
    
    console.log('[Agent V2] Warning processing:', {
      raw_warnings: mappedWarnings.length,
      after_filter: activeWarnings.length,
      filtered_out: mappedWarnings.length - activeWarnings.length,
      mapped_severities: mappedWarnings.map(w => ({ score: w.score, severity: getSeverityFromScore(w.score) })),
    });

    // Infer classification rating if not provided
    let classificationRating = parsed.classification_rating;
    if (!classificationRating) {
      if (activeWarnings.length === 0) {
        classificationRating = 'G';
      } else {
        const hasSevere = activeWarnings.some(w => w.severity === 'severe');
        const hasModerate = activeWarnings.some(w => w.severity === 'moderate');
        if (hasSevere) classificationRating = 'MA15+';
        else if (hasModerate) classificationRating = 'M';
        else classificationRating = 'PG';
      }
    }

    return {
      book_found: parsed.book_found,
      book_title: parsed.book_title || undefined,
      book_author: parsed.book_author || undefined,
      book_description: parsed.book_description || undefined,
      book_categories: parsed.book_categories || undefined,
      book_cover_url: parsed.book_cover_url || undefined,
      content_warnings: activeWarnings,
      classification_rating: classificationRating || undefined,
      confidence: parsed.confidence,
      reasoning: parsed.reasoning,
      raw_output: result, // Includes trace information!
    };
  } catch (error) {
    console.error('[Agent V2] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return {
      book_found: false,
      content_warnings: [],
      confidence: 'low',
      reasoning: `Error: ${errorMessage}`,
    };
  }
};
