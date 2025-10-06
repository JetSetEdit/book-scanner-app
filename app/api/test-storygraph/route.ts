import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { storyGraphAPI } from '@/lib/storygraph-api'

export async function POST(request: NextRequest) {
  try {
    const { isbn } = await request.json()

    if (!isbn) {
      return NextResponse.json({ error: 'ISBN is required' }, { status: 400 })
    }

    const supabase = await createClient()
    const cleanIsbn = isbn.replace(/[-\s]/g, '')

    // Test StoryGraph API directly
    const storyGraphResult = await storyGraphAPI.searchByISBN(cleanIsbn)
    
    // Check if book exists in database
    const { data: existingBook } = await supabase
      .from('books')
      .select('*')
      .eq('isbn', cleanIsbn)
      .single()

    // Get content warnings if book exists
    let contentWarnings = []
    if (existingBook) {
      const { data: warnings } = await supabase
        .from('content_warnings')
        .select('*')
        .eq('book_id', existingBook.id)
      
      contentWarnings = warnings || []
    }

    return NextResponse.json({
      success: true,
      isbn: cleanIsbn,
      book: existingBook,
      storyGraphData: storyGraphResult.success ? storyGraphResult.data : null,
      storyGraphError: storyGraphResult.success ? null : storyGraphResult.error,
      contentWarnings,
      hasStoryGraphData: storyGraphResult.success
    })

  } catch (error) {
    console.error('Test StoryGraph error:', error)
    return NextResponse.json(
      { error: 'Failed to test StoryGraph integration' },
      { status: 500 }
    )
  }
}
