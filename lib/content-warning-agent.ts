import { Agent, Runner, user, tool } from "@openai/agents";

// Configure OpenAI API key
if (!process.env.OPENAI_API_KEY) {
  throw new Error('OPENAI_API_KEY environment variable is required');
}

// Web search tool for the AI agent
const webSearchTool = tool({
  name: "web_search",
  description: "Search the web for information about a book, including reviews, content warnings, and plot details",
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
      // Use a web search API (you could use Google Custom Search, Bing, etc.)
      // For now, we'll simulate a web search response
      const response = await fetch(`https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`);
      const data = await response.json();
      
      return {
        results: data.Abstract || "No additional information found",
        source: "DuckDuckGo"
      };
    } catch (error) {
      return {
        results: "Web search unavailable",
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

## Task 2: Generate Content Warnings
For any book (whether found via search or provided), generate content warnings with:
- Category (violence, sexual_content, substance_abuse, mental_health, death, abuse, discrimination, other)
- Description (brief, helpful description of the content)
- Severity (mild, moderate, severe)

## Guidelines:
1. **Be proactive and helpful** - Include warnings for content that readers should know about, even if mentioned briefly
2. **Be specific** - Provide clear, concise descriptions
3. **Be appropriate** - Consider the target audience and book genre
4. **Be comprehensive** - Err on the side of caution - better to warn than to miss important content
5. **Use proper categories** - Stick to the predefined categories
6. **Assess severity carefully** - Consider impact and frequency
7. **Use web search extensively** - Search for book information, reviews, plot summaries, and content warnings
8. **Look for trigger words** - Murder, death, violence, abuse, mental health issues, substance use, etc. should generate warnings

## Web Search Usage:
- For ISBN-only requests: Search "ISBN [isbn] book title author" or "[isbn] book information"
- For content warnings: Search "[book title] [author] content warnings" or "[book title] plot summary"
- Search for reviews, Goodreads pages, or book databases
- If no book information is found via web search, return book_found: false

## Response Format:
For ISBN-only requests, return:
{
  "book_found": true/false,
  "book_title": "Book Title",
  "book_author": "Author Name",
  "book_description": "Book description...",
  "book_categories": ["genre1", "genre2"],
  "book_cover_url": "https://...",
  "content_warnings": [
    {
      "category": "violence",
      "description": "Brief description of the violent content",
      "severity": "moderate",
      "reasoning": "Why this warning was generated (e.g., 'Book description mentions battles and combat')"
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
      "reasoning": "Why this warning was generated (e.g., 'Book description mentions battles and combat')"
    }
  ],
  "confidence": "high/medium/low",
  "reasoning": "Overall reasoning for the analysis"
}

## Categories:
- violence: Physical violence, fighting, weapons, war
- sexual_content: Sexual situations, explicit content, romance
- substance_abuse: Alcohol, drugs, smoking, addiction
- mental_health: Depression, anxiety, suicide, mental illness
- death: Character deaths, grief, loss
- abuse: Physical, emotional, or sexual abuse
- discrimination: Racism, sexism, homophobia, etc.
- other: Any other potentially triggering content

## Severity Levels:
- mild: Brief mentions, minor content, not graphic
- moderate: More detailed, some graphic content, significant impact
- severe: Graphic, disturbing, or highly triggering content

## When to Generate Warnings:
- **Violence**: Any mention of fighting, weapons, war, physical harm, murder, killing
- **Death**: Character deaths, grief, loss, funerals, mortality themes
- **Mental Health**: Depression, anxiety, suicide, mental illness, psychological trauma
- **Abuse**: Physical, emotional, or sexual abuse, domestic violence
- **Substance Abuse**: Alcohol, drugs, smoking, addiction themes
- **Sexual Content**: Sexual situations, explicit content, romance with mature themes
- **Discrimination**: Racism, sexism, homophobia, prejudice, hate crimes
- **Other**: Any content that might be triggering or concerning for readers

**Important**: If the book description mentions themes like "murder", "dark", "gritty", "secrets", "trauma", or similar, you should generate appropriate warnings. It's better to be cautious and helpful to readers.

## Examples of Good Content Warnings with Reasoning:
- "Contains scenes of violence including fighting and weapons" (violence, moderate) - Reasoning: "Book description mentions 'epic battles' and 'sword fighting'"
- "Deals with themes of depression and mental health struggles" (mental_health, moderate) - Reasoning: "Plot summary indicates character deals with 'inner demons' and 'psychological trauma'"
- "Includes character death and grief" (death, mild) - Reasoning: "Genre is fantasy adventure which typically involves character deaths in battle"

**Important**: For each content warning, provide a clear "reasoning" field that explains WHY you generated that specific warning. This helps users understand the AI's decision-making process.
- "Contains sexual content and mature themes" (sexual_content, moderate)
- "Addresses substance abuse and addiction" (substance_abuse, moderate)

If no content warnings are needed, return an empty array: []`,
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

type ContentWarning = {
  category: 'violence' | 'sexual_content' | 'substance_abuse' | 'mental_health' | 'death' | 'abuse' | 'discrimination' | 'other';
  description: string;
  severity: 'mild' | 'moderate' | 'severe';
  reasoning?: string;
};

type WorkflowOutput = {
  content_warnings: ContentWarning[];
  confidence: 'low' | 'medium' | 'high';
  reasoning: string;
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
        const result = JSON.parse(jsonMatch[0]);
        
        if (result.book_found === false) {
          return {
            book_found: false,
            content_warnings: [],
            confidence: 'low',
            reasoning: "Book not found via web search"
          };
        }

        return {
          book_found: true,
          book_title: result.book_title,
          book_author: result.book_author,
          book_description: result.book_description,
          book_categories: result.book_categories,
          book_cover_url: result.book_cover_url,
          content_warnings: result.content_warnings || [],
          confidence: result.confidence || 'medium',
          reasoning: result.reasoning || "AI-found book information and generated warnings"
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
  // Prepare the input text for the agent
  const inputText = `
Book Information:
- Title: ${workflow.book_title}
- Author: ${workflow.book_author}
${workflow.book_description ? `- Description: ${workflow.book_description}` : ''}
${workflow.book_categories ? `- Categories: ${workflow.book_categories.join(', ')}` : ''}
${workflow.book_isbn ? `- ISBN: ${workflow.book_isbn}` : ''}

Please analyze this book and generate appropriate content warnings. Consider the genre, target audience, and any content that might be triggering or concerning for readers.
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

    try {
      // Look for JSON in the response - try full object first, then array
      const objectMatch = responseText.match(/\{[\s\S]*\}/);
      const arrayMatch = responseText.match(/\[[\s\S]*\]/);
      
      if (objectMatch) {
        // Try to parse as full object with reasoning
        const result = JSON.parse(objectMatch[0]);
        if (result.content_warnings && Array.isArray(result.content_warnings)) {
          contentWarnings = result.content_warnings;
          confidence = result.confidence || confidence;
          reasoning = result.reasoning || reasoning;
        }
      } else if (arrayMatch) {
        // Fallback to simple array format
        contentWarnings = JSON.parse(arrayMatch[0]);
      }
      
      // Validate the warnings
      contentWarnings = contentWarnings.filter(warning => 
        warning.category && 
        warning.description && 
        warning.severity &&
        ['violence', 'sexual_content', 'substance_abuse', 'mental_health', 'death', 'abuse', 'discrimination', 'other'].includes(warning.category) &&
        ['mild', 'moderate', 'severe'].includes(warning.severity)
      );

      // Determine confidence based on available information if not set by AI
      if (confidence === 'medium') {
        if (workflow.book_description && workflow.book_categories) {
          confidence = 'high';
        } else if (workflow.book_description || workflow.book_categories) {
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
