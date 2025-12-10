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

// Old assumption-based instructions (for comparison)
const getOldInstructions = () => `
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
`;

// New evidence-based instructions
const getNewInstructions = () => `
**CRITICAL RULES - NO ASSUMPTIONS**:
1. **ONLY analyze THIS SPECIFIC BOOK** - Do NOT make assumptions based on:
   - Author's other works or reputation
   - Genre conventions or typical themes
   - Similar book titles or authors
   - Your internal knowledge about other books

2. **Evidence-Based Analysis Only**:
   - Base warnings ONLY on the book description provided
   - If description is short/missing, use web search to find THIS SPECIFIC BOOK's plot summary
   - Only use verified information from web search results about THIS BOOK
   - If web search fails to find information about THIS SPECIFIC BOOK, return empty warnings with confidence set to 'low' and reasoning explaining insufficient information

3. **When Information is Insufficient**:
   - If you cannot find verified information about THIS SPECIFIC BOOK, return an empty warnings array: []
   - Set confidence to 'low'
   - In reasoning, explain: "Insufficient information available about this specific book. Unable to generate content warnings without verified content details."
   - DO NOT generate warnings based on assumptions, author reputation, or genre conventions

4. **AUTHOR AUTHORITY**: If you find content warnings on the author's official website FOR THIS SPECIFIC BOOK, these are the **GOLD STANDARD**. Prioritize them over all other sources. You MUST set is_author_verified to true (boolean) and provide the source_url if you use such a source. DO NOT FORGET TO SET THE BOOLEAN FLAG.

5. **ALWAYS include a classification_rating** - even if there are no warnings, assign "G" or "PG".

6. **Use subcategories**: Always try to use specific subcategories rather than just parent categories for better granularity.

7. **Reasoning must be specific**: In your reasoning field, cite the specific evidence from the book description or web search that led to each warning. Do NOT reference author's other works or genre conventions.
`;

// Hybrid instructions - combines evidence-based rigor with assumption-based comprehensiveness
const getHybridInstructions = () => `
## HYBRID APPROACH - EVIDENCE FIRST, THEN INFERENCE

### PHASE 1: Evidence-Based Analysis (Primary)

**1. Source Reliability Hierarchy (In Order of Priority):**

1. **Author/Publisher Authority**: Official "Content Notes" or "Trigger Warnings" from the author's website or publisher page. (Gold Standard).
2. **Professional Reviews**: Kirkus, Publishers Weekly, Common Sense Media.
3. **User Consensus**: Goodreads/StoryGraph (Only if multiple reviews cite specific details).

**2. Execution:**

- Base warnings on the book description provided.
- Use web search to verify details for THIS SPECIFIC BOOK.
- **Conflict Resolution**: If the Author says "clean" but >70% of user reviews cite a specific graphic trigger, flag it as Verified (User Consensus).

**3. Verification Marking:**

- If found in Source type 1 (Author/Publisher), set \`is_author_verified\` to \`true\` and include \`source_url\`.

### PHASE 2: Inference-Based Analysis (Secondary)

**4. Inference Logic:**

- Use ONLY when verified info is insufficient.
- **Inference Rules**:
  - *Romance Genre*: Do NOT infer explicit sex unless "Steamy", "Spice", or "Erotica" is indicated.
  - *Thriller/Mystery*: Do NOT infer graphic gore unless "Horror", "Slasher", or "Dark" is indicated.
- Set confidence score lower (0.5 - 0.69) for inferred warnings.

### PHASE 3: Calibration & False Positive Checks

**5. False Positive Logic (Run before outputting):**

- **Death ≠ Grief**: Character death alone is not "Grief" unless the *processing* of loss is a theme.
- **Action ≠ Violence**: Fantasy battles/Action sequences are usually "Mild/Moderate" unless gore is described.
- **Non-Fiction**: Clinical discussion of sensitive topics (e.g., history, psychology) uses the \`clinical\` detail level and lower severity than graphic fiction.

**6. Classification Requirement:**

- ALWAYS include a \`classification_rating\` (G/PG/etc.) even if the list of warnings is empty.

**7. Reasoning Transparency:**

- \`reasoning\` field must clearly state:
  - **evidence_type**: "verified" or "inferred"
  - **sources_checked**: List sources you checked (e.g., "Author Site", "Kirkus", "Goodreads")
  - **key_evidence**: Direct quote or specific plot point that led to this warning
  - **conflict_resolution**: Why you chose this severity if sources disagreed (if applicable)
  - **confidence_rationale**: Why you assigned this confidence score

**8. Use subcategories**: Always try to use specific subcategories rather than just parent categories for better granularity.
`;

