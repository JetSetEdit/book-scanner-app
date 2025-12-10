/**
 * Voice Agent Service
 * 
 * Handles conversational queries about books and content warnings.
 * Designed to work with speech-to-text input and text-to-speech output.
 * Uses AI to generate intelligent, conversational responses.
 */

import { supabaseAdmin } from '@/lib/supabase/admin'
import { generateContentBriefing } from '@/lib/utils/content-briefing'

// Use the same approach as content-warning-agent.ts
// The @openai/agents library handles API keys automatically
// For direct OpenAI calls, we'll use the same environment variable
// that @openai/agents uses (it checks OPENAI_API_KEY automatically)
// Note: The key might be provided by Cursor's environment or Vercel

// Lazy load OpenAI to avoid import errors if not configured
function getOpenAI() {
  // Check if API key is available (same way @openai/agents does)
  // It might be in process.env from Cursor/Vercel environment
  const apiKey = process.env.OPENAI_API_KEY
  
  if (!apiKey) {
    console.log('OpenAI API key not found in environment')
    return null
  }
  
  try {
    const OpenAI = require('openai').default
    return new OpenAI({
      apiKey: apiKey,
    })
  } catch (error) {
    console.warn('OpenAI not available:', error)
    return null
  }
}

export interface VoiceAgentContext {
  isbn?: string
  bookId?: string
  conversationHistory?: Array<{ role: 'user' | 'assistant'; content: string }>
}

export interface VoiceAgentResponse {
  text: string
  shouldContinue: boolean // Whether to keep listening for follow-up
  suggestedQuestions?: string[] // Optional follow-up questions
}

/**
 * Processes a voice/text query about a book
 */
export async function processVoiceQuery(
  query: string,
  context: VoiceAgentContext
): Promise<VoiceAgentResponse> {
  const normalizedQuery = query.toLowerCase().trim()

  // Extract ISBN if mentioned in query
  const isbnMatch = query.match(/\b\d{10,13}\b/)
  const isbn = isbnMatch ? isbnMatch[0] : context.isbn

  if (!isbn && !context.bookId) {
    return {
      text: "I'd be happy to help! Please provide an ISBN or scan a book first.",
      shouldContinue: true,
      suggestedQuestions: [
        "Scan a book to get started",
        "Tell me about a book by ISBN"
      ]
    }
  }

  // Fetch book data
  let book
  let warnings

  try {
    if (isbn) {
      const { data: bookData, error: bookError } = await supabaseAdmin
        .from('books')
        .select('*')
        .eq('isbn', isbn)
        .single()

      if (bookError || !bookData) {
        return {
          text: `I couldn't find a book with ISBN ${isbn}. Please scan the book first.`,
          shouldContinue: true
        }
      }

      book = bookData

      const { data: warningsData } = await supabaseAdmin
        .from('content_warnings')
        .select('*')
        .eq('book_id', book.id)
        .order('severity', { ascending: false })

      warnings = warningsData || []
    } else if (context.bookId) {
      const { data: bookData, error: bookError } = await supabaseAdmin
        .from('books')
        .select('*')
        .eq('id', context.bookId)
        .single()

      if (bookError || !bookData) {
        return {
          text: "I couldn't find that book. Please scan it again.",
          shouldContinue: true
        }
      }

      book = bookData

      const { data: warningsData } = await supabaseAdmin
        .from('content_warnings')
        .select('*')
        .eq('book_id', book.id)
        .order('severity', { ascending: false })

      warnings = warningsData || []
    }

    if (!book) {
      return {
        text: "I couldn't find that book. Please scan it first.",
        shouldContinue: true
      }
    }

    // Use AI to generate intelligent, conversational responses
    const openaiClient = getOpenAI()
    console.log('🤖 OpenAI client available:', !!openaiClient)
    if (openaiClient) {
      console.log('🤖 Attempting AI-powered response for query:', query.substring(0, 50))
      try {
        const aiResponse = await generateAIResponse(query, book, warnings || [], context.conversationHistory || [], openaiClient)
        console.log('✅ AI response generated:', aiResponse.text.substring(0, 100))
        return aiResponse
      } catch (error: any) {
        console.error('❌ AI response failed, falling back to keyword matching:', error)
        // Fall through to keyword-based responses
      }
    } else {
      console.log('⚠️ OpenAI not available, using keyword-based responses')
    }

    // Fallback to keyword-based responses if OpenAI is not available
    // Process different types of queries
    // Check for severe warnings FIRST (before general warnings) since "severe warnings" contains "warning"
    if (normalizedQuery.includes('severe') || normalizedQuery.includes('serious')) {
      return handleSevereWarningsQuery(book, warnings || [])
    }

    if (normalizedQuery.includes('warning') || normalizedQuery.includes('content')) {
      return handleWarningsQuery(book, warnings || [])
    }

    if (normalizedQuery.includes('summary') || normalizedQuery.includes('about') || normalizedQuery.includes('tell me')) {
      return handleSummaryQuery(book, warnings || [])
    }

    if (normalizedQuery.includes('rating') || normalizedQuery.includes('classification')) {
      return handleRatingQuery(book)
    }

    if (normalizedQuery.includes('author')) {
      return handleAuthorQuery(book)
    }

    if (normalizedQuery.includes('category') || normalizedQuery.includes('genre')) {
      return handleCategoryQuery(book)
    }

    // Default: provide a helpful overview
    return handleDefaultQuery(book, warnings || [])

  } catch (error: any) {
    console.error('Voice agent error:', error)
    return {
      text: "I'm sorry, I encountered an error. Please try again.",
      shouldContinue: true
    }
  }
}

