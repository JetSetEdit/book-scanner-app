import OpenAI from 'openai';
import { BookAnnotation, CharacterProfile, TraumaTopic, BookTone } from '@/types/book-annotations';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function extractBookAnnotations(
  book: { title: string; author: string; description: string; isbn: string }
): Promise<Omit<BookAnnotation, 'isbn' | 'title'>> {
  
  const systemPrompt = `You are a literary analyst specializing in tagging books for identity-based recommendation engines.
  
  Your goal is to extract structured metadata about characters, themes, tone, and sensitive topics.
  
  Outputs must be strict JSON matching this schema:
  {
    "mainCharacters": [
      { "name": "string", "role": "protagonist" | "deuteragonist" | "supporting", "identities": ["string", "string"], "outcome": "positive" | "tragic" | "ambiguous" }
    ],
    "themes": ["string"],
    "traumaTopics": ["string" (from valid list below)],
    "tone": ["string" (from valid list below)],
    "identityStruggleScore": number (0-10)
  }
  
  Valid Trauma Topics:
  racism, slavery, police_violence, institutional_oppression, hate_crime, colonial_violence,
  sexual_violence, domestic_abuse, grief, chronic_illness, poverty, war
  
  Valid Tones:
  cozy, uplifting, romantic, humorous, low-conflict, high-stakes, dark, tragic
  
  Instructions:
  1. Characters: List major characters. For "identities", be specific (e.g., "Black", "African American", "White", "Korean", "Queer", "Trans"). inferred identities are okay if strongly implied.
  2. Trauma: Only tag topics that are present. Be strict about "racism" and "police_violence".
  3. Tone: Choose 2-3 tones that best fit.
  4. Identity Struggle Score: 0 = identity is incidental/not a conflict source. 10 = book is entirely about the struggle of that identity (e.g., The Hate U Give). 5 = identity is relevant but not the sole focus.
  `;

  const userPrompt = `Analyze this book:
  Title: ${book.title}
  Author: ${book.author}
  Description: ${book.description}
  `;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o', // Use a smart model for accurate extraction
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3
    });

    const content = response.choices[0].message.content;
    if (!content) throw new Error("No content from LLM");

    const data = JSON.parse(content);

    // Validate/sanitize data here if necessary
    return {
      mainCharacters: data.mainCharacters || [],
      themes: data.themes || [],
      traumaTopics: data.traumaTopics || [],
      tone: data.tone || [],
      identityStruggleScore: data.identityStruggleScore || 0
    };

  } catch (error) {
    console.error("Error extracting book annotations:", error);
    // Return empty fallback
    return {
      mainCharacters: [],
      themes: [],
      traumaTopics: [],
      tone: [],
      identityStruggleScore: 0
    };
  }
}