// Define the base agent config
const getBaseAgentConfig = (model: string = "gpt-4o", instructionMode: 'old' | 'new' | 'hybrid' = 'hybrid') => ({
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
- **clinical**: Clinical or matter-of-fact description (common in non-fiction/educational)

### Spoiler Detection:
- **is_spoiler**: Set to \`true\` if the warning reveals a major plot twist that isn't known from the back cover
- Example: "Main Character Death" would be a spoiler if it's not mentioned in the book description
- Example: "Contains violence" is NOT a spoiler (general content warning)
- When in doubt, set to \`false\`

## Scoring & Severity (ACB Alignment)

For each category, assign a score from 0.0 to 1.0 based on the intensity and frequency, aligned with Australian Classification Board impact tests:

- **0.0 - 0.30: None / Very Mild (G)**
  *(Context is comedic, educational, or highly stylized)*
- **0.31 - 0.55: Mild (PG)**
  *(Infrequent, low impact, implied violence, vague sexual references)*
- **0.56 - 0.80: Moderate (M)**
  *(Mature themes, moderate impact, non-graphic sexual scenes, detailed but not prolonged violence)*
- **0.81 - 1.0: Severe (MA15+ / R18+)**
  *(High impact, graphic/prolonged violence, explicit sexual activity, sexual violence)*

## Classification Ratings

Based on the highest severity score found:

- **G**: 0.0 - 0.20
- **PG**: 0.21 - 0.40
- **M**: 0.41 - 0.70
- **MA15+**: 0.71 - 0.90
- **R18+**: 0.91 - 1.0

${instructionMode === 'old' ? getOldInstructions() : instructionMode === 'new' ? getNewInstructions() : getHybridInstructions()}

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
  reasoning: z.string().describe("Technical explanation for the score"),
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
export const findBookAndGenerateWarnings = async (isbn: string, model: string = "gpt-4o", instructionMode: 'old' | 'new' | 'hybrid' = 'hybrid'): Promise<{
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

  const agentConfig = getBaseAgentConfig(model, instructionMode);
  const agent = new Agent({
    ...agentConfig,
    tools: [webSearchTool, submitTool],
    instructions: agentConfig.instructions + "\n\nWhen you have gathered all information and generated warnings, you MUST call the `submit_findings` tool with your results."
  });

  console.log('Agent created inside function:', agent);
  console.log('Agent prototype inside function:', Object.getPrototypeOf(agent));
  // @ts-ignore
  console.log('Agent has getEnabledHandoffs:', typeof agent.getEnabledHandoffs);

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
5. CALL THE submit_findings TOOL WITH THE RESULT.
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
5. CALL THE submit_findings TOOL WITH THE RESULT.
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

export const generateContentWarnings = async (workflow: WorkflowInput, model: string = "gpt-4o", instructionMode: 'old' | 'new' | 'hybrid' = 'hybrid'): Promise<WorkflowOutput> => {
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

  const agentConfig = getBaseAgentConfig(model, instructionMode);
  const agent = new Agent({
    ...agentConfig,
    tools: [webSearchTool, submitTool],
    instructions: agentConfig.instructions + "\n\nWhen you have generated warnings, you MUST call the `submit_warnings` tool with your results."
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

${isThinDescription ? (instructionMode === 'old' ? `
⚠️ IMPORTANT: The book description provided is very short or missing. You MUST use web search to find:
1. A full plot summary of this book
2. Reviews or analyses that discuss the book's themes
3. Any known content warnings or controversies

DO NOT rely on the short description above. Search for "[${workflow.book_title}] ${workflow.book_author} plot summary" and "[${workflow.book_title}] content warnings" to get complete information.

This book may be a well-known classic or controversial work that requires thorough analysis.
` : `
⚠️ IMPORTANT: The book description provided is very short or missing. You MUST use web search to find:
1. A full plot summary of THIS SPECIFIC BOOK: "${workflow.book_title}" by ${workflow.book_author}
2. Reviews or analyses that discuss THIS BOOK's themes
3. Any known content warnings or controversies about THIS SPECIFIC BOOK

Search for "[${workflow.book_title}] ${workflow.book_author} plot summary" and "[${workflow.book_title}] content warnings" to get complete information.

**CRITICAL**: Only generate warnings based on verified information about THIS SPECIFIC BOOK. Do NOT make assumptions based on the author's other works, genre conventions, or similar books. If you cannot find verified information about THIS BOOK, return empty warnings with low confidence.
`) : ''}

Please analyze ${instructionMode === 'old' ? 'this book' : 'THIS SPECIFIC BOOK'} and generate appropriate content warnings using Australian Classification Board standards. 
${isThinDescription ? (instructionMode === 'old' ? 'Since the description is brief, you MUST use web search to find the full plot summary first.' : instructionMode === 'new' ? 'Since the description is brief, you MUST use web search to find verified information about THIS SPECIFIC BOOK first. Do NOT assume content based on author reputation or genre.' : 'Since the description is brief, you MUST use web search to find verified information first. If verified information is insufficient, you may apply genre-aware inference but must clearly mark inferred warnings.') : (instructionMode === 'old' ? '' : instructionMode === 'new' ? 'Base your analysis ONLY on the book description provided above. Do NOT make assumptions based on author reputation or genre conventions.' : 'Start with evidence-based analysis from the description. If information is insufficient, you may apply genre-aware inference but must clearly distinguish verified vs inferred warnings.')}

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