function handleWarningsQuery(book: any, warnings: any[]): VoiceAgentResponse {
  if (warnings.length === 0) {
    return {
      text: `${book.title} contains no significant content warnings.`,
      shouldContinue: true,
      suggestedQuestions: [
        "Tell me about the book",
        "What's the classification rating?"
      ]
    }
  }

  const severeCount = warnings.filter(w => w.severity === 'severe').length
  const moderateCount = warnings.filter(w => w.severity === 'moderate').length
  const mildCount = warnings.filter(w => w.severity === 'mild').length

  const categories = new Set(warnings.map(w => w.category))
  const categoryList = Array.from(categories).slice(0, 5).join(', ')

  let response = `${book.title} has ${warnings.length} content warning${warnings.length > 1 ? 's' : ''}. `
  
  if (severeCount > 0) {
    response += `There ${severeCount === 1 ? 'is' : 'are'} ${severeCount} severe warning${severeCount > 1 ? 's' : ''}. `
  }
  if (moderateCount > 0) {
    response += `${moderateCount} moderate warning${moderateCount > 1 ? 's' : ''}. `
  }
  if (mildCount > 0) {
    response += `${mildCount} mild warning${mildCount > 1 ? 's' : ''}. `
  }

  response += `Categories include ${categoryList}.`

  return {
    text: response,
    shouldContinue: true,
    suggestedQuestions: [
      "What are the severe warnings?",
      "Tell me more about the content"
    ]
  }
}

function handleSevereWarningsQuery(book: any, warnings: any[]): VoiceAgentResponse {
  const severeWarnings = warnings.filter(w => w.severity === 'severe')

  if (severeWarnings.length === 0) {
    return {
      text: `${book.title} has no severe content warnings.`,
      shouldContinue: true,
      suggestedQuestions: [
        "What are all the warnings?",
        "Tell me about the book"
      ]
    }
  }

  const categories = severeWarnings.map(w => w.category).join(', ')
  let response = `${book.title} has ${severeWarnings.length} severe warning${severeWarnings.length > 1 ? 's' : ''}: ${categories}.`

  return {
    text: response,
    shouldContinue: true,
    suggestedQuestions: [
      "What are all the warnings?",
      "Tell me about moderate warnings"
    ]
  }
}

function handleSummaryQuery(book: any, warnings: any[]): VoiceAgentResponse {
  const briefing = generateContentBriefing(book, warnings)
  
  return {
    text: briefing,
    shouldContinue: true,
    suggestedQuestions: [
      "What are the content warnings?",
      "What's the classification rating?"
    ]
  }
}

function handleRatingQuery(book: any): VoiceAgentResponse {
  if (!book.classification_rating) {
    return {
      text: `I don't have a classification rating for ${book.title}.`,
      shouldContinue: true
    }
  }

  return {
    text: `${book.title} has a classification rating of ${book.classification_rating}.`,
    shouldContinue: true,
    suggestedQuestions: [
      "What are the content warnings?",
      "Tell me about the book"
    ]
  }
}

function handleAuthorQuery(book: any): VoiceAgentResponse {
  if (!book.author) {
    return {
      text: `I don't have author information for ${book.title}.`,
      shouldContinue: true
    }
  }

  return {
    text: `${book.title} is by ${book.author}.`,
    shouldContinue: true,
    suggestedQuestions: [
      "What are the content warnings?",
      "Tell me about the book"
    ]
  }
}

function handleCategoryQuery(book: any): VoiceAgentResponse {
  if (!book.categories || book.categories.length === 0) {
    return {
      text: `I don't have category information for ${book.title}.`,
      shouldContinue: true
    }
  }

  const categories = Array.isArray(book.categories) 
    ? book.categories.join(', ')
    : book.categories

  return {
    text: `${book.title} is categorized as ${categories}.`,
    shouldContinue: true,
    suggestedQuestions: [
      "What are the content warnings?",
      "Tell me about the book"
    ]
  }
}

