import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { fetchBookByISBN } from '@/lib/book-api'
import { validateISBN, normalizeISBN } from '@/lib/isbn-validation'
import { executeAgentChain } from '@/lib/agent-chain'

export async function POST(request: NextRequest) {
  try {
    console.log('Scan ISBN Agent Chain API called')
    
    const { isbn, notes } = await request.json()
    console.log('Processing ISBN:', isbn)

    if (!isbn) {
      return NextResponse.json({ error: 'ISBN is required' }, { status: 400 })
    }

    // Validate ISBN format
    if (!validateISBN(isbn)) {
      console.log('Invalid ISBN format:', isbn)
      return NextResponse.json({ 
        error: 'Invalid ISBN format. Please enter a valid 10 or 13 digit ISBN.' 
      }, { status: 400 })
    }

    // Clean ISBN (remove hyphens, spaces)
    const cleanIsbn = normalizeISBN(isbn)

    // Check if book already exists
    console.log('Checking for existing book with ISBN:', cleanIsbn)
    const { data: existingBook, error: fetchError } = await supabaseAdmin
      .from('books')
      .select('*')
      .eq('isbn', cleanIsbn)
      .single()

    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('Error fetching existing book:', JSON.stringify(fetchError, null, 2))
      throw fetchError
    }
    
    console.log('Existing book found:', !!existingBook)

    let bookId: string
    let isNewBook = false

    if (existingBook) {
      // Book exists, use existing ID
      console.log('Using existing book ID:', existingBook.id)
      bookId = existingBook.id
    } else {
      // Book doesn't exist, try external APIs first
      console.log('Fetching book metadata for ISBN:', cleanIsbn)
      const bookData = await fetchBookByISBN(cleanIsbn)

      if (bookData) {
        // External API found the book, create record
        console.log('Creating new book record with metadata:', bookData.title)
        const { data: newBook, error: insertError } = await supabaseAdmin
          .from('books')
          .insert({
            isbn: bookData.isbn,
            title: bookData.title,
            author: bookData.author,
            cover_url: bookData.cover_url,
            description: bookData.description,
            publisher: bookData.publisher,
            published_date: bookData.published_date,
            page_count: bookData.page_count,
            categories: bookData.categories
          })
          .select()
          .single()

        if (insertError) {
          console.error('Error creating new book:', JSON.stringify(insertError, null, 2))
          throw insertError
        }

        console.log('New book created with ID:', newBook.id)
        bookId = newBook.id
        isNewBook = true
      } else {
        // External APIs failed, use Agent Chain
        console.log('External APIs failed, using Agent Chain...')
        const agentResult = await executeAgentChain(cleanIsbn)

        if (agentResult.bookInfo.book_found) {
          // Agent found the book, create record
          console.log('Creating new book record with AI-found metadata:', agentResult.bookInfo.book_title)
          const { data: newBook, error: insertError } = await supabaseAdmin
            .from('books')
            .insert({
              isbn: cleanIsbn,
              title: agentResult.bookInfo.book_title,
              author: agentResult.bookInfo.book_author,
              cover_url: agentResult.bookInfo.book_cover_url,
              description: agentResult.bookInfo.book_description,
              publisher: null,
              published_date: null,
              page_count: null,
              categories: agentResult.bookInfo.book_categories
            })
            .select()
            .single()

          if (insertError) {
            console.error('Error creating AI-found book:', JSON.stringify(insertError, null, 2))
            throw insertError
          }

          console.log('AI-found book created with ID:', newBook.id)
          bookId = newBook.id
          isNewBook = true
        } else {
          // Agent couldn't find book, create minimal record
          console.log('Agent couldn\'t find book, creating minimal record...')
          const { data: newBook, error: insertError } = await supabaseAdmin
            .from('books')
            .insert({
              isbn: cleanIsbn,
              title: `Unknown Book (ISBN: ${cleanIsbn})`,
              author: 'Unknown Author',
              cover_url: null,
              description: null,
              publisher: null,
              published_date: null,
              page_count: null,
              categories: null
            })
            .select()
            .single()

          if (insertError) {
            console.error('Error creating minimal book record:', JSON.stringify(insertError, null, 2))
            throw insertError
          }

          console.log('Minimal book record created with ID:', newBook.id)
          bookId = newBook.id
          isNewBook = true
        }
      }
    }

    // Check if book has content warnings, and generate them if missing
    let contentWarningsGenerated = false
    try {
      console.log('🔍 Checking for existing content warnings for book ID:', bookId)
      const { data: existingWarnings } = await supabaseAdmin
        .from('content_warnings')
        .select('id')
        .eq('book_id', bookId)

      console.log('📊 Existing warnings count:', existingWarnings?.length || 0)
      if (!existingWarnings || existingWarnings.length === 0) {
        console.log('🤖 No content warnings found, generating with Agent Chain...')
        
        // Get book data for content warning generation
        const bookData = existingBook || await supabaseAdmin
          .from('books')
          .select('*')
          .eq('id', bookId)
          .single()
          .then(result => result.data)

        if (bookData) {
          // Use Agent Chain to generate content warnings
          const agentResult = await executeAgentChain(cleanIsbn)
          
          if (agentResult.contentWarnings.content_warnings.length > 0) {
            // Insert the generated warnings
            const warningsToInsert = agentResult.contentWarnings.content_warnings.map(warning => ({
              book_id: bookId,
              category: warning.category,
              description: warning.description,
              severity: warning.severity,
              user_id: null
            }))

            const { error: insertError } = await supabaseAdmin
              .from('content_warnings')
              .insert(warningsToInsert)

            if (!insertError) {
              contentWarningsGenerated = true
              console.log(`Generated ${agentResult.contentWarnings.content_warnings.length} content warnings via Agent Chain`)
            } else {
              console.error('Failed to insert Agent Chain warnings:', insertError)
            }
          } else {
            console.log('Agent Chain generated no content warnings')
          }
        }
      }
    } catch (warningError) {
      console.error('Error generating content warnings:', warningError)
      // Don't fail the scan if warning generation fails
    }

    // Record the scan (temporarily disabled - scans table doesn't exist)
    console.log('Skipping scan recording - scans table not available')
    const scan = { id: 'temp-scan-id', isbn: cleanIsbn, book_id: bookId }

    return NextResponse.json({
      success: true,
      book: existingBook || { id: bookId, isbn: cleanIsbn, review_status: 'pending' },
      scan: scan,
      isNewBook,
      contentWarningsGenerated,
      agentChainUsed: !existingBook && !await fetchBookByISBN(cleanIsbn)
    })

  } catch (error) {
    console.error('Scan ISBN Agent Chain error:', JSON.stringify(error, null, 2))
    return NextResponse.json({
      error: 'Failed to process ISBN scan',
      details: error instanceof Error ? error.message : 'Unknown error',
      debug: process.env.NODE_ENV === 'development' ? error : undefined
    }, { status: 500 })
  }
}
