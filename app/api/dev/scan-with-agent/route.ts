import { NextRequest, NextResponse } from 'next/server'
import { findBookAndGenerateWarnings } from '@/lib/content-warning-agent'
import { fetchCandidatesByISBN } from '@/lib/book-api'

// Dev-only endpoint to scan with a specific agent type (doesn't save to DB)
export async function POST(request: NextRequest) {
  // Check if we're in dev mode
  const isDev = process.env.NODE_ENV === 'development' || 
                request.headers.get('host')?.includes('localhost')

  if (!isDev) {
    return NextResponse.json({ error: 'Not available in production' }, { status: 403 })
  }

  try {
    const { isbn, agentType, model } = await request.json()

    if (!isbn) {
      return NextResponse.json({ error: 'ISBN is required' }, { status: 400 })
    }

    if (!['assumption-based', 'evidence-based', 'hybrid'].includes(agentType)) {
      return NextResponse.json({ error: 'agentType must be "assumption-based", "evidence-based", or "hybrid"' }, { status: 400 })
    }

    // Map agent type to instruction mode
    const instructionMode = agentType === 'assumption-based' ? 'old' : agentType === 'evidence-based' ? 'new' : 'hybrid'
    
    // Use provided model or default to gpt-4o
    const selectedModel = model || 'gpt-4o'
    
    // First, get book metadata (but don't save it)
    const candidates = await fetchCandidatesByISBN(isbn)
    const bookData = candidates.length > 0 ? candidates[0] : null

    // Call the agent function directly (doesn't save to DB)
    const result = await findBookAndGenerateWarnings(
      isbn,
      selectedModel,
      instructionMode
    )

    return NextResponse.json({
      success: result.book_found,
      book: bookData ? {
        title: result.book_title || bookData.title,
        author: result.book_author || bookData.author,
        description: result.book_description || bookData.description,
        cover_url: result.book_cover_url || bookData.cover_url,
        categories: result.book_categories || bookData.categories
      } : {
        title: result.book_title || 'Unknown',
        author: result.book_author || 'Unknown',
        description: result.book_description || null,
        cover_url: result.book_cover_url || null,
        categories: result.book_categories || null
      },
      warnings: result.content_warnings || [],
      reasoning: result.reasoning || 'No reasoning available',
      confidence: result.confidence || 'medium'
    })

  } catch (error) {
    console.error('Error in dev scan:', error)
    
    // Check if it's a rate limit error
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    const isRateLimit = errorMessage.includes('rate limit') || errorMessage.includes('429') || errorMessage.includes('TPM')
    
    return NextResponse.json(
      { 
        success: false,
        error: errorMessage,
        isRateLimit
      },
      { status: isRateLimit ? 429 : 500 }
    )
  }
}

