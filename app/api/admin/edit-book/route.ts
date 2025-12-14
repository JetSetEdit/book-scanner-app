import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

// Dev-only endpoint to edit a book
export async function PATCH(request: NextRequest) {
  // Check if we're in dev mode
  const isDev = process.env.NODE_ENV === 'development' || 
                request.headers.get('host')?.includes('localhost')

  if (!isDev) {
    return NextResponse.json({ error: 'Not available in production' }, { status: 403 })
  }

  try {
    const { isbn, updates } = await request.json()

    if (!isbn) {
      return NextResponse.json({ error: 'ISBN is required' }, { status: 400 })
    }

    if (!updates || typeof updates !== 'object') {
      return NextResponse.json({ error: 'Updates object is required' }, { status: 400 })
    }

    // Find the book
    const { data: book, error: bookError } = await supabaseAdmin
      .from('books')
      .select('id')
      .eq('isbn', isbn)
      .single()

    if (bookError || !book) {
      return NextResponse.json({ error: 'Book not found' }, { status: 404 })
    }

    // Update the book
    const { data: updatedBook, error: updateError } = await supabaseAdmin
      .from('books')
      .update(updates)
      .eq('id', book.id)
      .select()
      .single()

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      book: updatedBook,
      message: 'Book updated successfully' 
    })
  } catch (error) {
    console.error('Error updating book:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}











