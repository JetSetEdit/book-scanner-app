import { NextRequest, NextResponse } from 'next/server'
import { validateISBN } from '@/lib/isbn-validation'
import { fetchCandidatesByISBN } from '@/lib/book-api'
import { runMultiModelAnalysis } from '@/lib/services/multi-model-service'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { normalizeISBN } from '@/lib/isbn-validation'
import { getCategoryById, requiresMediation } from '@/lib/config/taxonomy-v2'

/**
 * Multi-Model Scan Endpoint
 * Runs both GPT-4o and Gemini, combines their results, saves to database, and provides analysis
 */
export async function POST(request: NextRequest) {
  try {
    const { isbn } = await request.json()

    if (!isbn) {
      return NextResponse.json({ error: 'ISBN is required' }, { status: 400 })
    }

    if (!validateISBN(isbn)) {
      return NextResponse.json({
        error: 'Invalid ISBN format. Please enter a valid 10 or 13 digit ISBN.'
      }, { status: 400 })
    }

    const cleanIsbn = normalizeISBN(isbn)

    // Check if book already exists
    const { data: existingBook } = await supabaseAdmin
      .from('books')
      .select('*')
      .eq('isbn', cleanIsbn)
      .single()

    // Fetch book metadata first
    const candidates = await fetchCandidatesByISBN(isbn)
    if (candidates.length === 0) {
      return NextResponse.json({
        error: 'Book not found in external APIs'
      }, { status: 404 })
    }

    const bookData = candidates[0]

    // Run multi-model analysis
    const result = await runMultiModelAnalysis(
      isbn,
      bookData.title,
      bookData.author || 'Unknown',
      bookData.description,
      bookData.categories
    )

    // Save to database
    let bookId: string
    let savedBook: any

    if (existingBook) {
      // Update existing book
      bookId = existingBook.id
      const { data: updatedBook } = await supabaseAdmin
        .from('books')
        .update({
          title: bookData.title,
          author: bookData.author || null,
          description: bookData.description || null,
          cover_url: bookData.cover_url || null,
          categories: result.classification_rating 
            ? [...(bookData.categories || []), `CLASSIFICATION:${result.classification_rating}`]
            : bookData.categories,
          last_synced_at: new Date().toISOString()
        })
        .eq('id', bookId)
        .select()
        .single()
      savedBook = updatedBook || existingBook
    } else {
      // Create new book
      const { data: newBook, error: insertError } = await supabaseAdmin
        .from('books')
        .insert({
          isbn: cleanIsbn,
          title: bookData.title,
          author: bookData.author || null,
          description: bookData.description || null,
          cover_url: bookData.cover_url || null,
          publisher: bookData.publisher || null,
          published_date: bookData.published_date || null,
          page_count: bookData.page_count || null,
          categories: result.classification_rating
            ? [...(bookData.categories || []), `CLASSIFICATION:${result.classification_rating}`]
            : bookData.categories,
          last_synced_at: new Date().toISOString()
        })
        .select()
        .single()

      if (insertError) {
        throw new Error(`Failed to save book: ${insertError.message}`)
      }

      bookId = newBook.id
      savedBook = newBook
    }

    // Delete existing warnings for this book (if any)
    await supabaseAdmin
      .from('content_warnings')
      .delete()
      .eq('book_id', bookId)

    // Save combined warnings to database
    if (result.combined_warnings.length > 0) {
      const warningsToInsert = result.combined_warnings.map((warning: any) => ({
        book_id: bookId,
        category: getCategoryById(warning.category_id)?.legacyCategory || 'other',
        category_id: warning.category_id,
        subcategory_id: warning.subcategory_id || null,
        confidence_score: warning.score || 0,
        description: warning.description,
        severity: warning.severity,
        presence: warning.presence || 'on_page',
        detail_level: warning.detail_level || null,
        is_spoiler: warning.is_spoiler || false,
        requires_mediation: requiresMediation([{
          category_id: warning.category_id,
          severity: warning.severity,
          detail_level: warning.detail_level || null
        }]),
        user_id: null,
        reasoning: warning.reasoning || null,
        is_author_verified: warning.is_author_verified || false,
        source_url: warning.source_url || null
      }))

      const { error: warningsError } = await supabaseAdmin
        .from('content_warnings')
        .insert(warningsToInsert)

      if (warningsError) {
        console.error('Failed to insert warnings:', warningsError)
      }
    }

    // Record scan
    await supabaseAdmin
      .from('scans')
      .insert({
        isbn: cleanIsbn,
        book_id: bookId
      })
      .catch(err => console.warn('Failed to record scan:', err))

    return NextResponse.json({
      success: true,
      book: savedBook,
      isNewBook: !existingBook,
      contentWarningsGenerated: result.combined_warnings.length > 0,
      authorContextInvestigated: false,
      ...result
    })

  } catch (error) {
    console.error('Multi-model scan error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    const errorStack = error instanceof Error ? error.stack : undefined
    const errorName = error instanceof Error ? error.name : 'Error'
    console.error('Error details:', {
      name: errorName,
      message: errorMessage,
      stack: errorStack
    })
    
    // Return more detailed error for debugging
    return NextResponse.json({
      error: 'Failed to process multi-model scan',
      details: errorMessage,
      errorType: errorName,
      ...(process.env.NODE_ENV === 'development' && { stack: errorStack })
    }, { status: 500 })
  }
}

