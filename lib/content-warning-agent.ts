import { Agent, run, tool } from "@openai/agents";
import { z } from "zod";
import { WARNING_CATEGORIES, SEVERITY_MAPPING, getSeverityFromScore } from "./config/taxonomy";

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

    // 1. Google Books API - Try ISBN search first if we have an ISBN
    try {
      let gbResponse;
      if (isbn) {
        // Direct ISBN search (most reliable)
        gbResponse = await fetchWithTimeout(`https://www.googleapis.com/books/v1/volumes?q=isbn:${isbn}&maxResults=3`);
      } else {
        // Clean the query to just key terms (remove search-specific terms)
        const cleanQuery = query.replace(/content warnings|plot summary|official|notes|book|find/gi, "").trim();
        if (cleanQuery.length > 0) {
          gbResponse = await fetchWithTimeout(`https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(cleanQuery)}&maxResults=3`);
        }
      }

      if (gbResponse) {
        const gbData = await gbResponse.json();

        if (gbData.items && gbData.items.length > 0) {
          // Helper to validate image
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

          for (const item of gbData.items) {
            const info = item.volumeInfo;
            const description = info.description || "No description available";
            const categories = info.categories?.join(", ") || "No categories";

            // Select best cover
            let coverUrl = "No cover available";
            const potentialCovers = [
              info.imageLinks?.extraLarge,
              info.imageLinks?.large,
              info.imageLinks?.medium,
              info.imageLinks?.thumbnail,
              info.imageLinks?.smallThumbnail
            ];

            for (const url of potentialCovers) {
              if (url) {
                const secureUrl = url.replace("http:", "https:");
                if (await validateImage(secureUrl)) {
                  coverUrl = secureUrl;
                  break;
                }
              }
            }

            results.push(`Source: Google Books\nTitle: ${info.title}\nAuthor: ${info.authors?.join(", ") || "Unknown"}\nDescription: ${description}\nCategories: ${categories}\nPublisher: ${info.publisher || "Unknown"}\nPublished: ${info.publishedDate || "Unknown"}\nCover URL: ${coverUrl}`);
          }
        }
      }
    } catch (e) {
      // Ignore errors
    }

    // 2. Apple Books API (Fallback)
    try {
      let appleResponse;
      if (isbn) {
        appleResponse = await fetchWithTimeout(`https://itunes.apple.com/lookup?isbn=${isbn}`);

        // If ISBN search yields no results, try searching by title if available in query
        if (appleResponse) {
          const data = await appleResponse.json();
          if (data.resultCount === 0) {
            // Extract title from query if possible, or skip
            const titleMatch = query.match(/^(.*?)(?:\s\d{10,13})?$/);
            if (titleMatch && titleMatch[1]) {
              const title = titleMatch[1].trim();
              if (title.length > 5) { // Avoid short garbage queries
                appleResponse = await fetchWithTimeout(`https://itunes.apple.com/search?term=${encodeURIComponent(title)}&media=ebook&limit=3`);
              }
            }
          }
        }
      } else {
        const cleanQuery = query.replace(/content warnings|plot summary|official|notes|book|find/gi, "").trim();
        if (cleanQuery.length > 0) {
          appleResponse = await fetchWithTimeout(`https://itunes.apple.com/search?term=${encodeURIComponent(cleanQuery)}&media=ebook&limit=3`);
        }
      }

      if (appleResponse) {
        const appleData = await appleResponse.json();
        if (appleData.results && appleData.results.length > 0) {
          for (const item of appleData.results) {
            // Apple artwork is usually 100x100, replace to get higher res
            const highResCover = item.artworkUrl100 ? item.artworkUrl100.replace('100x100', '600x600') : "No cover available";

            results.push(`Source: Apple Books\nTitle: ${item.trackName}\nAuthor: ${item.artistName}\nDescription: ${item.description || "No description"}\nCover URL: ${highResCover}`);
          }
        }
      }
    } catch (e) {
      // Ignore errors
    }

    // 3. Author/Publisher Official Site Search (Priority)
    try {
      // Construct a query specifically for author content warnings
      let authorQuery = "";
      if (isbn) {
        // Try a broader query first
        authorQuery = `"${isbn}" content warnings`;
      } else {
        const cleanQuery = query.replace(/content warnings|plot summary|official|notes|book|find/gi, "").trim();
        // Try to extract author name for a more targeted search
        const authorMatch = cleanQuery.match(/by\s+(.+)/i);
        const authorName = authorMatch ? authorMatch[1] : "";

        if (authorName) {
          authorQuery = `${cleanQuery} site:hannahgrace.co.uk OR site:author-site.com content warnings`;
        } else {
          authorQuery = `${cleanQuery} official author content warnings`;
        }
      }

      // Use the HTML version of DuckDuckGo or a different search approach if API is limited
      // For now, we'll try a slightly different query structure
      const ddgResponse = await fetchWithTimeout(`https://api.duckduckgo.com/?q=${encodeURIComponent(authorQuery)}&format=json`);
      if (ddgResponse) {
        const ddgData = await ddgResponse.json();

        if (ddgData.AbstractText) {
          results.push(`Source: Official/Author Search\nSummary: ${ddgData.AbstractText}\nURL: ${ddgData.AbstractURL || "N/A"}`);
        }
        if (ddgData.RelatedTopics) {
          for (const topic of ddgData.RelatedTopics.slice(0, 5)) { // Increased to 5
            if (topic.Text && topic.FirstURL) {
              results.push(`Source: Official/Author Search\nInfo: ${topic.Text}\nURL: ${topic.FirstURL}`);
            }
          }
        }

        // Also try searching for the author's name directly to find their site
        if (!ddgData.AbstractText && !ddgData.RelatedTopics?.length) {
          const authorNameMatch = query.match(/by\s+(.+?)(?:\s+content|\s*$)/i);
          if (authorNameMatch) {
            const authorName = authorNameMatch[1];
            const authorSiteQuery = `${authorName} official website content warnings`;
            const authorResponse = await fetchWithTimeout(`https://api.duckduckgo.com/?q=${encodeURIComponent(authorSiteQuery)}&format=json`);
            if (authorResponse) {
              const authorData = await authorResponse.json();
              if (authorData.AbstractText) {
                results.push(`Source: Author Site Search\nSummary: ${authorData.AbstractText}\nURL: ${authorData.AbstractURL}`);
              }
            }
          }
        }
      }
    } catch (e) {
      // Ignore errors
    }

    // 3b. Direct Author Site Scraping (Fallback for specific authors)
    try {
      // Known author sites mapping (can be expanded)
      const authorDomains: Record<string, string> = {
        "hannah grace": "https://www.hannahgrace.co.uk/books",
        "h.d. carlton": "https://hdcarlton.com/library",
        "hd carlton": "https://hdcarlton.com/library",
        "jennifer hallock": "https://www.jenniferhallock.com/content-guidance",
        // Add more authors here
      };

      const cleanQuery = query.toLowerCase();
      console.log(`--- DEBUG: Checking for author domains in query: "${cleanQuery}" ---`);
      let targetUrl = "";

      for (const [author, url] of Object.entries(authorDomains)) {
        if (cleanQuery.includes(author)) {
          console.log(`--- DEBUG: Match found for author: "${author}" -> ${url} ---`);
          targetUrl = url;
          break;
        }
      }

      if (targetUrl) {
        // Fetch the author's book list page
        console.log(`--- DEBUG: Attempting to fetch: ${targetUrl} ---`);
        const response = await fetchWithTimeout(targetUrl);
        if (response) {
          const html = await response.text();
          console.log(`--- DEBUG: Fetched HTML length: ${html.length} ---`);

          // Simple heuristic to find the book link
          // Extract title more reliably
          let bookTitle = "";

          console.log(`--- DEBUG: Processing query for title extraction: "${query}" ---`);

          // Try to find title in quotes first
          const quoteMatch = query.match(/"([^"]+)"/);
          if (quoteMatch) {
            bookTitle = quoteMatch[1].toLowerCase().replace(/content warnings|plot summary|official|notes|book|find/gi, "").trim();
          } else {
            // Fallback: remove known terms
            // More aggressive removal of author names and common terms
            bookTitle = query.toLowerCase()
              .replace(/content warnings|plot summary|official|notes|book|find|isbn|\d{10,13}|by\s+hannah\s+grace|hannah\s+grace|by\s+h\.d\.\s+carlton|h\.d\.\s+carlton|hd\s+carlton|by\s+jennifer\s+hallock|jennifer\s+hallock/gi, "")
              .trim();
          }

          console.log(`--- DEBUG: Looking for book title: "${bookTitle}" ---`);

          if (bookTitle && html.toLowerCase().includes(bookTitle)) {
            console.log('--- DEBUG: Found book title in HTML! ---');
            // Inject a strong signal to the agent
            results.push(`Source: Direct Author Site Scrape\nInfo: CONFIRMED: The book "${bookTitle}" is listed on the official author website (${targetUrl}) which contains content warnings. You should treat this as a verified source.\nURL: ${targetUrl}`);
          } else {
            console.log('--- DEBUG: Book title NOT found in HTML. ---');
          }
        } else {
          console.log('--- DEBUG: Fetch returned null/undefined for: ' + targetUrl);
        }
      }
    } catch (e) {
      console.log('--- DEBUG: Error during scraping:', e);
      // Ignore
    }

    // Log final results for debugging
    const finalResults = results.length > 0 ? results.join("\n\n---\n\n") : "No results found.";

    // 4. DuckDuckGo (General Web Search) - Fallback for warnings
    try {
      const ddgResponse = await fetchWithTimeout(`https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json`);
      if (ddgResponse) {
        const ddgData = await ddgResponse.json();
        if (ddgData.AbstractText) {
          results.push(`Source: DuckDuckGo\nSummary: ${ddgData.AbstractText}`);
        }
        if (ddgData.RelatedTopics) {
          for (const topic of ddgData.RelatedTopics.slice(0, 3)) {
            if (topic.Text) {
              results.push(`Source: DuckDuckGo Related\nInfo: ${topic.Text}`);
            }
          }
        }
        // Try to find image in DuckDuckGo results if we still don't have one
        if (ddgData.Image && ddgData.Image.length > 0) {
          results.push(`Source: DuckDuckGo Image\nImage URL: ${ddgData.Image}`);
        }
      }
    } catch (e) {
      // Ignore errors
    }

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
const baseAgentConfig = {
  name: "Content Warning Agent",
  model: "gpt-4o",
  instructions: `
You are an expert content warning generator for a book database. Your goal is to analyze book metadata and generate accurate, specific content warnings based on the Australian Classification Board standards.

## Taxonomy & Categories
You must use the following categories for your analysis:
${WARNING_CATEGORIES.map(c => `- ${c.id}: ${c.shortDescription}`).join('\n')}

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

If no content warnings are needed after thorough analysis (including web search if needed), return an empty array: []`
};

