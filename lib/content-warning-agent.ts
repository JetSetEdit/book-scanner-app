import { Agent, run, tool } from "@openai/agents";
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

// Configure OpenAI API key

// Note: We don't check for OPENAI_API_KEY here to avoid build-time errors.
// The Agent class will handle missing keys or we can check inside the function.

// Web search tool for the AI agent
export const performWebSearch = async (args: any) => {
  const { query } = args;
  try {
    const results = [];

    // Check if query contains an ISBN (10 or 13 digits)
    const isbnMatch = query.match(/\b\d{10,13}\b/);
    const isbn = isbnMatch ? isbnMatch[0] : null;

    // Helper for fetch with timeout
    const fetchWithTimeout = async (url: string, timeout = 10000) => {
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), timeout);
      try {
        const response = await fetch(url, { signal: controller.signal });
        clearTimeout(id);
        return response;
      } catch (error) {
        clearTimeout(id);
        return null;
      }
    };

    // Helper to validate image (parallelized version)
    const validateImage = async (url: string) => {
      if (!url) return false;
      try {
        const controller = new AbortController();
        const id = setTimeout(() => controller.abort(), 3000);
        const res = await fetch(url, { method: 'HEAD', signal: controller.signal, redirect: 'follow' });
        clearTimeout(id);
        if (!res.ok) return false;
        const len = res.headers.get('content-length');
        if (len) {
          const size = parseInt(len);
          if (size < 1000) return false; // Too small
          if (size === 15567) return false; // Google Books placeholder
        }
        return true;
      } catch (e) { return false; }
    };

    // Helper to find best cover URL by checking all sizes in parallel
    const findBestCover = async (imageLinks: any): Promise<string> => {
      const potentialCovers = [
        imageLinks?.extraLarge,
        imageLinks?.large,
        imageLinks?.medium,
        imageLinks?.thumbnail,
        imageLinks?.smallThumbnail
      ].filter(Boolean).map(url => url?.replace("http:", "https:"));

      if (potentialCovers.length === 0) return "No cover available";

      // Check all cover sizes in parallel
      const validationResults = await Promise.all(
        potentialCovers.map(async (url) => ({
          url,
          valid: await validateImage(url)
        }))
      );

      // Return the first valid cover, or first available if none valid
      const validCover = validationResults.find(r => r.valid);
      return validCover?.url || potentialCovers[0] || "No cover available";
    };

    // Prepare search functions for parallel execution
    const cleanQuery = query.replace(/content warnings|plot summary|official|notes|book|find/gi, "").trim();

    // 1. Google Books API search function
    const searchGoogleBooks = async () => {
      try {
        let gbResponse;
        if (isbn) {
          gbResponse = await fetchWithTimeout(`https://www.googleapis.com/books/v1/volumes?q=isbn:${isbn}&maxResults=3`);
        } else if (cleanQuery.length > 0) {
          gbResponse = await fetchWithTimeout(`https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(cleanQuery)}&maxResults=3`);
        }

        if (!gbResponse) return [];

        const gbData = await gbResponse.json();
        if (!gbData.items || gbData.items.length === 0) return [];

        const googleResults = [];
        for (const item of gbData.items) {
          const info = item.volumeInfo;
          const description = info.description || "No description available";
          const categories = info.categories?.join(", ") || "No categories";
          
          // Use parallelized cover finding
          const coverUrl = await findBestCover(info.imageLinks);

          googleResults.push(`Source: Google Books\nTitle: ${info.title}\nAuthor: ${info.authors?.join(", ") || "Unknown"}\nDescription: ${description}\nCategories: ${categories}\nPublisher: ${info.publisher || "Unknown"}\nPublished: ${info.publishedDate || "Unknown"}\nCover URL: ${coverUrl}`);
        }
        return googleResults;
      } catch (e) {
        return [];
      }
    };

    // 2. Apple Books API search function
    const searchAppleBooks = async () => {
      try {
        let appleResponse;
        if (isbn) {
          appleResponse = await fetchWithTimeout(`https://itunes.apple.com/lookup?isbn=${isbn}`);
          if (appleResponse) {
            const data = await appleResponse.json();
            if (data.resultCount === 0) {
              const titleMatch = query.match(/^(.*?)(?:\s\d{10,13})?$/);
              if (titleMatch && titleMatch[1]) {
                const title = titleMatch[1].trim();
                if (title.length > 5) {
                  appleResponse = await fetchWithTimeout(`https://itunes.apple.com/search?term=${encodeURIComponent(title)}&media=ebook&limit=3`);
                }
              }
            }
          }
        } else if (cleanQuery.length > 0) {
          appleResponse = await fetchWithTimeout(`https://itunes.apple.com/search?term=${encodeURIComponent(cleanQuery)}&media=ebook&limit=3`);
        }

        if (!appleResponse) return [];

        const appleData = await appleResponse.json();
        if (!appleData.results || appleData.results.length === 0) return [];

        return appleData.results.map((item: any) => {
          const highResCover = item.artworkUrl100 ? item.artworkUrl100.replace('100x100', '600x600') : "No cover available";
          return `Source: Apple Books\nTitle: ${item.trackName}\nAuthor: ${item.artistName}\nDescription: ${item.description || "No description"}\nCover URL: ${highResCover}`;
        });
      } catch (e) {
        return [];
      }
    };

    // 3. DuckDuckGo General Search function
    const searchDuckDuckGo = async () => {
      try {
        const ddgResponse = await fetchWithTimeout(`https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json`);
        if (!ddgResponse) return [];

        const ddgData = await ddgResponse.json();
        const ddgResults = [];

        if (ddgData.AbstractText) {
          ddgResults.push(`Source: DuckDuckGo\nSummary: ${ddgData.AbstractText}`);
        }
        if (ddgData.RelatedTopics) {
          for (const topic of ddgData.RelatedTopics.slice(0, 3)) {
            if (topic.Text) {
              ddgResults.push(`Source: DuckDuckGo Related\nInfo: ${topic.Text}`);
            }
          }
        }
        if (ddgData.Image && ddgData.Image.length > 0) {
          ddgResults.push(`Source: DuckDuckGo Image\nImage URL: ${ddgData.Image}`);
        }

        return ddgResults;
      } catch (e) {
        return [];
      }
    };

    // 4. Author Site Search function
    const searchAuthorSites = async () => {
      try {
        let authorQuery = "";
        if (isbn) {
          authorQuery = `"${isbn}" content warnings`;
        } else {
          const authorMatch = cleanQuery.match(/by\s+(.+)/i);
          const authorName = authorMatch ? authorMatch[1] : "";
          if (authorName) {
            authorQuery = `${cleanQuery} site:hannahgrace.co.uk OR site:author-site.com content warnings`;
          } else {
            authorQuery = `${cleanQuery} official author content warnings`;
          }
        }

        const ddgResponse = await fetchWithTimeout(`https://api.duckduckgo.com/?q=${encodeURIComponent(authorQuery)}&format=json`);
        if (!ddgResponse) return [];

        const ddgData = await ddgResponse.json();
        const authorResults = [];

        if (ddgData.AbstractText) {
          authorResults.push(`Source: Official/Author Search\nSummary: ${ddgData.AbstractText}\nURL: ${ddgData.AbstractURL || "N/A"}`);
        }
        if (ddgData.RelatedTopics) {
          for (const topic of ddgData.RelatedTopics.slice(0, 5)) {
            if (topic.Text && topic.FirstURL) {
              authorResults.push(`Source: Official/Author Search\nInfo: ${topic.Text}\nURL: ${topic.FirstURL}`);
            }
          }
        }

        // Also try searching for the author's name directly
        if (!ddgData.AbstractText && !ddgData.RelatedTopics?.length) {
          const authorNameMatch = query.match(/by\s+(.+?)(?:\s+content|\s*$)/i);
          if (authorNameMatch) {
            const authorName = authorNameMatch[1];
            const authorSiteQuery = `${authorName} official website content warnings`;
            const authorResponse = await fetchWithTimeout(`https://api.duckduckgo.com/?q=${encodeURIComponent(authorSiteQuery)}&format=json`);
            if (authorResponse) {
              const authorData = await authorResponse.json();
              if (authorData.AbstractText) {
                authorResults.push(`Source: Author Site Search\nSummary: ${authorData.AbstractText}\nURL: ${authorData.AbstractURL}`);
              }
            }
          }
        }

        return authorResults;
      } catch (e) {
        return [];
      }
    };

    // 5. Direct Author Site Scraping function
    const scrapeAuthorSites = async () => {
      try {
        const authorDomains: Record<string, string> = {
          "hannah grace": "https://www.hannahgrace.co.uk/books",
          "h.d. carlton": "https://hdcarlton.com/library",
          "hd carlton": "https://hdcarlton.com/library",
          "jennifer hallock": "https://www.jenniferhallock.com/content-guidance",
        };

        const cleanQueryLower = query.toLowerCase();
        let targetUrl = "";

        for (const [author, url] of Object.entries(authorDomains)) {
          if (cleanQueryLower.includes(author)) {
            targetUrl = url;
            break;
          }
        }

        if (!targetUrl) return [];

        const response = await fetchWithTimeout(targetUrl);
        if (!response) return [];

        const html = await response.text();
        let bookTitle = "";

        const quoteMatch = query.match(/"([^"]+)"/);
        if (quoteMatch) {
          bookTitle = quoteMatch[1].toLowerCase().replace(/content warnings|plot summary|official|notes|book|find/gi, "").trim();
        } else {
          bookTitle = query.toLowerCase()
            .replace(/content warnings|plot summary|official|notes|book|find|isbn|\d{10,13}|by\s+hannah\s+grace|hannah\s+grace|by\s+h\.d\.\s+carlton|h\.d\.\s+carlton|hd\s+carlton|by\s+jennifer\s+hallock|jennifer\s+hallock/gi, "")
            .trim();
        }

        if (bookTitle && html.toLowerCase().includes(bookTitle)) {
          return [`Source: Direct Author Site Scrape\nInfo: CONFIRMED: The book "${bookTitle}" is listed on the official author website (${targetUrl}) which contains content warnings. You should treat this as a verified source.\nURL: ${targetUrl}`];
        }

        return [];
      } catch (e) {
        return [];
      }
    };

    // Execute all searches in parallel
    const searchStartTime = performance.now();
    const [googleResults, appleResults, ddgResults, authorResults, scrapeResults] = await Promise.all([
      searchGoogleBooks(),
      searchAppleBooks(),
      searchDuckDuckGo(),
      searchAuthorSites(),
      scrapeAuthorSites()
    ]);
    const searchEndTime = performance.now();
    console.log(`⏱️ Parallel web searches completed in ${(searchEndTime - searchStartTime).toFixed(0)}ms`);

    // Combine all results
    results.push(...googleResults, ...appleResults, ...ddgResults, ...authorResults, ...scrapeResults);

    return {
      results: results.length > 0 ? results.join("\n\n---\n\n") : "No results found."
    };
  } catch (error) {
    return { error: `Search failed: ${error instanceof Error ? error.message : 'Unknown error'}` };
  }
};

