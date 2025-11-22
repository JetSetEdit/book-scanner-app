import { Agent, Runner, user, tool } from "@openai/agents";
import { z } from "zod";

// Configure OpenAI API key
if (!process.env.OPENAI_API_KEY) {
  throw new Error('OPENAI_API_KEY environment variable is required');
}

// Web search tool for the AI agent
const webSearchTool = tool({
  name: "web_search",
  description: "Search the web for information about a book, including reviews, content warnings, and plot details. Prioritize official author/publisher content notes.",
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
  execute: async ({ query }) => {
    try {
      // IMPROVED SEARCH STRATEGY:
      // 1. Try DuckDuckGo (Instant Answers - weak but sometimes has official summaries)
      // 2. Try Google Books API (Rich metadata - strong fallback)
      
      const results = [];

      // 1. DuckDuckGo
      try {
          const response = await fetch(`https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`);
          const data = await response.json();
          if (data.Abstract) {
              results.push(`Source: DuckDuckGo\nSummary: ${data.Abstract}`);
          }
      } catch (e) { /* Ignore DDG errors */ }

      // 2. Google Books (Simulating a "search" by querying volumes)
      // We clean the query to just key terms to improve hit rate
      const cleanQuery = query.replace(/content warnings|plot summary|official|notes/gi, "").trim();
      try {
          const gbResponse = await fetch(`https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(cleanQuery)}&maxResults=3`);
          const gbData = await gbResponse.json();
          
          if (gbData.items) {
              gbData.items.forEach((item: any) => {
                  const info = item.volumeInfo;
                  results.push(`Source: Google Books (${info.title})\nDescription: ${info.description || "No description"}\nCategories: ${info.categories?.join(", ")}`);
              });
          }
      } catch (e) { /* Ignore Google Books errors */ }

      if (results.length === 0) {
          return {
              results: "Search tool returned no results. Please rely on your internal knowledge base for this book.",
              source: "None"
          };
      }

      return {
        results: results.join("\n\n---\n\n"),
        source: "Composite (DuckDuckGo + Google Books)"
      };
    } catch (error) {
      return {
        results: "Web search unavailable. Please rely on your internal knowledge base.",
        source: "Error"
      };
    }
  }
});

const contentWarningAgent = new Agent({
  name: "Book Information Finder & Content Warning Generator",
  instructions: `You are a specialized AI assistant that can find book information and generate content warnings. You have two main tasks:

## Task 1: Find Book Information (when given only an ISBN)
If you're given only an ISBN, use web search to find:
- Book title
- Author name
- Description/summary
- Categories/genres
- Cover image URL (if available)

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

**Search queries you should use:**
- "[Book Title] [Author] official content warnings"
- "[Book Title] [Author] plot summary"
- "[Book Title] content warnings"
- "[Book Title] themes controversy"
- "[Book Title] [Author] what happens"

**DO NOT rely solely on a short description or quote. Always search for full plot summaries and reviews if the provided information is insufficient.**

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
3. **Well-Known Books**: For books you recognize from your training (especially popular romance, YA, thrillers), generate warnings based on what you know about them, even if the provided description is vague.
4. If you generate a warning without a reasoning field, it will be rejected.
5. Always provide reasoning for every warning you generate.
6. **ALWAYS include a classification_rating** - even if there are no warnings, assign "G" or "PG".
7. Err on the side of caution - better to warn than to miss important content.

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
  category: z.enum(['violence', 'sexual_content', 'substance_abuse', 'mental_health', 'death', 'abuse', 'discrimination', 'other']),
  description: z.string(),
  severity: z.enum(['mild', 'moderate', 'severe']),
  reasoning: z.string().optional(),
  is_author_verified: z.boolean().optional().default(false),
  source_url: z.string().optional(),
});

const FindBookOutputSchema = z.object({
  book_found: z.boolean(),
  book_title: z.string().optional(),
  book_author: z.string().optional(),
  book_description: z.string().optional(),
  book_categories: z.array(z.string()).optional(),
  book_cover_url: z.string().optional(),
  content_warnings: z.array(ContentWarningSchema).optional().default([]),
  classification_rating: z.enum(['G', 'PG', 'M', 'MA15+', 'R18+']).optional(),
  confidence: z.enum(['low', 'medium', 'high']).optional().default('medium'),
  reasoning: z.string().optional().default("AI-found book information and generated warnings")
});

const WorkflowOutputSchema = z.object({
  content_warnings: z.array(ContentWarningSchema),
  classification_rating: z.enum(['G', 'PG', 'M', 'MA15+', 'R18+']).optional(),
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

Please use web search to:
1. Find the book's title, author, and description
2. Generate appropriate content warnings based on what you find

If you can't find the book, return book_found: false.
If you find the book, return book_found: true along with the book information and content warnings.
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
    
    try {
      // Try to parse JSON response
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
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
          book_title: result.book_title,
          book_author: result.book_author,
          book_description: result.book_description,
          book_categories: result.book_categories,
          book_cover_url: result.book_cover_url,
          content_warnings: result.content_warnings,
          classification_rating: classificationRating,
          confidence: result.confidence,
          reasoning: result.reasoning
        };
      }
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
    
    // Try to extract JSON from the response
    let contentWarnings: ContentWarning[] = [];
    let confidence: 'low' | 'medium' | 'high' = 'medium';
    let reasoning = "AI-generated content warnings based on book metadata";
    let classificationRating: 'G' | 'PG' | 'M' | 'MA15+' | 'R18+' | undefined = undefined;

    try {
      // Look for JSON in the response - try full object first, then array
      const objectMatch = responseText.match(/\{[\s\S]*\}/);
      const arrayMatch = responseText.match(/\[[\s\S]*\]/);
      
      let parsedData: any;

      if (objectMatch) {
        parsedData = JSON.parse(objectMatch[0]);
        // If it's an object, try to parse with WorkflowOutputSchema or handle direct array
        const validationResult = WorkflowOutputSchema.safeParse(parsedData);
        if (validationResult.success) {
            contentWarnings = validationResult.data.content_warnings;
            confidence = validationResult.data.confidence;
            reasoning = validationResult.data.reasoning;
            classificationRating = validationResult.data.classification_rating;
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

      } else if (arrayMatch) {
        parsedData = JSON.parse(arrayMatch[0]);
        const validationResult = z.array(ContentWarningSchema).safeParse(parsedData);
        if (validationResult.success) {
            contentWarnings = validationResult.data;
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
