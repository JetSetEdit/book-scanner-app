import { Agent, Runner, user, tool } from "@openai/agents";
import { z } from "zod";
import { themePatterns, categoryGuidelines, trainingExamples } from "./training-examples";

// Configure OpenAI API key
if (!process.env.OPENAI_API_KEY) {
  throw new Error('OPENAI_API_KEY environment variable is required');
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
      console.error("Google Books API error:", e);
    }

    // 2. Apple Books API (Great for high-res covers)
    // Try ISBN first, then Title/Author if available
    try {
      let appleResponse;
      let appleData;

      if (isbn) {
        appleResponse = await fetchWithTimeout(`https://itunes.apple.com/search?term=${isbn}&media=ebook&entity=ebook&limit=1`);
        if (appleResponse && appleResponse.ok) {
          appleData = await appleResponse.json();
        }
      }

      // If ISBN search failed (or wasn't performed), try Title/Author from the query
      if (!appleData || appleData.resultCount === 0) {
        // Clean query for Apple Books
        const cleanQuery = query.replace(/content warnings|plot summary|official|notes|book|find/gi, "").trim();
        // Remove ISBN from query if present to avoid confusing the search
        const queryWithoutIsbn = cleanQuery.replace(/\b\d{10,13}\b/, "").trim();

        if (queryWithoutIsbn.length > 0) {
          appleResponse = await fetchWithTimeout(`https://itunes.apple.com/search?term=${encodeURIComponent(queryWithoutIsbn)}&media=ebook&entity=ebook&limit=1`);
          if (appleResponse && appleResponse.ok) {
            appleData = await appleResponse.json();
          }
        }
      }

      if (appleData && appleData.results && appleData.results.length > 0) {
        const item = appleData.results[0];
        // Get high-res cover
        const coverUrl = item.artworkUrl100?.replace("100x100bb", "600x600bb");

        // Add to results
        results.push(`Source: Apple Books\nTitle: ${item.trackName}\nAuthor: ${item.artistName}\nDescription: ${item.description}\nCover URL: ${coverUrl}`);
      }
    } catch (e) {
      console.error("Apple Books API error:", e);
    }

    // 3. DuckDuckGo (as fallback, but usually not useful for books)
    if (results.length === 0) {
      try {
        const response = await fetchWithTimeout(`https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`);
        if (response) {
          const data = await response.json();
          if (data.Abstract && data.Abstract.length > 20) {
            let ddgImage = "No cover available";
            if (data.Image) {
              const secureUrl = data.Image.startsWith("http") ? data.Image : `https://duckduckgo.com${data.Image}`;
              ddgImage = secureUrl;
            }
            results.push(`Source: DuckDuckGo\nSummary: ${data.Abstract}\nCover URL: ${ddgImage}`);
          }
        }
      } catch (e) { /* Ignore DDG errors */ }
    }

    if (results.length === 0) {
      return {
        results: "Search tool returned no results. Please rely on your internal knowledge base for this book.",
        source: "None"
      };
    }

    return {
      results: results.join("\n\n---\n\n"),
      source: isbn ? "Google Books (ISBN search)" : "Google Books"
    };
  } catch (error) {
    console.error("Web search tool error:", error);
    return {
      results: "Web search unavailable. Please rely on your internal knowledge base.",
      source: "Error"
    };
  }
};

// Web search tool for the AI agent
export const webSearchTool = tool({
  name: "web_search",
  description: "Search the web for information about a book, including reviews, content warnings, and plot details. Prioritize official author/publisher content notes.",
  strict: true,
  parameters: {
    type: "object",
    properties: {
      query: {
        type: "string",
        description: "Search query about the book (e.g., 'The Lightning Thief content warnings', 'book title author plot summary')"
      }
    },
    required: ["query"],
    additionalProperties: false
  },
  execute: performWebSearch
});

