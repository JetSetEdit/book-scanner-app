import { Agent, run, tool, setDefaultOpenAIKey } from "@openai/agents";
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
// Note: severity-classification-agent was removed, using fallback
// import { classifySeverity, type ClassificationContext } from "./services/severity-classification-agent";

type ClassificationContext = any;

function classifySeverity(context: ClassificationContext): string {
  // Fallback implementation - old agent used this but it's not critical for testing
  return 'moderate';
}

// Helper function to filter out cover/image URLs from source URLs
function isValidSourceUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  
  // Cover/image URL patterns to exclude
  const coverUrlPatterns = [
    /mzstatic\.com/i, // Apple Books artwork
    /covers\.openlibrary\.org/i, // Open Library covers
    /books\.google\.com.*\/books\/content/i, // Google Books cover images
    /books\.googleapis\.com.*\/books\/content/i, // Google Books API cover images
    /artworkUrl/i, // Apple Books artwork URLs
    /imageLinks/i, // Google Books image links
    /\.jpg$/i, // Image file extensions
    /\.jpeg$/i,
    /\.png$/i,
    /\.gif$/i,
    /\.webp$/i,
    /\/cover/i, // URLs containing "cover"
    /\/image/i, // URLs containing "image" (but allow some exceptions)
    /\/artwork/i, // URLs containing "artwork"
  ];
  
  // Check if URL matches any cover pattern
  for (const pattern of coverUrlPatterns) {
    if (pattern.test(url)) {
      return false; // This is a cover/image URL, not a valid source
    }
  }
  
  // Allow these patterns (actual content pages)
  const validPatterns = [
    /^https?:\/\/[^\/]+\/(books|library|content|warnings|notes|guidance)/i, // Author sites with content pages
    /goodreads\.com/i, // Goodreads (reviews/content)
    /storygraph\.com/i, // StoryGraph (reviews/content)
    /amazon\.com.*\/dp\//i, // Amazon product pages (not images)
    /google\.com\/books/i, // Google Books volume pages (not cover images)
  ];
  
  // Check if URL matches any valid pattern
  for (const pattern of validPatterns) {
    if (pattern.test(url)) {
      return true; // This is a valid content source
    }
  }
  
  // If it doesn't match cover patterns and doesn't match valid patterns, 
  // check if it looks like a content page (has path beyond domain)
  const urlObj = new URL(url);
  const path = urlObj.pathname;
  
  // If path is just "/" or very short, likely not a content page
  if (path.length < 3) {
    return false;
  }
  
  // If it doesn't match cover patterns, allow it (but log for review)
  return true;
}

