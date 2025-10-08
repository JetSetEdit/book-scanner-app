import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { fetchBookByISBN } from '@/lib/book-api'
import { validateISBNWithChecksum, normalizeISBN } from '@/lib/isbn-validation'

export async function POST(request: NextRequest) {
  try {
    console.log('Scan ISBN API called')
    
    const { isbn, notes } = await request.json()
    console.log('Processing ISBN:', isbn)

    if (!isbn) {
      return NextResponse.json({ error: 'ISBN is required' }, { status: 400 })
    }

    // Validate ISBN format and checksum
    if (!validateISBNWithChecksum(isbn)) {
      console.log('Invalid ISBN format or checksum:', isbn)
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
        console.log('Book not found in external APIs')
        return NextResponse.json({
          error: 'Book not found. Please check the ISBN and try again.'
        }, { status: 404 })
      }

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

    // Record the scan (temporarily disabled - scans table doesn't exist)
    console.log('Skipping scan recording - scans table not available')
    const scan = { id: 'temp-scan-id', isbn: cleanIsbn, book_id: bookId }

    return NextResponse.json({
      success: true,
      book: existingBook || { id: bookId, isbn: cleanIsbn, review_status: 'pending' },
      scan: scan,
      isNewBook: !existingBook
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