const contentWarningAgent = new Agent({
  name: "Book Information Finder & Content Warning Generator",
  instructions: `**CRITICAL: You MUST return ONLY valid JSON. Do NOT include any markdown formatting, explanatory text, or commentary. Your entire response must be a single valid JSON object.**

You are a specialized AI assistant that can find book information and generate content warnings. You have two main tasks:

## Task 1: Find Book Information (when given only an ISBN)
If you're given only an ISBN, use web search to find:
- Book title
- Author name
- Description/summary
- Categories/genres
- Cover image URL (The web search tool results will include a "Cover URL" field. You MUST use this value.)

## Task 2: Generate Content Warnings & Classifications
For any book (whether found via search or provided), generate content warnings using **Australian Classification Board** standards.

### **GOLD STANDARD: Official Author/Publisher Content Notes**
Many modern authors (especially in Romance, YA, and Fantasy) publish official "Content Notes" or "Trigger Warnings" on their websites (e.g., anahuang.com/content-warnings).
**You MUST prioritize finding these official lists.**

**Search Strategy:**
1. Search for "[Book Title] [Author] official content warnings" or "[Book Title] [Author] content notes".
2. Look for results from the author's own website (e.g., authorname.com).
3. If found, these are the "verified_source". Mark them as verified and link the source URL.

### **CRITICAL: When to Use Web Search**
**You MUST use web search if:**
- The book description is missing, very short (< 150 characters), or appears to be just a quote
- The book is a well-known classic or controversial work (e.g., "The Catcher in the Rye", "1984", "Lord of the Flies")
- You are unsure about the book's themes or content
- The provided metadata seems incomplete

### **Severity Rubric (Aligned with Australian Classification)**
Classify the severity of content based on these official descriptors:

1. **Mild (PG - Parental Guidance)**:
   - Content is present but low in impact.
   - Violence is implied or undetailed.
   - Coarse language is infrequent.
   - Sexual references are vague.
   - *Guidance*: Safe for most, but parents might want to know.

2. **Moderate (M - Mature)**:
   - Content is moderate in impact.
   - Violence or themes may be detailed but not gratuitous.
   - Coarse language may be frequent.
   - Sexual scenes may be descriptive but not explicit.
   - *Guidance*: Not recommended for children under 15 without guidance.

3. **Severe (MA15+ / R18+ - Restricted)**:
   - Content is strong or high in impact.
   - Violence is bloody, detailed, or cruel.
   - Sexual violence or non-consensual themes.
   - Detailed drug use.
   - *Guidance*: Legally restricted for minors in other media; essentially adult-only content.

### **Reasoning Requirement**
**CRITICAL**: Every warning MUST include a "reasoning" field.
- Explain *why* it fits the specific severity (e.g., "Rated Moderate (M) due to frequent fighting scenes...").
- Reference the Australian Classification standards where possible (e.g., "High impact violence").
- If you used web search, mention that in the reasoning (e.g., "Based on plot summary found via web search...").
- If you found an official author content note, mention it! (e.g., "Verified from author's official content notes page.")

## Theme Patterns and Trigger Words:
Use these patterns to identify content themes and their associated warnings:

${themePatterns.map(pattern => `
**${pattern.theme}**
Trigger Words: ${pattern.trigger_words.join(', ')}
Common Categories: ${pattern.common_categories.join(', ')}
Typical Severity: ${pattern.typical_severity}
Examples: ${pattern.examples.join(', ')}
`).join('\n')}

## Category Guidelines with Severity Levels:
Use these guidelines to properly categorize and rate severity:

${categoryGuidelines.map(guideline => `
**${guideline.category.toUpperCase()}**
Description: ${guideline.description}
Trigger Words: ${guideline.common_trigger_words.join(', ')}
Severity Guidelines:
- Mild: ${guideline.severity_guidelines.mild.join(', ')}
- Moderate: ${guideline.severity_guidelines.moderate.join(', ')}
- Severe: ${guideline.severity_guidelines.severe.join(', ')}
Training Examples: ${guideline.examples_from_training.join(', ')}
`).join('\n')}

## Training Examples from Author-Approved Content Warnings:
Here are real examples of content warnings from actual books to guide your analysis:

${trainingExamples.map(example => `
**${example.book_title} by ${example.book_author}**
Description: ${example.book_description}
Categories: ${example.book_categories?.join(', ') || 'N/A'}
Expected Warnings:
${example.expected_warnings.map(warning => `- ${warning.category} (${warning.severity}): ${warning.description}`).join('\n')}
`).join('\n')}

## Response Format:
For ISBN-only requests, return:
{
  "book_found": true/false,
  "book_title": "Book Title",
  "book_author": "Author Name",
  "book_description": "Book description...",
  "book_categories": ["genre1", "genre2", "CLASSIFICATION:MA15+"],
  "book_cover_url": "https://...",
  "content_warnings": [
    {
      "category": "violence",
      "description": "Brief description of the violent content",
      "severity": "moderate",
      "reasoning": "Rated Moderate (M) due to frequent fighting scenes...",
      "is_author_verified": true,
      "source_url": "https://authorwebsite.com/warnings"
    }
  ],
  "confidence": "high/medium/low",
  "reasoning": "How you found the information"
}

For regular content warning requests, return a JSON object with this structure:
{
  "content_warnings": [
    {
      "category": "violence",
      "description": "Brief description of the violent content",
      "severity": "moderate",
      "reasoning": "Rated Moderate (M) due to frequent fighting scenes...",
      "is_author_verified": true,
      "source_url": "https://authorwebsite.com/warnings"
    }
  ],
  "classification_rating": "MA15+",
  "confidence": "high/medium/low",
  "reasoning": "Overall reasoning for the analysis"
}

**CRITICAL: Classification Rating**
You MUST always include a \`classification_rating\` field in your response. This should be one of:
- "G" - General audiences (no warnings needed)
- "PG" - Parental Guidance (mild content)
- "M" - Mature (moderate content, 15+)
- "MA15+" - Mature Accompanied (strong content, 15+)
- "R18+" - Restricted (adult content, 18+)

Base this on the severity of warnings:
- No warnings or only mild → "G" or "PG"
- Moderate warnings → "M" or "MA15+"
- Severe warnings → "MA15+" or "R18+"

## Categories:
- violence: Physical violence, fighting, weapons, war
- sexual_content: Sexual situations, explicit content, romance
- substance_abuse: Alcohol, drugs, smoking, addiction
- mental_health: Depression, anxiety, suicide, mental illness
- death: Character deaths, grief, loss
- abuse: Physical, emotional, or sexual abuse
- discrimination: Racism, sexism, homophobia, etc.
- other: Any other potentially triggering content

**REMEMBER**: 
1. If the description is short or missing, ALWAYS use web search to find the full plot summary.
2. **CRITICAL: Use Your Internal Knowledge**: If the web search returns limited results or "no results", **YOU MUST use your internal training data** to fill in the gaps. You know about popular books like "Twisted Love" (dark romance, abuse themes), "The Catcher in the Rye" (mental health, language), "1984" (violence, torture), etc. DO NOT say "no warnings" just because the search tool failed.
3. **CRITICAL: Romance/Fantasy Books**: Romance and fantasy romance books (especially those with "Fae", "Alchemy", "Deluxe", "Limited Edition", "Pucking" in the title, or by authors like Callie Hart, Ana Huang, Lauren Landish, Colleen Hoover, etc.) typically contain sexual content, violence, and mature themes. Even if web search fails, you MUST generate appropriate warnings based on genre conventions. These books are typically rated M or MA15+.
4. **Well-Known Books**: For books you recognize from your training (especially popular romance, YA, thrillers), generate warnings based on what you know about them, even if the provided description is vague.
5. **When Web Search Fails**: If web search returns no results but you have a book title and author, you MUST still generate warnings based on:
   - Genre conventions (romance = sexual content, fantasy = violence, etc.)
   - Author's typical content (if you know the author)
   - Title keywords (e.g., "Fae", "Alchemy", "Dark", "Blood", "Pucking" suggest mature content)
   - DO NOT return book_found: false just because search failed - use what you know!
6. **Pre-Release Books**: If a book is not found in Google Books, it may be a pre-release title. Use the author's previous works and genre to infer warnings. For example, Lauren Landish writes steamy contemporary romance (M/MA15+).
6. If you generate a warning without a reasoning field, it will be rejected.
7. Always provide reasoning for every warning you generate.
8. **ALWAYS include a classification_rating** - even if there are no warnings, assign "G" or "PG".
9. Err on the side of caution - better to warn than to miss important content.

If no content warnings are needed after thorough analysis (including web search if needed), return an empty array: []`,
  model: "gpt-4o",
  modelSettings: {
    store: true
  },
  tools: [webSearchTool]
});

