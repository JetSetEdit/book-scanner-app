import { Agent, Runner, user, tool } from "@openai/agents";
import { trainingExamples, themePatterns, categoryGuidelines } from './training-examples';

// Configure OpenAI API key
if (!process.env.OPENAI_API_KEY) {
  throw new Error('OPENAI_API_KEY environment variable is required');
}

// Web search tool for both agents
const webSearchTool = tool({
  name: "web_search",
  description: "Search the web for information about books, including reviews, content warnings, and plot details",
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

// ============================================================================
// AGENT A: Book Info Finder
// ============================================================================
const bookInfoFinderAgent = new Agent({
  name: "Book Information Finder",
  instructions: `You are a specialized AI assistant that finds book information from ISBNs using web search.

## Your Task:
When given an ISBN, use web search to find:
- Book title
- Author name  
- Description/summary
- Categories/genres
- Cover image URL (if available)

## Guidelines:
1. **Be thorough** - Search multiple variations of the ISBN and book information
2. **Be accurate** - Verify information from multiple sources when possible
3. **Be comprehensive** - Include as much metadata as you can find
4. **Use web search extensively** - Search for "ISBN [isbn] book title author" or "[isbn] book information"

## Web Search Strategy:
- Search "ISBN [isbn] book title author" 
- Search "[isbn] book information"
- Search for reviews, Goodreads pages, or book databases
- If no book information is found via web search, return book_found: false

## Response Format:
Return a JSON object:
{
  "book_found": true/false,
  "book_title": "Book Title",
  "book_author": "Author Name", 
  "book_description": "Book description...",
  "book_categories": ["genre1", "genre2"],
  "book_cover_url": "https://...",
  "confidence": "high/medium/low",
  "reasoning": "How you found the information"
}

If no book information is found, return:
{
  "book_found": false,
  "confidence": "low",
  "reasoning": "Book not found via web search"
}`,
  model: "gpt-4o",
  modelSettings: {
    store: true
  },
  tools: [webSearchTool]
});

// ============================================================================
// AGENT B: Content Warning Generator  
// ============================================================================
const contentWarningGeneratorAgent = new Agent({
  name: "Content Warning Generator",
  instructions: `You are a specialized AI assistant that generates content warnings for books based on their metadata and additional research.

## Your Task:
Analyze book information and generate appropriate content warnings with:
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
- Search "[book title] [author] content warnings" or "[book title] plot summary"
- Search for reviews, Goodreads pages, or book databases
- Look for existing content warnings or trigger warnings from other sources

## Response Format:
Return a JSON array of content warnings:
[
  {
    "category": "violence",
    "description": "Brief description of the violent content",
    "severity": "moderate"
  }
]

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

## Analysis Process:
1. **Identify Themes**: Look for trigger words and match them to theme patterns
2. **Categorize Content**: Use category guidelines to determine appropriate categories
3. **Assess Severity**: Apply severity guidelines based on content intensity and frequency
4. **Generate Warnings**: Create specific, helpful descriptions using the training examples as style guides

If no content warnings are needed, return an empty array: []`,
  model: "gpt-4o",
  modelSettings: {
    store: true
  },
  tools: [webSearchTool]
});

// ============================================================================
// AGENT CHAIN INTERFACE
// ============================================================================

export interface BookInfoResult {
  book_found: boolean;
  book_title?: string;
  book_author?: string;
  book_description?: string;
  book_categories?: string[];
  book_cover_url?: string;
  confidence: 'low' | 'medium' | 'high';
  reasoning: string;
}

export interface ContentWarning {
  category: 'violence' | 'sexual_content' | 'substance_abuse' | 'mental_health' | 'death' | 'abuse' | 'discrimination' | 'other';
  description: string;
  severity: 'mild' | 'moderate' | 'severe';
}

export interface ContentWarningResult {
  content_warnings: ContentWarning[];
  confidence: 'low' | 'medium' | 'high';
  reasoning: string;
}

export interface AgentChainResult {
  bookInfo: BookInfoResult;
  contentWarnings: ContentWarningResult;
}

// ============================================================================
// AGENT CHAIN EXECUTION
// ============================================================================

/**
 * Execute the complete agent chain: Book Info Finder → Content Warning Generator
 */
export async function executeAgentChain(isbn: string): Promise<AgentChainResult> {
  console.log(`[Agent Chain] Starting chain execution for ISBN: ${isbn}`);
  
  // Step 1: Book Info Finder
  console.log(`[Agent Chain] Step 1: Finding book information...`);
  const bookInfo = await findBookInfo(isbn);
  
  // Step 2: Content Warning Generator (only if book was found)
  let contentWarnings: ContentWarningResult = {
    content_warnings: [],
    confidence: 'low',
    reasoning: 'No book information available for analysis'
  };
  
  if (bookInfo.book_found) {
    console.log(`[Agent Chain] Step 2: Generating content warnings...`);
    contentWarnings = await generateContentWarnings({
      book_title: bookInfo.book_title!,
      book_author: bookInfo.book_author!,
      book_description: bookInfo.book_description,
      book_categories: bookInfo.book_categories,
      book_isbn: isbn
    });
  } else {
    console.log(`[Agent Chain] Skipping content warnings - book not found`);
  }
  
  console.log(`[Agent Chain] Chain execution complete`);
  
  return {
    bookInfo,
    contentWarnings
  };
}

/**
 * Agent A: Find book information from ISBN
 */
export async function findBookInfo(isbn: string): Promise<BookInfoResult> {
  const inputText = `Find information about the book with ISBN: ${isbn}`;
  
  const conversationHistory = [
    user(inputText)
  ];
  
  const runner = new Runner({
    traceMetadata: {
      __trace_source__: "book-info-finder"
    }
  });
  
  try {
    const agentResult = await runner.run(
      bookInfoFinderAgent,
      conversationHistory
    );
    
    if (!agentResult.finalOutput) {
      throw new Error("Agent result is undefined");
    }
    
    const responseText = agentResult.finalOutput;
    
    try {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const result = JSON.parse(jsonMatch[0]);
        return {
          book_found: result.book_found || false,
          book_title: result.book_title,
          book_author: result.book_author,
          book_description: result.book_description,
          book_categories: result.book_categories,
          book_cover_url: result.book_cover_url,
          confidence: result.confidence || 'medium',
          reasoning: result.reasoning || "AI-found book information"
        };
      }
    } catch (parseError) {
      console.error("Failed to parse book info response:", parseError);
    }
    
    return {
      book_found: false,
      confidence: 'low',
      reasoning: "Failed to parse AI response"
    };
    
  } catch (error) {
    console.error("Book info finder failed:", error);
    return {
      book_found: false,
      confidence: 'low',
      reasoning: `Error during book search: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}

/**
 * Agent B: Generate content warnings from book metadata
 */
export async function generateContentWarnings(workflow: {
  book_title: string;
  book_author: string;
  book_description?: string;
  book_categories?: string[];
  book_isbn?: string;
}): Promise<ContentWarningResult> {
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
      __trace_source__: "content-warning-generator"
    }
  });
  
  try {
    const agentResult = await runner.run(
      contentWarningGeneratorAgent,
      conversationHistory
    );
    
    if (!agentResult.finalOutput) {
      throw new Error("Agent result is undefined");
    }
    
    const responseText = agentResult.finalOutput;
    
    let contentWarnings: ContentWarning[] = [];
    let confidence: 'low' | 'medium' | 'high' = 'medium';
    let reasoning = "AI-generated content warnings based on book metadata";
    
    try {
      const jsonMatch = responseText.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        contentWarnings = JSON.parse(jsonMatch[0]);
        
        // Validate the warnings
        contentWarnings = contentWarnings.filter(warning => 
          warning.category && 
          warning.description && 
          warning.severity &&
          ['violence', 'sexual_content', 'substance_abuse', 'mental_health', 'death', 'abuse', 'discrimination', 'other'].includes(warning.category) &&
          ['mild', 'moderate', 'severe'].includes(warning.severity)
        );
        
        // Determine confidence based on available information
        if (workflow.book_description && workflow.book_categories) {
          confidence = 'high';
        } else if (workflow.book_description || workflow.book_categories) {
          confidence = 'medium';
        } else {
          confidence = 'low';
        }
      }
    } catch (parseError) {
      console.error("Failed to parse content warning response:", parseError);
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
}

// ============================================================================
// BACKWARD COMPATIBILITY
// ============================================================================

/**
 * Legacy function for backward compatibility with existing code
 * This maintains the same interface as the original content-warning-agent.ts
 */
export async function findBookAndGenerateWarnings(isbn: string): Promise<{
  book_found: boolean;
  book_title?: string;
  book_author?: string;
  book_description?: string;
  book_categories?: string[];
  book_cover_url?: string;
  content_warnings: ContentWarning[];
  confidence: 'low' | 'medium' | 'high';
  reasoning: string;
}> {
  const result = await executeAgentChain(isbn);
  
  return {
    book_found: result.bookInfo.book_found,
    book_title: result.bookInfo.book_title,
    book_author: result.bookInfo.book_author,
    book_description: result.bookInfo.book_description,
    book_categories: result.bookInfo.book_categories,
    book_cover_url: result.bookInfo.book_cover_url,
    content_warnings: result.contentWarnings.content_warnings,
    confidence: result.contentWarnings.confidence,
    reasoning: `${result.bookInfo.reasoning} | ${result.contentWarnings.reasoning}`
  };
}
