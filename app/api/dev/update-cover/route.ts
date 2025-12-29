import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function POST(request: NextRequest) {
  try {
    const { isbn, coverUrl } = await request.json()

    if (!isbn || !coverUrl) {
      return NextResponse.json(
        { error: 'ISBN and coverUrl are required' },
        { status: 400 }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Find the book by ISBN
    const { data: book, error: fetchError } = await supabase
      .from('books')
      .select('id, isbn, title, cover_url')
      .eq('isbn', isbn)
      .single()

    if (fetchError || !book) {
      return NextResponse.json(
        { error: `Book with ISBN ${isbn} not found` },
        { status: 404 }
      )
    }

    // Update the cover URL
    const { data: updatedBook, error: updateError } = await supabase
      .from('books')
      .update({ cover_url: coverUrl })
      .eq('id', book.id)
      .select()
      .single()

    if (updateError) {
      return NextResponse.json(
        { error: updateError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      book: updatedBook,
      message: `Cover URL updated for "${book.title}"`
    })
  } catch (error) {
    console.error('Error updating cover:', error)
    return NextResponse.json(
      { error: 'Failed to update cover URL' },
      { status: 500 }
    )
  }
}