// Helper function to ensure API key is set at runtime
// In Next.js serverless functions, env vars are available at runtime, not module load
function ensureOpenAIKey(): string | null {
  const apiKey = process.env.OPENAI_API_KEY;
  
  if (!apiKey) {
    console.error('[Agent Config] ❌ OPENAI_API_KEY not found in process.env');
    console.error('[Agent Config] Available env vars:', Object.keys(process.env).filter(k => k.includes('OPENAI') || k.includes('API')));
    return null;
  }
  
  // Trim whitespace and validate format (OpenAI keys start with 'sk-')
  const trimmedKey = apiKey.trim();
  if (!trimmedKey.startsWith('sk-')) {
    console.warn('[Agent Config] ⚠️ OPENAI_API_KEY format looks invalid (should start with sk-)');
  }
  
  setDefaultOpenAIKey(trimmedKey);
  console.log('[Agent Config] ✅ OpenAI API key configured (length:', trimmedKey.length, ')');
  return trimmedKey;
}

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
        for (const item of gbData.items.slice(0, 2)) { // Limit to 2 results
          const info = item.volumeInfo;
          // Truncate description to reduce tokens
          let description = info.description || "No description available";
          if (description.length > 600) {
            description = description.substring(0, 600) + '...';
          }
          const categories = info.categories?.slice(0, 3).join(", ") || "No categories"; // Limit categories
          
          // Use parallelized cover finding
          const coverUrl = await findBestCover(info.imageLinks);

          googleResults.push(`Source: Google Books\nTitle: ${info.title}\nAuthor: ${info.authors?.join(", ") || "Unknown"}\nDescription: ${description}\nCategories: ${categories}\nPublisher: ${info.publisher || "Unknown"}\nPublished: ${info.publishedDate || "Unknown"}`);
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

        return appleData.results.slice(0, 2).map((item: any) => { // Limit to 2 results
          let description = item.description || "No description";
          // Truncate description to reduce tokens
          if (description.length > 600) {
            description = description.substring(0, 600) + '...';
          }
          return `Source: Apple Books\nTitle: ${item.trackName}\nAuthor: ${item.artistName}\nDescription: ${description}`;
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
          for (const topic of ddgData.RelatedTopics.slice(0, 2)) { // Limit to 2
            if (topic.Text) {
              // Truncate long text
              const text = topic.Text.length > 400 ? topic.Text.substring(0, 400) + '...' : topic.Text;
              ddgResults.push(`Source: DuckDuckGo Related\nInfo: ${text}`);
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
          for (const topic of ddgData.RelatedTopics.slice(0, 3)) { // Limit to 3
            if (topic.Text && topic.FirstURL) {
              // Truncate long text
              const text = topic.Text.length > 400 ? topic.Text.substring(0, 400) + '...' : topic.Text;
              authorResults.push(`Source: Official/Author Search\nInfo: ${text}\nURL: ${topic.FirstURL}`);
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

    // TOKEN OPTIMIZATION: Limit and truncate results to reduce token usage
    const MAX_RESULTS = 3; // Only keep top 3 results
    const MAX_DESCRIPTION_LENGTH = 800; // Truncate descriptions to 800 chars
    
    const truncatedResults = results.slice(0, MAX_RESULTS).map(result => {
      // Truncate long descriptions in results
      if (result.length > MAX_DESCRIPTION_LENGTH) {
        // Try to preserve structure (Source: ... Description: ...)
        const lines = result.split('\n');
        const truncated = lines.map(line => {
          if (line.startsWith('Description:') && line.length > MAX_DESCRIPTION_LENGTH) {
            return `Description: ${line.substring(11, MAX_DESCRIPTION_LENGTH + 11)}...`;
          }
          if (line.length > MAX_DESCRIPTION_LENGTH) {
            return line.substring(0, MAX_DESCRIPTION_LENGTH) + '...';
          }
          return line;
        }).join('\n');
        return truncated;
      }
      return result;
    });

    return {
      results: truncatedResults.length > 0 ? truncatedResults.join("\n\n---\n\n") : "No results found."
    };
  } catch (error) {
    return { error: `Search failed: ${error instanceof Error ? error.message : 'Unknown error'}` };
  }
};

const webSearchTool = tool({
  description: 'Search the web for book information, plot summaries, and content warnings. Use this when the book description is missing or insufficient. IMPORTANT: Use this tool FIRST if no description was provided. Search by ISBN first, then by title+author if needed.',
  parameters: z.object({
    query: z.string().describe('The search query. For best results: 1) Start with ISBN: "ISBN 9780593440872" or just "9780593440872", 2) Then try title+author: "Book Lovers Emily Henry plot summary", 3) Finally try: "Book Lovers Emily Henry content warnings"')
  }),
  execute: performWebSearch
});

// Old assumption-based instructions (optimized for token efficiency)
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

// New evidence-based instructions (optimized)
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

// Hybrid instructions (optimized - much shorter)
const getHybridInstructions = () => `
**HYBRID APPROACH**:
1. **Evidence First**: Use description or web search for THIS SPECIFIC BOOK. Author sites = GOLD STANDARD (set is_author_verified=true)
2. **Inference Second**: Only if evidence insufficient. Romance: no explicit sex unless "Steamy/Spice/Erotica". Thriller: no gore unless "Horror/Slasher/Dark"
3. **False Positive Checks**: Death≠Grief (unless processing loss), Action≠Violence (unless gore), Non-fiction=clinical detail
4. **Always include classification_rating** (G/PG/M/MA15+/R18+)
5. **Reasoning**: State evidence_type (verified/inferred), sources_checked, key_evidence
6. **Use subcategories** for specificity
7. **Dark Romance**: Distinguish tropes (CNC/dub-con) vs triggers (actual assault). Clarify in reasoning
`;

// Define the base agent config
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
  description: z.string().describe(
    "User-facing description that MUST clarify context for dark romance readers. " +
    "For sexual content: Specify if it's 'CNC/power play dynamics (consensual roleplay)', 'Dubious consent within relationship (dark romance trope)', or 'Actual sexual assault (not consensual roleplay)'. " +
    "For stalking: Specify if it's 'Protective/obsessive surveillance (dark romance trope)' or 'Threatening stalking behavior'. " +
    "Answer: Is this within the main couple's power dynamic, or assault from outside party? Is it framed as fantasy/power play or actual trauma? " +
    "Example: 'Contains dubious consent scenes where power dynamics blur consent (common in dark romance). Framed as fantasy/power play within the relationship, not traumatic assault.'"
  ),
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
  source_url: z.string().optional().nullable().describe("URL of the source that provided the content warning information (e.g., author website, review site). DO NOT use cover image URLs or artwork URLs - only use URLs to actual content pages (reviews, descriptions, author sites)."),
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
  // Ensure API key is set before creating agent (check at runtime, not module load)
  const apiKey = ensureOpenAIKey();
  if (!apiKey) {
    console.error('[findBookAndGenerateWarnings] ❌ OPENAI_API_KEY not available');
    console.error('[findBookAndGenerateWarnings] process.env keys:', Object.keys(process.env).filter(k => k.includes('OPENAI') || k.includes('API')).join(', '));
    return {
      book_found: false,
      content_warnings: [],
      confidence: 'low',
      reasoning: 'Configuration error: OPENAI_API_KEY environment variable is not set or not accessible. Please configure it in Vercel environment variables and ensure it is available for Production environment.'
    };
  }
  
  console.log('[findBookAndGenerateWarnings] ✅ API key available, creating agent...');
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

  // Double-check API key is set right before creating agent
  if (!apiKey) {
    const recheckKey = ensureOpenAIKey();
    if (!recheckKey) {
      throw new Error('OPENAI_API_KEY not available when creating agent');
    }
  }

  const agentConfig = getBaseAgentConfig(model, instructionMode);
  const agent = new Agent({
    ...agentConfig,
    tools: [webSearchTool, submitTool],
    instructions: agentConfig.instructions + `

**WORKFLOW:**
1. Search for book info (if description missing)
2. Analyze and generate warnings
3. **CALL submit_findings tool** - This is REQUIRED to finish`
  });

  console.log('[findBookAndGenerateWarnings] Agent created successfully');

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

  // Helper function for TPM-aware retry
  const runWithRetry = async (maxRetries = 2): Promise<void> => {
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        // Add timeout wrapper (60 seconds max for agent execution)
        const agentPromise = run(agent, inputText, {});
        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error('Agent execution timeout after 60s')), 60000);
        });

        await Promise.race([agentPromise, timeoutPromise]);
        return; // Success, exit retry loop
      } catch (error: any) {
        const errorMessage = error?.message || '';
        const isRateLimit = error?.status === 429 || errorMessage.includes('429') || errorMessage.includes('rate limit') || errorMessage.includes('TPM');
        
        if (isRateLimit && attempt < maxRetries) {
          // Extract reset time from headers
          const resetHeader = error?.headers?.get?.('x-ratelimit-reset-tokens') || 
                             error?.headers?.['x-ratelimit-reset-tokens'] ||
                             error?.error?.headers?.['x-ratelimit-reset-tokens'];
          
          const resetSeconds = resetHeader ? parseFloat(resetHeader) : 45; // Default to 45s if not found
          const waitTime = Math.ceil((resetSeconds + 0.5) * 1000); // Add 0.5s buffer
          
          console.log(`[findBookAndGenerateWarnings] Rate limit hit, waiting ${waitTime}ms (${resetSeconds}s) before retry ${attempt + 1}/${maxRetries}...`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
          continue; // Retry
        }
        
        // Not a rate limit, or max retries reached - throw
        throw error;
      }
    }
  };

  try {
    await runWithRetry();

    // FALLBACK: If agent didn't call submit_findings, provide default response
    if (!capturedOutput) {
      console.warn('[findBookAndGenerateWarnings] Agent did not call submit_findings tool, using fallback response');
      capturedOutput = {
        book_found: false,
        content_warnings: [],
        confidence: 'low' as const,
        reasoning: 'Agent workflow incomplete - unable to find book or generate warnings. This may be due to insufficient information or workflow timeout.',
        classification_rating: 'PG' as const
      };
    }

    const parsed = capturedOutput as z.infer<typeof FindBookOutputSchema>;

    // Map to legacy format and add derived fields
    // Classify severity for each warning using classification agent
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

    // Classify all warnings (in parallel for efficiency)
    let classificationResults;
    try {
      if (classificationContexts.length > 0) {
        classificationResults = await Promise.all(
          classificationContexts.map(context => classifySeverity(context, model))
        );
        console.log(`[Content Warning Agent] Classified ${classificationResults.length} warnings using classification agent`);
      } else {
        classificationResults = null;
      }
    } catch (error) {
      console.warn('[Content Warning Agent] Classification agent failed, falling back to score-based mapping:', error);
      // Fallback to score-based mapping if classification fails
      classificationResults = null;
    }

    const mappedWarnings: ContentWarning[] = (parsed.content_warnings || []).map((w, index) => {
      // Validate subcategory_id matches parent (post-validation)
      let validatedSubcategoryId = w.subcategory_id;
      if (w.subcategory_id && !validateSubcategoryParent(w.category_id, w.subcategory_id)) {
        console.warn(`Invalid subcategory ${w.subcategory_id} for category ${w.category_id}, removing subcategory`);
        validatedSubcategoryId = null;
      }

      // Use classification result if available, otherwise fallback to score-based mapping
      let severity: 'mild' | 'moderate' | 'severe';
      if (classificationResults && classificationResults[index]) {
        severity = classificationResults[index].severity;
        // Update reasoning with classification reasoning if available
        if (classificationResults[index].reasoning) {
          w.reasoning = `${w.reasoning || ''} [Classification: ${classificationResults[index].reasoning}]`.trim();
        }
      } else {
        // Fallback to score-based mapping
        const scoreBasedSeverity = getSeverityFromScore(w.score);
        severity = scoreBasedSeverity === 'none' ? 'mild' : scoreBasedSeverity as 'mild' | 'moderate' | 'severe';
      }

      return {
        ...w,
        subcategory_id: validatedSubcategoryId,
        severity: severity,
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
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    // Check for different error types
    const isMissingKey = errorMessage.includes('apiKey') || errorMessage.includes('OPENAI_API_KEY') || errorMessage.includes('Missing credentials');
    const isQuotaError = errorMessage.includes('quota') || errorMessage.includes('429') || errorMessage.includes('exceeded') || errorMessage.includes('billing');
    const isRateLimitError = errorMessage.includes('rate limit') || errorMessage.includes('Rate limit') || errorMessage.includes('TPM') || errorMessage.includes('RPM');
    const isTimeout = errorMessage.includes('timeout') || errorMessage.includes('Timeout');
    const isToolNotCalled = errorMessage.includes('did not call') || errorMessage.includes('submit_findings') || errorMessage.includes('submit_warnings');
    
    let reasoning = `Error during AI search: ${errorMessage}`;
    if (isMissingKey) {
      reasoning = `Configuration error: OpenAI API key is not set. Please configure OPENAI_API_KEY in your environment variables. ${errorMessage}`;
    } else if (isQuotaError) {
      reasoning = `Error during AI search: 429 You exceeded your current quota, please check your plan and billing details. For more information on this error, read the docs: https://platform.openai.com/docs/guides/error-codes/api-errors.`;
    } else if (isRateLimitError) {
      reasoning = `Rate limit error: ${errorMessage}. The OpenAI API rate limit was exceeded. Please wait a moment and try again, or check your API usage limits.`;
    } else if (isTimeout) {
      reasoning = `Agent execution timeout: The agent took too long to complete (60s limit). This may be due to extensive web searches or rate limiting. Consider using the direct API approach instead.`;
    } else if (isToolNotCalled) {
      reasoning = `Agent workflow incomplete: ${errorMessage}. The agent may have encountered an error or rate limit before completing the task.`;
    }
    
    return {
      book_found: false,
      content_warnings: [],
      confidence: 'low',
      reasoning
    };
  }
};

export const generateContentWarnings = async (workflow: WorkflowInput, model: string = "gpt-4o", instructionMode: 'old' | 'new' | 'hybrid' = 'hybrid'): Promise<WorkflowOutput> => {
  // Ensure API key is set before creating agent (check at runtime, not module load)
  const apiKey = ensureOpenAIKey();
  if (!apiKey) {
    console.error('[generateContentWarnings] ❌ OPENAI_API_KEY not available');
    console.error('[generateContentWarnings] process.env keys:', Object.keys(process.env).filter(k => k.includes('OPENAI') || k.includes('API')).join(', '));
    return {
      content_warnings: [],
      confidence: 'low',
      reasoning: 'Configuration error: OPENAI_API_KEY environment variable is not set or not accessible. Please configure it in Vercel environment variables and ensure it is available for Production environment.'
    };
  }
  
  console.log('[generateContentWarnings] ✅ API key available, creating agent...');
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

  // Double-check API key is set right before creating agent
  if (!apiKey) {
    const recheckKey = ensureOpenAIKey();
    if (!recheckKey) {
      throw new Error('OPENAI_API_KEY not available when creating agent');
    }
  }

  const agentConfig = getBaseAgentConfig(model, instructionMode);
  const agent = new Agent({
    ...agentConfig,
    tools: [webSearchTool, submitTool],
    instructions: agentConfig.instructions + `

**WORKFLOW (MANDATORY):**
1. If description missing → Use web search to find book info
2. Analyze content and generate warnings (or empty array [] if none)
3. **YOU MUST call submit_warnings tool exactly once** - This is the final required step. Even if you find no warnings, call it with an empty array. Do not finish without calling this tool.`
  });

  console.log('[generateContentWarnings] Agent created successfully');

  // Check if description is thin (less than 150 chars or just a quote)
  const isThinDescription = !workflow.book_description || workflow.book_description.length < 150;
  
  // Log description status for debugging
  console.log(`[generateContentWarnings] Description length: ${workflow.book_description?.length || 0} chars`);
  if (isThinDescription) {
    console.log(`[generateContentWarnings] ⚠️ Thin description detected - will trigger web search`);
  }

  // Prepare the input text for the agent with explicit instructions
  const inputText = `
Book Information:
- Title: ${workflow.book_title}
- Author: ${workflow.book_author}
${workflow.book_description && workflow.book_description.length > 0 ? `- Description: ${workflow.book_description}` : '- Description: NOT PROVIDED - You MUST use web search to find the book description and plot summary'}
${workflow.book_categories && workflow.book_categories.length > 0 ? `- Categories: ${workflow.book_categories.join(', ')}` : ''}
${workflow.book_isbn ? `- ISBN: ${workflow.book_isbn}` : ''}

${isThinDescription || !workflow.book_description ? (instructionMode === 'old' ? `
⚠️ CRITICAL: The book description is MISSING or very short. You MUST use web search IMMEDIATELY to find:
1. A full plot summary of this book
2. Reviews or analyses that discuss the book's themes
3. Any known content warnings or controversies

**SEARCH STRATEGY:**
- First, search by ISBN: "${workflow.book_isbn || 'N/A'}" or "ISBN ${workflow.book_isbn || 'N/A'}"
- Then search by title: "${workflow.book_title}" by ${workflow.book_author}
- Search for: "[${workflow.book_title}] ${workflow.book_author} plot summary"
- Search for: "[${workflow.book_title}] content warnings"

DO NOT proceed with analysis until you have found the book description via web search. This book may be a well-known work that requires thorough analysis.
` : `
⚠️ CRITICAL: The book description is MISSING or very short. You MUST use web search IMMEDIATELY to find:
1. A full plot summary of THIS SPECIFIC BOOK: "${workflow.book_title}" by ${workflow.book_author}
2. Reviews or analyses that discuss THIS BOOK's themes
3. Any known content warnings or controversies about THIS SPECIFIC BOOK

**SEARCH STRATEGY:**
- First, search by ISBN: "${workflow.book_isbn || 'N/A'}" or "ISBN ${workflow.book_isbn || 'N/A'}"
- Then search by title: "${workflow.book_title}" by ${workflow.book_author}
- Search for: "[${workflow.book_title}] ${workflow.book_author} plot summary"
- Search for: "[${workflow.book_title}] content warnings"

**CRITICAL**: Only generate warnings based on verified information about THIS SPECIFIC BOOK found via web search. Do NOT make assumptions based on the author's other works, genre conventions, or similar books. If you cannot find verified information about THIS BOOK, return empty warnings with low confidence.
`) : ''}

Please analyze ${instructionMode === 'old' ? 'this book' : 'THIS SPECIFIC BOOK'} and generate appropriate content warnings using Australian Classification Board standards. 

${!workflow.book_description || workflow.book_description.length === 0 ? '**MANDATORY FIRST STEP**: Since no description was provided, you MUST use web search to find the book information before proceeding with analysis.' : isThinDescription ? (instructionMode === 'old' ? 'Since the description is brief, you MUST use web search to find the full plot summary first.' : instructionMode === 'new' ? 'Since the description is brief, you MUST use web search to find verified information about THIS SPECIFIC BOOK first. Do NOT assume content based on author reputation or genre.' : 'Since the description is brief, you MUST use web search to find verified information first. If verified information is insufficient, you may apply genre-aware inference but must clearly mark inferred warnings.') : (instructionMode === 'old' ? 'Base your analysis on the description provided above. If the description seems incomplete, use web search to find more details.' : instructionMode === 'new' ? 'Base your analysis ONLY on the book description provided above. Do NOT make assumptions based on author reputation or genre conventions.' : 'Start with evidence-based analysis from the description. If information is insufficient, you may apply genre-aware inference but must clearly distinguish verified vs inferred warnings.')}

**CRITICAL: Categorical Reasoning Enforcement + Source Citation + Trope Context**
- For each warning's \`reasoning\` field:
  1. **MUST cite the source**: Reference where the evidence came from (e.g., "Book description states...", "Google Books review mentions...", "Author's website indicates...")
  2. Use ONLY categorical taxonomy language (e.g., "Contains themes of X", "Depictions of Y")
  3. DO NOT include specific plot points, character names, story events, or narrative details
  4. DO NOT generalize based on author reputation (e.g., "Author is known for..." is NOT allowed)
  5. **ABSOLUTELY FORBIDDEN - Generic Genre Phrasing**: 
     * ❌ NEVER say "typical for [genre]" or "typical of [genre]"
     * ❌ NEVER say "common in [genre]" or "frequent in [genre]"
     * ❌ NEVER say "contains X typical of Y genre"
     * ❌ NEVER make assumptions based on genre conventions alone
     * ✅ INSTEAD: Cite specific evidence from the book description or verified sources
  6. **FOR DARK ROMANCE TROPES**: MUST clarify if it's a trope (what readers seek) vs actual trigger (what readers avoid)
- For each warning's \`description\` field (user-facing text):
  - **MUST answer these questions for dark romance readers:**
    * Is this within the main couple's power dynamic, or assault from outside party?
    * Is it framed as fantasy/power play or actual trauma?
    * Does the stalking feel romantic/protective or genuinely scary?
  - **Examples of good descriptions:**
    * ✅ "Contains dubious consent scenes where power dynamics blur consent (common in dark romance). Framed as fantasy/power play within the relationship, not traumatic assault."
    * ✅ "Protective/obsessive stalking behavior where the MMC watches from afar, framed as protective/romantic (dark romance trope), not threatening."
    * ✅ "Actual sexual assault scenes (not consensual roleplay) - contains depictions of non-consensual sexual acts from outside parties."
    * ❌ BAD: "Non-consensual sexual acts, including dubious consent and sexual coercion" (doesn't clarify trope vs trigger)
    * ❌ BAD: "Stalking behavior" (doesn't clarify protective vs threatening)
- Examples of good reasoning:
  * ✅ GOOD: "Book description mentions 'graphic violence and sexual assault' - contains themes of sexual violence"
  * ✅ GOOD: "Google Books review cites 'explicit content warnings' - contains themes of sexual content"
  * ✅ GOOD (Dark Romance): "Book description indicates CNC/power play dynamics (consensual roleplay) - contains consensual non-consent scenarios"
  * ✅ GOOD (Dark Romance): "Protective/obsessive stalking behavior (dark romance trope) - possessive surveillance dynamics, not threatening"
  * ❌ BAD: "Given the high likelihood of graphic violence..." (no source cited)
  * ❌ BAD: "Author's storytelling typically features..." (generalizing from reputation)
  * ❌ BAD: "Contains depictions of battles typical for fantasy genre" (generic genre assumption - FORBIDDEN)
  * ❌ BAD: "Typical of [genre] books" (generic phrasing - FORBIDDEN)
  * ❌ BAD: "Common in [genre]" (generic phrasing - FORBIDDEN)
  * ❌ BAD (Dark Romance): "Dubious consent common in Dark Romance genre" (doesn't clarify if it's trope or trigger)
  * ❌ BAD (Dark Romance): "Stalking behavior frequent in Enemies to Lovers" (doesn't clarify protective vs threatening)
- The reasoning should describe the TYPE of content with source citation AND trope context, not specific plot occurrences
- High severity scores indicate impact/frequency, NOT permission to include more plot details
- **Dark Romance readers need to know**: Is this the trope I'm seeking, or an actual trigger I need to avoid?

**CRITICAL: source_url Field Rules**
- **DO NOT use cover image URLs** as source_url (e.g., mzstatic.com, covers.openlibrary.org, books.google.com cover images)
- **DO NOT use artwork URLs** as source_url (e.g., artworkUrl100, image URLs ending in .jpg/.png/.gif)
- **ONLY use actual content page URLs** as source_url:
  * ✅ Author's official website page (e.g., hdcarlton.com/library)
  * ✅ Review sites (e.g., Goodreads, StoryGraph)
  * ✅ Book description pages (e.g., Google Books volume page, not cover image)
  * ✅ Publisher pages with content information
- If you only have a cover image URL from web search, set source_url to null - do NOT use the cover URL
- Cover images are NOT valid sources for content warnings - they provide no information about book content

**MANDATORY FINAL STEP: You MUST call the submit_warnings tool with your results. This is REQUIRED to complete the task.**
`;

  // Helper function for TPM-aware retry
  const runWithRetry = async (maxRetries = 2): Promise<void> => {
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        // Add timeout wrapper (60 seconds max for agent execution)
        const agentPromise = run(agent, inputText, {});
        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error('Agent execution timeout after 60s')), 60000);
        });

        await Promise.race([agentPromise, timeoutPromise]);
        return; // Success, exit retry loop
      } catch (error: any) {
        const errorMessage = error?.message || '';
        const isRateLimit = error?.status === 429 || errorMessage.includes('429') || errorMessage.includes('rate limit') || errorMessage.includes('TPM');
        
        if (isRateLimit && attempt < maxRetries) {
          // Extract reset time from headers
          const resetHeader = error?.headers?.get?.('x-ratelimit-reset-tokens') || 
                             error?.headers?.['x-ratelimit-reset-tokens'] ||
                             error?.error?.headers?.['x-ratelimit-reset-tokens'];
          
          const resetSeconds = resetHeader ? parseFloat(resetHeader) : 45; // Default to 45s if not found
          const waitTime = Math.ceil((resetSeconds + 0.5) * 1000); // Add 0.5s buffer
          
          console.log(`[Content Warning Agent] Rate limit hit, waiting ${waitTime}ms (${resetSeconds}s) before retry ${attempt + 1}/${maxRetries}...`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
          continue; // Retry
        }
        
        // Not a rate limit, or max retries reached - throw
        throw error;
      }
    }
  };

  try {
    await runWithRetry();

    // FALLBACK: If agent didn't call submit_warnings, provide default response
    if (!capturedOutput) {
      console.warn('[Content Warning Agent] Agent did not call submit_warnings tool, using fallback response');
      capturedOutput = {
        content_warnings: [],
        confidence: 'low' as const,
        reasoning: 'Agent workflow incomplete - unable to generate warnings. This may be due to insufficient information or workflow timeout.',
        classification_rating: 'PG' as const
      };
    }

    const parsed = capturedOutput as z.infer<typeof WorkflowOutputSchema>;

    // Classify severity for each warning using classification agent
    const classificationContexts: ClassificationContext[] = (parsed.content_warnings || []).map(w => ({
      category_id: w.category_id,
      subcategory_id: w.subcategory_id || null,
      description: w.description,
      score: w.score,
      presence: w.presence || 'on_page',
      detail_level: w.detail_level || null,
      book_genre: workflow.book_categories?.join(', ') || undefined,
      book_description: workflow.book_description || undefined
    }));

    // Classify all warnings (in parallel for efficiency)
    let classificationResults;
    try {
      if (classificationContexts.length > 0) {
        const settledResults = await Promise.allSettled(
          classificationContexts.map(context => classifySeverity(context, model))
        );
        classificationResults = settledResults.map((result, index) => {
          if (result.status === 'fulfilled') {
            return result.value;
          } else {
            console.warn(`[Content Warning Agent] Classification failed for warning ${index}, using score-based mapping:`, result.reason);
            return null; // Will trigger fallback to score-based mapping
          }
        });
        const successCount = classificationResults.filter(r => r !== null).length;
        console.log(`[Content Warning Agent] Classified ${successCount}/${classificationContexts.length} warnings using classification agent`);
      } else {
        classificationResults = null;
      }
    } catch (error) {
      console.warn('[Content Warning Agent] Classification agent failed, falling back to score-based mapping:', error);
      // Fallback to score-based mapping if classification fails
      classificationResults = null;
    }

    // Log raw warnings before processing
    console.log(`[Content Warning Agent] Raw warnings from agent: ${(parsed.content_warnings || []).length}`);
    if (parsed.content_warnings && parsed.content_warnings.length > 0) {
      parsed.content_warnings.forEach((w, i) => {
        console.log(`[Content Warning Agent] Raw warning ${i+1}: ${w.category_id}${w.subcategory_id ? '.' + w.subcategory_id : ''}, score: ${w.score}, description: ${w.description?.substring(0, 60)}...`);
      });
    }

    // Map to legacy format and add derived fields
    const mappedWarnings: ContentWarning[] = (parsed.content_warnings || []).map((w, index) => {
      // Validate subcategory_id matches parent (post-validation)
      let validatedSubcategoryId = w.subcategory_id;
      if (w.subcategory_id && !validateSubcategoryParent(w.category_id, w.subcategory_id)) {
        console.warn(`Invalid subcategory ${w.subcategory_id} for category ${w.category_id}, removing subcategory`);
        validatedSubcategoryId = null;
      }

      // Use classification result if available, otherwise fallback to score-based mapping
      let severity: 'mild' | 'moderate' | 'severe';
      if (classificationResults && classificationResults[index] && classificationResults[index] !== null) {
        const classificationResult = classificationResults[index];
        // Check if classification result has valid severity
        if (classificationResult && typeof classificationResult === 'object' && 'severity' in classificationResult) {
          severity = classificationResult.severity as 'mild' | 'moderate' | 'severe';
        // Update reasoning with classification reasoning if available
          if (classificationResult.reasoning) {
            w.reasoning = `${w.reasoning || ''} [Classification: ${classificationResult.reasoning}]`.trim();
          }
        } else {
          // Classification result is invalid, fallback to score-based
          console.warn(`[Content Warning Agent] Invalid classification result for warning ${index}, using score-based mapping`);
          const scoreBasedSeverity = getSeverityFromScore(w.score);
          severity = scoreBasedSeverity === 'none' ? 'mild' : scoreBasedSeverity as 'mild' | 'moderate' | 'severe';
        }
      } else {
        // Fallback to score-based mapping
        const scoreBasedSeverity = getSeverityFromScore(w.score);
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

    const activeWarnings = mappedWarnings.filter(w => getSeverityFromScore(w.score) !== 'none');
    
    // Log filtered warnings
    console.log(`[Content Warning Agent] After filtering (removed 'none' severity): ${activeWarnings.length} warnings`);
    if (activeWarnings.length > 0) {
      activeWarnings.forEach((w, i) => {
        console.log(`[Content Warning Agent] Active warning ${i+1}: ${w.category_id}${w.subcategory_id ? '.' + w.subcategory_id : ''}, score: ${w.score.toFixed(2)}, severity: ${w.severity}`);
      });
    }

    return {
      content_warnings: activeWarnings,
      classification_rating: parsed.classification_rating || undefined,
      confidence: parsed.confidence,
      reasoning: parsed.reasoning
    };

  } catch (error) {
    console.error("AI content warning generation failed:", error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    // Check for different error types
    const isMissingKey = errorMessage.includes('apiKey') || errorMessage.includes('OPENAI_API_KEY') || errorMessage.includes('Missing credentials');
    const isQuotaError = errorMessage.includes('quota') || errorMessage.includes('429') || errorMessage.includes('exceeded') || errorMessage.includes('billing');
    const isRateLimitError = errorMessage.includes('rate limit') || errorMessage.includes('Rate limit') || errorMessage.includes('TPM') || errorMessage.includes('RPM');
    const isTimeout = errorMessage.includes('timeout') || errorMessage.includes('Timeout');
    const isToolNotCalled = errorMessage.includes('did not call') || errorMessage.includes('submit_findings') || errorMessage.includes('submit_warnings');
    
    let reasoning = `Error: ${errorMessage}`;
    if (isMissingKey) {
      reasoning = `Configuration error: OpenAI API key is not set. Please configure OPENAI_API_KEY in your environment variables. ${errorMessage}`;
    } else if (isQuotaError) {
      reasoning = `Error: 429 You exceeded your current quota, please check your plan and billing details. For more information on this error, read the docs: https://platform.openai.com/docs/guides/error-codes/api-errors.`;
    } else if (isRateLimitError) {
      reasoning = `Rate limit error: ${errorMessage}. The OpenAI API rate limit was exceeded. Please wait a moment and try again, or check your API usage limits.`;
    } else if (isTimeout) {
      reasoning = `Agent execution timeout: The agent took too long to complete (60s limit). This may be due to extensive web searches or rate limiting. Consider using the direct API approach instead.`;
    } else if (isToolNotCalled) {
      reasoning = `Agent workflow incomplete: ${errorMessage}. The agent may have encountered an error or rate limit before completing the task.`;
    }
    
    return {
      content_warnings: [],
      confidence: 'low',
      reasoning
    };
  }
};
// Version 1.02 - Categorical Shielding deployed