type WorkflowInput = {
  book_title: string;
  book_author: string;
  book_description?: string;
  book_categories?: string[];
  book_isbn?: string;
};

// Zod schemas for validation
const ContentWarningSchema = z.object({
  category: z.enum(['violence', 'sexual_content', 'substance_abuse', 'mental_health', 'death', 'abuse', 'discrimination', 'relationships', 'language', 'other']),
  description: z.string(),
  severity: z.enum(['mild', 'moderate', 'severe']),
  reasoning: z.string().optional().nullable(),
  is_author_verified: z.boolean().optional().default(false),
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

type ContentWarning = z.infer<typeof ContentWarningSchema>;
type WorkflowOutput = z.infer<typeof WorkflowOutputSchema> & {
  classification_rating?: 'G' | 'PG' | 'M' | 'MA15+' | 'R18+';
};

// Main workflow entrypoint
// New function to find book information and generate warnings
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
}> => {
  const inputText = `
I need you to find information about a book with ISBN: ${isbn}

**SEARCH STRATEGY:**
1. Use web search with the ISBN directly: "${isbn}" or "isbn ${isbn}" - the search tool will automatically detect ISBNs and search Google Books
2. Also try searching for variations like "ISBN ${isbn} book" or "${isbn} book title author"
3. Once you find the book, search for content warnings: "[Book Title] [Author] content warnings" or "[Book Title] content notes"

**IMPORTANT**: Even if web search fails, you should still:
- Use your internal knowledge about books, genres, and authors
- Generate warnings based on genre conventions (romance/fantasy books typically have sexual content, violence, etc.)
- Return book_found: true if you can infer reasonable information from the ISBN or if you have any knowledge about the book
- Only return book_found: false if you truly cannot determine anything about the book

If you find the book or can infer information, return book_found: true along with the book information and content warnings.
Only return book_found: false as a last resort if you have absolutely no information.
`;

  const conversationHistory = [
    user(inputText)
  ];

  const runner = new Runner({
    traceMetadata: {
      __trace_source__: "book-scanner-ai-search"
    }
  });

  try {
    const agentResult = await runner.run(
      contentWarningAgent,
      conversationHistory
    );

    if (!agentResult.finalOutput) {
      throw new Error("Agent result is undefined");
    }

    const responseText = agentResult.finalOutput;
    console.log("DEBUG: Raw AI Response:", responseText);

    try {
      // Clean up response (remove markdown code blocks)
      const cleanText = responseText.replace(/```json\n?|\n?```/g, "").trim();

      // Try to parse JSON response
      // First try parsing the whole cleaned text
      let parsed: any;
      try {
        parsed = JSON.parse(cleanText);
      } catch (e) {
        // If that fails, try regex extraction as fallback
        const jsonMatch = cleanText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          parsed = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error("No JSON object found in response");
        }
      }

      const result = FindBookOutputSchema.parse(parsed);

      if (result.book_found === false) {
        return {
          book_found: false,
          content_warnings: [],
          confidence: 'low',
          reasoning: "Book not found via web search"
        };
      }

      // Infer classification rating if not provided
      let classificationRating = result.classification_rating;
      if (!classificationRating && result.book_categories) {
        const classificationTag = result.book_categories.find(c => c.startsWith('CLASSIFICATION:'));
        if (classificationTag) {
          classificationRating = classificationTag.replace('CLASSIFICATION:', '') as any;
        }
      }
      if (!classificationRating) {
        if (result.content_warnings.length === 0) {
          classificationRating = 'G';
        } else {
          const hasSevere = result.content_warnings.some((w: any) => w.severity === 'severe');
          const hasModerate = result.content_warnings.some((w: any) => w.severity === 'moderate');
          if (hasSevere) {
            classificationRating = 'MA15+';
          } else if (hasModerate) {
            classificationRating = 'M';
          } else {
            classificationRating = 'PG';
          }
        }
      }

      return {
        book_found: true,
        book_title: result.book_title || undefined,
        book_author: result.book_author || undefined,
        book_description: result.book_description || undefined,
        book_categories: result.book_categories || undefined,
        book_cover_url: result.book_cover_url || undefined,
        content_warnings: result.content_warnings,
        classification_rating: classificationRating || undefined,
        confidence: result.confidence,
        reasoning: result.reasoning
      };
    } catch (parseError) {
      console.error("Failed to parse AI response:", parseError);
    }

    // Fallback: assume book not found if we can't parse the response
    return {
      book_found: false,
      content_warnings: [],
      confidence: 'low',
      reasoning: "Failed to parse AI response"
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
Consider the genre, target audience, and any content that might be triggering or concerning for readers.
`;

  const conversationHistory = [
    user(inputText)
  ];

  const runner = new Runner({
    traceMetadata: {
      __trace_source__: "book-scanner-content-warnings"
    }
  });

  try {
    const agentResult = await runner.run(
      contentWarningAgent,
      conversationHistory
    );

    if (!agentResult.finalOutput) {
      throw new Error("Agent result is undefined");
    }

    // Parse the agent's response
    const responseText = agentResult.finalOutput;
    console.log("DEBUG: Raw AI Response:", responseText);

    // Try to extract JSON from the response
    let contentWarnings: ContentWarning[] = [];
    let confidence: 'low' | 'medium' | 'high' = 'medium';
    let reasoning = "AI-generated content warnings based on book metadata";
    let classificationRating: 'G' | 'PG' | 'M' | 'MA15+' | 'R18+' | undefined = undefined;

    try {
      // Clean up response (remove markdown code blocks)
      const cleanText = responseText.replace(/```json\n?|\n?```/g, "").trim();

      let parsedData: any;

      // Try parsing the whole cleaned text
      try {
        parsedData = JSON.parse(cleanText);
      } catch (e) {
        // Fallback to regex extraction
        const objectMatch = cleanText.match(/\{[\s\S]*\}/);
        const arrayMatch = cleanText.match(/\[[\s\S]*\]/);

        if (objectMatch) {
          parsedData = JSON.parse(objectMatch[0]);
        } else if (arrayMatch) {
          parsedData = JSON.parse(arrayMatch[0]);
        } else {
          throw new Error("No JSON found in response");
        }
      }

      // Check if it's an object (WorkflowOutput) or array (ContentWarning[])
      if (Array.isArray(parsedData)) {
        const validationResult = z.array(ContentWarningSchema).safeParse(parsedData);
        if (validationResult.success) {
          contentWarnings = validationResult.data;
        }
      } else {
        // It's an object
        const validationResult = WorkflowOutputSchema.safeParse(parsedData);
        if (validationResult.success) {
          contentWarnings = validationResult.data.content_warnings;
          confidence = validationResult.data.confidence;
          reasoning = validationResult.data.reasoning;
          classificationRating = validationResult.data.classification_rating || undefined;
        } else {
          // Maybe it just returned { content_warnings: [...] } without other fields matching exactly or extra fields
          if (parsedData.content_warnings && Array.isArray(parsedData.content_warnings)) {
            const warningsValidation = z.array(ContentWarningSchema).safeParse(parsedData.content_warnings);
            if (warningsValidation.success) {
              contentWarnings = warningsValidation.data;
              confidence = parsedData.confidence || confidence;
              reasoning = parsedData.reasoning || reasoning;
              classificationRating = parsedData.classification_rating;
            }
          }
        }
      }

      // Infer classification rating from warnings if not provided
      if (!classificationRating) {
        if (contentWarnings.length === 0) {
          classificationRating = 'G';
        } else {
          const hasSevere = contentWarnings.some(w => w.severity === 'severe');
          const hasModerate = contentWarnings.some(w => w.severity === 'moderate');
          if (hasSevere) {
            classificationRating = 'MA15+';
          } else if (hasModerate) {
            classificationRating = 'M';
          } else {
            classificationRating = 'PG';
          }
        }
      }

      // Ensure reasoning exists - if missing, generate a default one
      contentWarnings = contentWarnings.map(warning => {
        if (!warning.reasoning || warning.reasoning.trim() === '') {
          console.warn(`Warning missing reasoning field: ${warning.category} - ${warning.description}`);
          // Generate a default reasoning based on available information
          warning.reasoning = `Generated based on book metadata: ${workflow.book_description ? 'description available' : 'no description'}, ${workflow.book_categories ? `categories: ${workflow.book_categories.join(', ')}` : 'no categories'}`;
        }
        return warning;
      });

      // If no warnings were generated, ensure we have a detailed reasoning explaining why
      if (contentWarnings.length === 0) {
        if (!reasoning || reasoning === "AI-generated content warnings based on book metadata") {
          // Generate a detailed explanation for why no warnings were generated
          const hasDescription = workflow.book_description && workflow.book_description.length >= 150;
          const hasCategories = workflow.book_categories && workflow.book_categories.length > 0;
          const isThinDesc = !workflow.book_description || workflow.book_description.length < 150;

          if (isThinDesc) {
            reasoning = `After performing web search for "${workflow.book_title}" by ${workflow.book_author}, the AI analysis determined that this book does not contain content that requires warnings. The book appears to be appropriate for general audiences without specific sensitive themes.`;
          } else if (hasDescription && hasCategories) {
            reasoning = `Based on the provided description and categories (${workflow.book_categories?.join(', ') || 'N/A'}), this book does not appear to contain themes that require content warnings. The content is suitable for general audiences.`;
          } else if (hasDescription) {
            reasoning = `Based on the book description provided, this work does not contain themes that require content warnings. The content appears appropriate for general audiences.`;
          } else {
            reasoning = `Unable to determine if warnings are needed due to insufficient metadata. No description or categories were provided for analysis.`;
            confidence = 'low';
          }
        }
      }

      // Determine confidence based on available information if not set by AI
      if (confidence === 'medium') {
        if (workflow.book_description && workflow.book_description.length >= 150 && workflow.book_categories) {
          confidence = 'high';
        } else if (workflow.book_description && workflow.book_description.length >= 150 || workflow.book_categories) {
          confidence = 'medium';
        } else {
          confidence = 'low';
        }
      }
    } catch (parseError) {
      console.error("Failed to parse agent response:", parseError);
      confidence = 'low';
      reasoning = "Failed to parse AI response, no warnings generated";
    }

    return {
      content_warnings: contentWarnings,
      classification_rating: classificationRating,
      confidence,
      reasoning
    };

  } catch (error) {
    console.error("Content warning generation failed:", error);
    return {
      content_warnings: [],
      confidence: 'low',
      reasoning: `Error generating content warnings: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
};
