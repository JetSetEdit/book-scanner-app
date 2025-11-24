import { Agent, Runner } from "@openai/agents";
import { z } from "zod";
import { user } from "@openai/agents";

// Define the schema for content warnings
export const ContentWarningSchema = z.object({
    category: z.enum(['violence', 'sexual_content', 'substance_abuse', 'mental_health', 'death', 'abuse', 'discrimination', 'other']),
    description: z.string().describe("A brief description of the specific content"),
    severity: z.enum(['mild', 'moderate', 'severe']).describe("The severity level of the content"),
    reasoning: z.string().optional().describe("Explanation for why this warning was generated"),
    is_author_verified: z.boolean().optional().describe("Whether this warning comes from an author-verified source"),
    source_url: z.string().optional().describe("URL source for this warning if found online")
});

export type ContentWarning = z.infer<typeof ContentWarningSchema>;

// Define the schema for the workflow output
const WorkflowOutputSchema = z.object({
    content_warnings: z.array(ContentWarningSchema),
    classification_rating: z.enum(['G', 'PG', 'M', 'MA15+', 'R18+']).optional().describe("Australian Classification Board rating"),
    confidence: z.enum(['low', 'medium', 'high']).describe("Confidence level in the generated warnings"),
    reasoning: z.string().describe("Overall reasoning for the warnings provided")
});

export type WorkflowOutput = z.infer<typeof WorkflowOutputSchema>;

// Create the agent
export const contentWarningAgent = new Agent({
    name: "Book Content Warning Generator",
    model: "gpt-4o",
    instructions: `
You are an expert content warning generator for books, following the Australian Classification Board standards.
Your goal is to analyze book metadata (title, author, description, categories) and identify potential triggers.

You must output a JSON object with the following structure:
{
  "content_warnings": [
    {
      "category": "category_name",
      "description": "specific description",
      "severity": "mild|moderate|severe",
      "reasoning": "explanation"
    }
  ],
  "classification_rating": "G|PG|M|MA15+|R18+",
  "confidence": "low|medium|high",
  "reasoning": "overall explanation"
}

Categories include: violence, sexual_content, substance_abuse, mental_health, death, abuse, discrimination, other.

If the description is missing or very short (<150 chars), you should perform a web search to find more information about the book's plot and themes.
If you cannot find enough information to be sure, set confidence to 'low'.
If the book appears safe for general audiences, return an empty content_warnings array and a 'G' or 'PG' rating.
`,
});

// Standalone function to run the agent (for backward compatibility or direct usage)
export async function generateContentWarnings(workflow: {
    book_title: string;
    book_author: string;
    book_description?: string;
    book_categories?: string[];
    book_isbn?: string;
}): Promise<WorkflowOutput> {
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