const webSearchTool = tool({
  description: 'Search the web for book information, plot summaries, and content warnings. Use this to find details when the provided description is insufficient.',
  parameters: z.object({
    query: z.string().describe('The search query, e.g., "It Ends with Us Colleen Hoover content warnings" or "ISBN 9781501110368"')
  }),
  execute: performWebSearch
});

// Define the base agent config
const getBaseAgentConfig = (model: string = "gpt-4o") => ({
  name: "Content Warning Agent",
  model: model,
  instructions: `
You are an expert content warning generator for a book database. Your goal is to analyze book metadata and generate accurate, specific content warnings based on the Australian Classification Board standards.

## Hierarchical Taxonomy (v2.0)

You MUST use the hierarchical taxonomy structure. Each warning has:
- **category_id**: The parent category (required)
- **subcategory_id**: A specific subcategory under the parent (optional but STRONGLY RECOMMENDED)

### Valid Subcategories by Category:

${WARNING_CATEGORIES.map(cat => `
**${cat.userLabel}** (category_id: \`${cat.id}\`)
${cat.subcategories.map(sub => `- \`${sub.id}\`: ${sub.shortDescription} (default severity: ${sub.defaultSeverityHint || 'varies'})`).join('\n')}
`).join('\n')}

### Taxonomy Rules:
1. **ALWAYS specify a subcategory_id when possible** - This provides more specific, useful warnings
2. **subcategory_id MUST belong to its parent category_id** - Validation will fail if mismatched
3. **If unsure of subcategory**, use the parent category only (leave subcategory_id null)
4. **Multiple warnings per category are allowed** - Each warning can have a different subcategory
5. **Example**: A book with both "Disordered Eating" and "Anxiety" would have:
   - Warning 1: \`category_id: "mental_health"\`, \`subcategory_id: "disordered_eating"\`
   - Warning 2: \`category_id: "mental_health"\`, \`subcategory_id: "anxiety"\`

## CRITICAL: Categorical Shielding - Preventing Spoilers in Reasoning

**THE CORE RULE**: The \`reasoning\` field MUST use **Categorical Taxonomy Language**, NOT narrative plot descriptions. This preserves the "Spoiler-Free" value proposition.

### Reasoning Field Requirements (MANDATORY):

1. **Use Standardized Taxonomy Terms**: Reference the category/subcategory taxonomy, not specific plot events.
   - ❌ WRONG (Narrative): "Character A dies in a fire at the end of the book"
   - ✅ CORRECT (Categorical): "Contains themes of character loss and accidental death"

2. **Clinical Detail Level for Reasoning**: The \`reasoning\` field must ALWAYS use clinical, matter-of-fact language that describes the TYPE of content, not the SPECIFIC plot point.
   - ❌ WRONG: "Sold as a child prostitute" (reveals specific plot)
   - ✅ CORRECT: "Contains themes of systemic exploitation and sexual violence involving minors"

3. **Severity ≠ Narrative Detail**: High severity scores (0.81-1.0) indicate impact/frequency, NOT permission to include more plot details in reasoning.
   - High severity should trigger: "Contains pervasive themes of [category]" 
   - NOT: "Character X experiences [specific plot event]"

4. **Spoiler-Free Examples**:
   - ❌ "Main character commits suicide in chapter 12"
   - ✅ "Contains themes of self-harm and suicide"
   - ❌ "Protagonist is raped by their father"
   - ✅ "Contains themes of sexual violence and familial abuse"
   - ❌ "Character dies from drug overdose"
   - ✅ "Contains themes of substance abuse and accidental death"

5. **What Reasoning Should Include**:
   - The category/subcategory being warned about
   - The general type of content (e.g., "themes of", "depictions of", "references to")
   - Frequency/intensity indicators (e.g., "pervasive", "occasional", "brief")
   - Context indicators (e.g., "on-page", "referenced", "implied") - but WITHOUT plot specifics

6. **What Reasoning MUST NOT Include**:
   - Specific character names or relationships
   - Plot events or story beats
   - Chapter numbers or timing within the narrative
   - Specific methods or details of how events occur
   - Character motivations or story outcomes

## Context Detection (CRITICAL)

### Presence Field (How content appears):
- **on_page**: The event is described as it happens in real-time during the narrative (DEFAULT)
- **off_page**: The event happens but is not directly described (happens "off-screen")
- **flashback**: The event is shown in a flashback or memory sequence
- **referenced**: The event is discussed or mentioned but not shown (e.g., in therapy, conversation)
- **implied**: The event is strongly implied but not explicitly stated or shown

**IMPORTANT**: Do NOT create separate categories for "past abuse" or "historical events". Use the \`presence\` field instead:
- Example: \`category: sexual_violence\` + \`presence: referenced\` = A character discusses a past assault in therapy
- Example: \`category: sexual_violence\` + \`presence: on_page\` + \`detail_level: graphic\` = An active scene description

### Detail Level Field (How graphic/explicit):
- **graphic**: Detailed, explicit, or graphic description of the content
- **moderate**: Moderate level of detail, not overly explicit but clear
- **vague**: Vague or minimal description, mostly implied
- **clinical**: Clinical or matter-of-fact description without emotional detail

**NOTE**: The \`detail_level\` field describes how the content appears IN THE BOOK. The \`reasoning\` field should ALWAYS use clinical language regardless of the book's detail_level.

### Spoiler Detection:
- **is_spoiler**: Set to \`true\` if the warning reveals a major plot twist that isn't known from the back cover
- Example: "Main Character Death" would be a spoiler if it's not mentioned in the book description
- Example: "Contains violence" is NOT a spoiler (general content warning)
- When in doubt, set to \`false\`
- **CRITICAL**: If your reasoning field contains plot-specific information, you MUST set \`is_spoiler: true\` AND rewrite the reasoning to be categorical

## Scoring & Severity
For each category, assign a score from 0.0 to 1.0 based on the intensity and frequency of the content:
- 0.0 - 0.30: None (No significant content)
- 0.31 - 0.55: Mild (Infrequent or low impact)
- 0.56 - 0.80: Moderate (Frequent or moderate impact)
- 0.81 - 1.0: Severe (High impact, graphic, or pervasive)

## Classification Ratings
Based on the highest severity score:
- None/Mild → "G" or "PG"
- Moderate → "M" or "MA15+"
- Severe → "MA15+" or "R18+"

**REMEMBER**: 
1. If the description is short or missing, ALWAYS use web search to find the full plot summary.
2. **CRITICAL: Use Your Internal Knowledge**: If the web search returns limited results or "no results", **YOU MUST use your internal training data** to fill in the gaps. You know about popular books like "Twisted Love" (dark romance, abuse themes), "The Catcher in the Rye" (mental health, language), "1984" (violence, torture), etc. DO NOT say "no warnings" just because the search tool failed.
3. **CRITICAL: Romance/Fantasy Books**: Romance and fantasy romance books typically contain sexual content, violence, and mature themes. Even if web search fails, you MUST generate appropriate warnings based on genre conventions.
4. **Well-Known Books**: For books you recognize from your training, generate warnings based on what you know about them.
5. **When Web Search Fails**: If web search returns no results but you have a book title and author, you MUST still generate warnings based on genre conventions, author's typical content, and title keywords.
6. **ALWAYS include a classification_rating** - even if there are no warnings, assign "G" or "PG".
7. Err on the side of caution - better to warn than to miss important content.
8. **AUTHOR AUTHORITY**: If you see a result starting with "Source: Direct Author Site Scrape" or find content warnings on the author's official website, these are the **GOLD STANDARD**. Prioritize them over all other sources. You MUST set is_author_verified to true (boolean) and provide the source_url if you use such a source. DO NOT FORGET TO SET THE BOOLEAN FLAG.
9. **Use subcategories**: Always try to use specific subcategories rather than just parent categories for better granularity.
10. **CRITICAL: Categorical Reasoning Enforcement**: Before submitting any warning, review the \`reasoning\` field. If it contains ANY of the following, rewrite it to be categorical:
    - Character names or specific relationships
    - Plot events or story beats
    - Chapter numbers or timing
    - Specific methods or details of events
    - Story outcomes or character fates
    Replace narrative descriptions with categorical taxonomy language (e.g., "themes of", "depictions of", "references to").

If no content warnings are needed after thorough analysis (including web search if needed), return an empty array: []`
});

