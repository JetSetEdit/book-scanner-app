import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { fetchBookByISBN } from '@/lib/book-api'
import { validateISBN, validateISBNWithChecksum, normalizeISBN } from '@/lib/isbn-validation'

export async function POST(request: NextRequest) {
  try {
    console.log('Scan ISBN API called')
    
    const { isbn, notes } = await request.json()
    console.log('Processing ISBN:', isbn)

    if (!isbn) {
      return NextResponse.json({ error: 'ISBN is required' }, { status: 400 })
    }

    // Validate ISBN format and checksum
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

    if (existingBook) {
      // Book exists, just record the scan
      console.log('Using existing book ID:', existingBook.id)
      bookId = existingBook.id
    } else {
      // Book doesn't exist, fetch from external API
      console.log('Fetching book metadata for ISBN:', cleanIsbn)
      const bookData = await fetchBookByISBN(cleanIsbn)

      if (!bookData) {
        console.log('Book not found in external APIs, creating minimal record and asking AI agent...')
        
        // Create a minimal book record with just the ISBN
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
        
        // Try AI agent to find book information via web search
        console.log('Asking AI agent to find book information via web search...')
        try {
          const { findBookAndGenerateWarnings } = await import('@/lib/content-warning-agent')
          
          const result = await findBookAndGenerateWarnings(cleanIsbn)

          if (result.book_found) {
            // Update the book record with AI-found information
            const { error: updateError } = await supabaseAdmin
              .from('books')
              .update({
                title: result.book_title,
                author: result.book_author,
                description: result.book_description,
                categories: result.book_categories,
                cover_url: result.book_cover_url
              })
              .eq('id', bookId)

            if (updateError) {
              console.error('Failed to update book with AI-found data:', updateError)
            } else {
              console.log('Updated book record with AI-found information')
            }

            // Insert the generated warnings
            if (result.content_warnings.length > 0) {
              const warningsToInsert = result.content_warnings.map(warning => ({
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
                console.log(`Generated ${result.content_warnings.length} content warnings via AI web search`)
              } else {
                console.error('Failed to insert AI-generated warnings:', insertError)
              }
            }
          } else {
            console.log('AI agent could not find book information via web search')
          }
        } catch (warningError) {
          console.error('Error with AI agent book search:', warningError)
        }
      } else {

      // Insert book with real metadata
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
        console.log('🤖 No content warnings found, generating with AI agent...')
        
        // Generate content warnings using AI agent
        const { generateContentWarnings } = await import('@/lib/content-warning-agent')
        const bookData = existingBook || await supabaseAdmin
          .from('books')
          .select('*')
          .eq('id', bookId)
          .single()
          .then(result => result.data)

        if (bookData) {
          const result = await generateContentWarnings({
            book_title: bookData.title,
            book_author: bookData.author || 'Unknown',
            book_description: bookData.description,
            book_categories: bookData.categories,
            book_isbn: bookData.isbn
          })

          if (result.content_warnings.length > 0) {
            // Insert the generated warnings
            const warningsToInsert = result.content_warnings.map(warning => ({
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
              console.log(`Generated ${result.content_warnings.length} content warnings`)
            } else {
              console.error('Failed to insert AI-generated warnings:', insertError)
            }
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
      isNewBook: !existingBook,
      contentWarningsGenerated
    })

  } catch (error) {
    console.error('Scan ISBN error:', JSON.stringify(error, null, 2))
    return NextResponse.json({
      error: 'Failed to process ISBN scan',
      details: error instanceof Error ? error.message : 'Unknown error',
      debug: process.env.NODE_ENV === 'development' ? error : undefined
    }, { status: 500 })
  }
}