function handleDefaultQuery(book: any, warnings: any[]): VoiceAgentResponse {
  const briefing = generateContentBriefing(book, warnings)
  
  return {
    text: briefing,
    shouldContinue: true,
    suggestedQuestions: [
      "What are the content warnings?",
      "What are the severe warnings?",
      "What's the classification rating?"
    ]
  }
}

/**
 * Generate AI-powered conversational response using GPT-4o-mini
 */
async function generateAIResponse(
  query: string,
  book: any,
  warnings: any[],
  conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }>,
  openaiClient: any
): Promise<VoiceAgentResponse> {
  if (!openaiClient) {
    // Fallback if OpenAI is not configured
    console.log('OpenAI not configured, using fallback')
    return handleDefaultQuery(book, warnings)
  }

  try {
    console.log('🤖 [AI] Generating AI response for query:', query.substring(0, 50))
    console.log('🤖 [AI] Book:', book.title)
    console.log('🤖 [AI] Warnings count:', warnings.length)
    console.log('🤖 [AI] Conversation history length:', conversationHistory.length)
    // Format warnings for context
    const warningsContext = warnings.map(w => ({
      category: w.category,
      severity: w.severity,
      description: w.description || '',
      isAuthorApproved: w.is_author_approved || false
    }))

    // Build conversation context
    const systemPrompt = `You are a helpful, conversational voice assistant for a book content warning platform called Subtext. 
You help users understand books and their content warnings in a natural, friendly way.

Your responses should be:
- Conversational and natural (as if speaking to a friend)
- Concise but informative (suitable for text-to-speech, aim for 2-4 sentences)
- Accurate based on the book data provided
- Helpful and engaging

You have access to:
- Book information: title, author, description, categories, classification rating
- Content warnings: category, severity (severe/moderate/mild), descriptions
- Conversation history for context

Answer questions naturally and conversationally. If asked about something you don't have information about, say so honestly.`

    const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
      {
        role: 'system',
        content: systemPrompt
      },
      ...conversationHistory.slice(-4).map(msg => ({
        role: msg.role === 'user' ? 'user' : 'assistant',
        content: msg.content
      })) as OpenAI.Chat.Completions.ChatCompletionMessageParam[],
      {
        role: 'user',
        content: `Book Information:
Title: ${book.title || 'Unknown'}
Author: ${book.author || 'Unknown'}
Description: ${book.description || 'No description available'}
Categories: ${Array.isArray(book.categories) ? book.categories.join(', ') : book.categories || 'None'}
Classification Rating: ${book.classification_rating || 'Not rated'}

Content Warnings (${warnings.length} total):
${warningsContext.length > 0 
  ? warningsContext.map(w => `- ${w.severity.toUpperCase()}: ${w.category}${w.description ? ` - ${w.description}` : ''}`).join('\n')
  : 'No content warnings recorded.'}

User Question: ${query}

Please provide a natural, conversational response to the user's question.`
      }
    ]

    const completion = await openaiClient.chat.completions.create({
      model: 'gpt-4o-mini', // Using mini for faster, cheaper responses
      messages,
      temperature: 0.7,
      max_tokens: 200, // Keep responses concise for TTS
    })

    const responseText = completion.choices[0]?.message?.content || "I'm sorry, I couldn't generate a response."

    // Generate suggested follow-up questions
    const suggestedQuestions = generateSuggestedQuestions(book, warnings, query)

    return {
      text: responseText,
      shouldContinue: true,
      suggestedQuestions
    }

  } catch (error: any) {
    console.error('AI response generation error:', error)
    // Fallback to keyword-based response
    return handleDefaultQuery(book, warnings)
  }
}

/**
 * Generate contextual suggested questions based on the book and current query
 */
function generateSuggestedQuestions(book: any, warnings: any[], currentQuery: string): string[] {
  const suggestions: string[] = []
  const queryLower = currentQuery.toLowerCase()

  // Don't suggest what they just asked
  if (!queryLower.includes('warning')) {
    if (warnings.length > 0) {
      suggestions.push("What are the content warnings?")
    }
  }

  if (!queryLower.includes('severe') && warnings.some(w => w.severity === 'severe')) {
    suggestions.push("What are the severe warnings?")
  }

  if (!queryLower.includes('summary') && !queryLower.includes('about') && !queryLower.includes('tell me')) {
    suggestions.push("Tell me about this book")
  }

  if (!queryLower.includes('rating') && !queryLower.includes('classification') && book.classification_rating) {
    suggestions.push("What's the classification rating?")
  }

  // Ensure we have at least 2 suggestions
  if (suggestions.length < 2) {
    if (!suggestions.includes("Tell me about this book")) {
      suggestions.push("Tell me about this book")
    }
    if (warnings.length > 0 && !suggestions.includes("What are the content warnings?")) {
      suggestions.push("What are the content warnings?")
    }
  }

  return suggestions.slice(0, 3) // Max 3 suggestions
}