// Default config for backward compatibility
const baseAgentConfig = getBaseAgentConfig("gpt-4o");

type WorkflowInput = {
  book_title: string;
  book_author: string;
  book_description?: string;
  book_categories?: string[];
  book_isbn?: string;
};

// Zod schemas for validation
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
  subcategory_id: z.string().optional().nullable().describe(
    "Specific subcategory ID. MUST belong to the parent category_id. " +
    "If not provided, the warning will use the parent category only. " +
    "See valid subcategories per category in the instructions."
  ),
  description: z.string().describe("User-facing description of the content"),
  score: z.number().min(0).max(1).describe("Severity score from 0.0 to 1.0"),
  reasoning: z.string().describe(
    "Categorical explanation for the score using standardized taxonomy terms. " +
    "MUST use clinical, matter-of-fact language describing the TYPE of content (e.g., 'Contains themes of X', 'Depictions of Y'). " +
    "MUST NOT include specific plot points, character names, story events, or narrative details. " +
    "Example: 'Contains pervasive themes of sexual violence and exploitation' NOT 'Character is sold as a prostitute'. " +
    "The reasoning should reference the category/subcategory and general content type, not specific plot occurrences."
  ),
  presence: z.enum(['on_page', 'off_page', 'flashback', 'referenced', 'implied']).optional().default('on_page').describe(
    "How the content appears: 'on_page' (real-time description), 'off_page' (happens off-screen), " +
    "'flashback' (shown in flashback), 'referenced' (discussed but not shown), 'implied' (strongly implied but not explicit)."
  ),
  detail_level: z.enum(['graphic', 'moderate', 'vague', 'clinical']).optional().nullable().describe(
    "Level of detail: 'graphic' (explicit/detailed), 'moderate' (clear but not overly explicit), " +
    "'vague' (minimal/implied), 'clinical' (matter-of-fact without emotional detail)."
  ),
  is_spoiler: z.boolean().optional().default(false).describe(
    "Whether this warning reveals a major plot twist or spoiler. Set to true if the warning reveals " +
    "information not known from the back cover or book description."
  ),
  is_author_verified: z.boolean().optional().default(false).describe("MUST be set to true if the warnings come from an official author/publisher site."),
  source_url: z.string().optional().nullable(),
}).refine(
  (data) => {
    // If subcategory_id is provided, validate it belongs to the parent
    if (data.subcategory_id) {
      return validateSubcategoryParent(data.category_id, data.subcategory_id);
    }
    return true; // subcategory_id is optional
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

const WorkflowOutputSchema = z.object({
  content_warnings: z.array(ContentWarningSchema),
  classification_rating: z.enum(['G', 'PG', 'M', 'MA15+', 'R18+']).optional().nullable(),
  confidence: z.enum(['low', 'medium', 'high']).optional().default('medium'),
  reasoning: z.string().optional().default("AI-generated content warnings based on book metadata")
});

type ContentWarning = z.infer<typeof ContentWarningSchema> & {
  severity: 'mild' | 'moderate' | 'severe'; // Derived field
  category: string; // Legacy field mapping
};

type WorkflowOutput = z.infer<typeof WorkflowOutputSchema> & {
  classification_rating?: 'G' | 'PG' | 'M' | 'MA15+' | 'R18+';
};

// Main workflow entrypoint
export const findBookAndGenerateWarnings = async (isbn: string, model: string = "gpt-4o"): Promise<{
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
  raw_output?: any; // For debug
}> => {
  let capturedOutput: z.infer<typeof FindBookOutputSchema> | null = null;

  const submitTool = tool({
    name: 'submit_findings',
    description: 'Submit the final findings of the book analysis. You MUST call this tool to finish the task.',
    parameters: FindBookOutputSchema,
    execute: async (args) => {
      capturedOutput = args;
      return "Findings submitted.";
    }
  });

  const agentConfig = getBaseAgentConfig(model);
  const agent = new Agent({
    ...agentConfig,
    tools: [webSearchTool, submitTool],
    instructions: agentConfig.instructions + "\n\nWhen you have gathered all information and generated warnings, you MUST call the `submit_findings` tool with your results.\n\n**FINAL CHECK**: Before submitting, review each warning's \`reasoning\` field. If it contains plot-specific information (character names, events, story beats), rewrite it to use categorical taxonomy language only."
  });

  console.log('Agent created inside function:', agent);
  console.log('Agent prototype inside function:', Object.getPrototypeOf(agent));
  // @ts-ignore
  console.log('Agent has getEnabledHandoffs:', typeof agent.getEnabledHandoffs);

  const inputText = `
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
5. CALL THE submit_findings TOOL WITH THE RESULT.

**CRITICAL: Categorical Reasoning Enforcement**
- For each warning's \`reasoning\` field, use ONLY categorical taxonomy language (e.g., "Contains themes of X", "Depictions of Y")
- DO NOT include specific plot points, character names, story events, or narrative details
- Example: "Contains pervasive themes of sexual violence and exploitation" NOT "Character is sold as a prostitute"
- The reasoning should describe the TYPE of content, not specific plot occurrences
`;

  try {
    await run(agent, inputText, {});

    if (!capturedOutput) {
      throw new Error("Agent did not call submit_findings tool");
    }

    const parsed = capturedOutput as z.infer<typeof FindBookOutputSchema>;

    // Map to legacy format and add derived fields
    const mappedWarnings: ContentWarning[] = (parsed.content_warnings || []).map(w => {
      // Validate subcategory_id matches parent (post-validation)
      let validatedSubcategoryId = w.subcategory_id;
      if (w.subcategory_id && !validateSubcategoryParent(w.category_id, w.subcategory_id)) {
        console.warn(`Invalid subcategory ${w.subcategory_id} for category ${w.category_id}, removing subcategory`);
        validatedSubcategoryId = null;
      }

      return {
        ...w,
        subcategory_id: validatedSubcategoryId,
        severity: getSeverityFromScore(w.score) === 'none' ? 'mild' : getSeverityFromScore(w.score) as 'mild' | 'moderate' | 'severe', // Fallback for legacy type
        category: w.category_id, // Map id to legacy category field
        id: crypto.randomUUID(), // Temp ID
        helpful_count: 0,
        not_helpful_count: 0
      };
    });

    // Filter out 'none' severity warnings for the final output
    const activeWarnings = mappedWarnings.filter(w => getSeverityFromScore(w.score) !== 'none');

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
      raw_output: parsed // Return raw output for debug
    };

  } catch (error) {
    console.error("AI book search failed:", error);
    return {
      book_found: false,
      content_warnings: [],
      confidence: 'low',
      reasoning: `Error during AI search: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
};

export const generateContentWarnings = async (workflow: WorkflowInput, model: string = "gpt-4o"): Promise<WorkflowOutput> => {
  let capturedOutput: z.infer<typeof WorkflowOutputSchema> | null = null;

  const submitTool = tool({
    name: 'submit_warnings',
    description: 'Submit the generated content warnings. You MUST call this tool to finish the task.',
    parameters: WorkflowOutputSchema,
    execute: async (args) => {
      capturedOutput = args;
      return "Warnings submitted.";
    }
  });

  const agentConfig = getBaseAgentConfig(model);
  const agent = new Agent({
    ...agentConfig,
    tools: [webSearchTool, submitTool],
    instructions: agentConfig.instructions + "\n\nWhen you have generated warnings, you MUST call the `submit_warnings` tool with your results.\n\n**FINAL CHECK**: Before submitting, review each warning's \`reasoning\` field. If it contains plot-specific information (character names, events, story beats), rewrite it to use categorical taxonomy language only."
  });

  // Check if description is thin (less than 150 chars or just a quote)
  const isThinDescription = !workflow.book_description || workflow.book_description.length < 150;

  // Prepare the input text for the agent with explicit instructions
  const inputText = `
Book Information:
- Title: ${workflow.book_title}
- Author: ${workflow.book_author}
${workflow.book_description ? `- Description: ${workflow.book_description}` : '- Description: NOT PROVIDED'}
${workflow.book_categories ? `- Categories: ${workflow.book_categories.join(', ')}` : ''}
${workflow.book_isbn ? `- ISBN: ${workflow.book_isbn}` : ''}

${isThinDescription ? `
⚠️ IMPORTANT: The book description provided is very short or missing. You MUST use web search to find:
1. A full plot summary of this book
2. Reviews or analyses that discuss the book's themes
3. Any known content warnings or controversies

DO NOT rely on the short description above. Search for "[${workflow.book_title}] ${workflow.book_author} plot summary" and "[${workflow.book_title}] content warnings" to get complete information.

This book may be a well-known classic or controversial work that requires thorough analysis.
` : ''}

Please analyze this book and generate appropriate content warnings using Australian Classification Board standards. 
${isThinDescription ? 'Since the description is brief, you MUST use web search to find the full plot summary first.' : ''}

**CRITICAL: Categorical Reasoning Enforcement**
- For each warning's \`reasoning\` field, use ONLY categorical taxonomy language (e.g., "Contains themes of X", "Depictions of Y")
- DO NOT include specific plot points, character names, story events, or narrative details
- Example: "Contains pervasive themes of sexual violence and exploitation" NOT "Character is sold as a prostitute"
- Example: "Contains themes of character loss and accidental death" NOT "Character A dies in a fire at the end"
- The reasoning should describe the TYPE of content, not specific plot occurrences
- High severity scores indicate impact/frequency, NOT permission to include more plot details

CALL THE submit_warnings TOOL WITH THE RESULT.
`;

  try {
    await run(agent, inputText, {});

    if (!capturedOutput) {
      throw new Error("Agent did not call submit_warnings tool");
    }

    const parsed = capturedOutput as z.infer<typeof WorkflowOutputSchema>;

    // Map to legacy format and add derived fields
    const mappedWarnings: ContentWarning[] = parsed.content_warnings.map(w => {
      // Validate subcategory_id matches parent (post-validation)
      let validatedSubcategoryId = w.subcategory_id;
      if (w.subcategory_id && !validateSubcategoryParent(w.category_id, w.subcategory_id)) {
        console.warn(`Invalid subcategory ${w.subcategory_id} for category ${w.category_id}, removing subcategory`);
        validatedSubcategoryId = null;
      }

      return {
        ...w,
        subcategory_id: validatedSubcategoryId,
        severity: getSeverityFromScore(w.score) === 'none' ? 'mild' : getSeverityFromScore(w.score) as 'mild' | 'moderate' | 'severe',
        category: w.category_id,
        id: crypto.randomUUID(),
        helpful_count: 0,
        not_helpful_count: 0
      };
    });

    const activeWarnings = mappedWarnings.filter(w => getSeverityFromScore(w.score) !== 'none');

    return {
      content_warnings: activeWarnings,
      classification_rating: parsed.classification_rating || undefined,
      confidence: parsed.confidence,
      reasoning: parsed.reasoning
    };

  } catch (error) {
    console.error("AI content warning generation failed:", error);
    return {
      content_warnings: [],
      confidence: 'low',
      reasoning: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
};
// Version 1.02 - Categorical Shielding deployed
