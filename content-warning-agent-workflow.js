import { Agent, Runner, user } from "@openai/agents";

const contentWarningAgent = new Agent({
  name: "Content Warning Generator",
  instructions: `You are a specialized AI assistant that generates content warnings for books. Your job is to analyze book information and provide appropriate content warnings that help readers make informed decisions.

## Your Task:
Analyze the provided book information and generate content warnings with:
- Category (violence, sexual_content, substance_abuse, mental_health, death, abuse, discrimination, other)
- Description (brief, helpful description of the content)
- Severity (mild, moderate, severe)

## Guidelines:
1. **Be accurate and helpful** - Only include warnings for content that actually exists
2. **Be specific** - Provide clear, concise descriptions
3. **Be appropriate** - Consider the target audience and book genre
4. **Be comprehensive** - Don't miss important warnings, but don't over-warn
5. **Use proper categories** - Stick to the predefined categories
6. **Assess severity carefully** - Consider impact and frequency

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

If no content warnings are needed, return an empty array: []`,
  model: "gpt-4o",
  modelSettings: {
    store: true
  }
});

type WorkflowInput = { 
  book_title: string;
  book_author: string;
  book_description?: string;
  book_categories?: string[];
  book_isbn?: string;
};

// Main workflow entrypoint
export const runWorkflow = async (workflow: WorkflowInput) => {
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

  const agentResult = await runner.run(
    contentWarningAgent,
    conversationHistory
  );

  if (!agentResult.finalOutput) {
    throw new Error("Agent result is undefined");
  }

  const responseText = agentResult.finalOutput;
  
  // Try to extract JSON from the response
  let contentWarnings = [];
  let confidence = 'medium';
  let reasoning = "AI-generated content warnings based on book metadata";

  try {
    // Look for JSON in the response
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
    console.error("Failed to parse agent response:", parseError);
    confidence = 'low';
    reasoning = "Failed to parse AI response, no warnings generated";
  }

  return {
    content_warnings: contentWarnings,
    confidence,
    reasoning
  };
};