type WorkflowInput = {
  book_title: string;
  book_author: string;
  book_description?: string;
  book_categories?: string[];
  book_isbn?: string;
};

// Zod schemas for validation
const ContentWarningSchema = z.object({
  category_id: z.enum(['violence', 'sexual_content', 'substance_use_or_alcohol', 'mental_health', 'death_or_grief', 'emotional_abuse_or_toxic_relationships', 'bullying_or_social_cruelty', 'self_harm_or_suicidal_ideation', 'discrimination', 'language', 'other']),
  description: z.string().describe("User-facing description of the content"),
  score: z.number().min(0).max(1).describe("Severity score from 0.0 to 1.0"),
  reasoning: z.string().describe("Technical explanation for the score"),
  is_author_verified: z.boolean().optional().default(false).describe("MUST be set to true if the warnings come from an official author/publisher site."),
  source_url: z.string().optional().nullable(),
});

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
export const findBookAndGenerateWarnings = async (isbn: string): Promise<{
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

  const agent = new Agent({
    ...baseAgentConfig,
    tools: [webSearchTool, submitTool],
    instructions: baseAgentConfig.instructions + "\n\nWhen you have gathered all information and generated warnings, you MUST call the `submit_findings` tool with your results."
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
`;

  try {
    await run(agent, inputText, {});

    if (!capturedOutput) {
      throw new Error("Agent did not call submit_findings tool");
    }

    const parsed = capturedOutput as z.infer<typeof FindBookOutputSchema>;

    // Map to legacy format and add derived fields
    const mappedWarnings: ContentWarning[] = (parsed.content_warnings || []).map(w => ({
      ...w,
      severity: getSeverityFromScore(w.score) === 'none' ? 'mild' : getSeverityFromScore(w.score) as 'mild' | 'moderate' | 'severe', // Fallback for legacy type
      category: w.category_id, // Map id to legacy category field
      id: crypto.randomUUID(), // Temp ID
      helpful_count: 0,
      not_helpful_count: 0
    }));

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

export const generateContentWarnings = async (workflow: WorkflowInput): Promise<WorkflowOutput> => {
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

  const agent = new Agent({
    ...baseAgentConfig,
    tools: [webSearchTool, submitTool],
    instructions: baseAgentConfig.instructions + "\n\nWhen you have generated warnings, you MUST call the `submit_warnings` tool with your results."
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

CALL THE submit_warnings TOOL WITH THE RESULT.
`;

  try {
    await run(agent, inputText, {});

    if (!capturedOutput) {
      throw new Error("Agent did not call submit_warnings tool");
    }

    const parsed = capturedOutput as z.infer<typeof WorkflowOutputSchema>;

    // Map to legacy format and add derived fields
    const mappedWarnings: ContentWarning[] = parsed.content_warnings.map(w => ({
      ...w,
      severity: getSeverityFromScore(w.score) === 'none' ? 'mild' : getSeverityFromScore(w.score) as 'mild' | 'moderate' | 'severe',
      category: w.category_id,
      id: crypto.randomUUID(),
      helpful_count: 0,
      not_helpful_count: 0
    }));

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
