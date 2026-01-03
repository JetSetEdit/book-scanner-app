import { Agent } from "@openai/agents";
import { z } from "zod";

// Define the schema for book info results
export const BookInfoSchema = z.object({
    book_found: z.boolean().describe("Whether the book was found"),
    book_title: z.string().optional().describe("The full title of the book"),
    book_author: z.string().optional().describe("The author of the book"),
    book_description: z.string().optional().describe("A detailed plot summary and description of the book"),
    book_categories: z.array(z.string()).optional().describe("Genres and categories of the book"),
    book_cover_url: z.string().optional().describe("URL to the book cover if found"),
    confidence: z.enum(['low', 'medium', 'high']).describe("Confidence in the found information"),
    reasoning: z.string().optional().describe("Explanation of what was found")
});

export type BookInfo = z.infer<typeof BookInfoSchema>;

// Create the agent
export const bookInfoFinderAgent = new Agent({
    name: "Book Information Finder",
    model: "gpt-4o",
    instructions: `
You are an expert research assistant dedicated to finding detailed information about books.
Your goal is to find the plot summary, themes, and metadata for a book given its ISBN or title/author.

You must output a JSON object with the following structure:
{
  "book_found": true/false,
  "book_title": "Title",
  "book_author": "Author",
  "book_description": "Detailed plot summary...",
  "book_categories": ["Genre1", "Genre2"],
  "confidence": "low|medium|high",
  "reasoning": "Found matching book..."
}

If you cannot find the book, set book_found to false.
IMPORTANT: For the description, try to find a comprehensive plot summary that reveals themes and potential content warnings, not just the marketing blurb.
`,
});
