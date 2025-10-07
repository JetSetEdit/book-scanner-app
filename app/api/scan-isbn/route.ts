import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase environment variables')
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

export async function POST(request: NextRequest) {
  try {
    const { isbn, notes } = await request.json()

    if (!isbn) {
      return NextResponse.json({ error: 'ISBN is required' }, { status: 400 })
    }

    // Clean ISBN (remove hyphens, spaces)
    const cleanIsbn = isbn.replace(/[-\s]/g, '')

    // Check if book already exists
    const { data: existingBook, error: fetchError } = await supabase
      .from('books')
      .select('*')
      .eq('isbn', cleanIsbn)
      .single()

    if (fetchError && fetchError.code !== 'PGRST116') {
      throw fetchError
    }

    let bookId: string

    if (existingBook) {
      // Book exists, just record the scan
      bookId = existingBook.id
    } else {
      // Book doesn't exist, create placeholder record
      const { data: newBook, error: insertError } = await supabase
        .from('books')
        .insert({
          isbn: cleanIsbn,
          title: `Unknown Book (ISBN: ${cleanIsbn})`,
          author: 'Unknown Author',
          review_status: 'pending',
          scan_source: 'app',
          in_db: false
        })
        .select()
        .single()

      if (insertError) {
        throw insertError
      }

      bookId = newBook.id
    }

    // Record the scan
    const { data: scan, error: scanError } = await supabase
      .from('scans')
      .insert({
        isbn: cleanIsbn,
        book_id: bookId,
        notes: notes || null
      })
      .select()
      .single()

    if (scanError) {
      throw scanError
    }

    return NextResponse.json({
      success: true,
      book: existingBook || { id: bookId, isbn: cleanIsbn, review_status: 'pending' },
      scan: scan,
      isNewBook: !existingBook
    })

  } catch (error) {
    console.error('Scan ISBN error:', error)
    return NextResponse.json({
      error: 'Failed to process ISBN scan',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}


