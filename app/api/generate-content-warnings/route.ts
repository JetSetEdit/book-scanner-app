import { NextRequest, NextResponse } from 'next/server'
import { generateContentWarnings } from '@/lib/content-warning-agent'
import { supabaseAdmin } from '@/lib/supabase/admin'

export async function POST(request: NextRequest) {
  try {
    const { bookId, forceRegenerate } = await request.json()

    if (!bookId) {
      return NextResponse.json(
        { error: 'Book ID is required' },
        { status: 400 }
      )
    }

    // Get book information from database
    const { data: book, error: bookError } = await supabaseAdmin
      .from('books')
      .select('*')
      .eq('id', bookId)
      .single()

    if (bookError || !book) {
      return NextResponse.json(
        { error: 'Book not found' },
        { status: 404 }
      )
    }

    // Check if book already has content warnings
    const { data: existingWarnings, error: warningsError } = await supabaseAdmin
      .from('content_warnings')
      .select('id')
      .eq('book_id', bookId)

    if (warningsError) {
      console.error('Error checking existing warnings:', warningsError)
      return NextResponse.json(
        { error: 'Failed to check existing warnings' },
        { status: 500 }
      )
    }

    if (existingWarnings && existingWarnings.length > 0 && !forceRegenerate) {
      return NextResponse.json({
        message: 'Book already has content warnings',
        warning_count: existingWarnings.length
      })
    }

    // If forceRegenerate is true, delete existing warnings first
    if (forceRegenerate && existingWarnings && existingWarnings.length > 0) {
      const { error: deleteError } = await supabaseAdmin
        .from('content_warnings')
        .delete()
        .eq('book_id', bookId)

      if (deleteError) {
        console.error('Error deleting existing warnings:', deleteError)
        return NextResponse.json(
          { error: 'Failed to clear existing warnings' },
          { status: 500 }
        )
      }
    }

    // Generate content warnings using AI agent
    const result = await generateContentWarnings({
      book_title: book.title,
      book_author: book.author || 'Unknown',
      book_description: book.description || undefined,
      book_categories: book.categories || undefined,
      book_isbn: book.isbn
    })

    if (result.content_warnings.length === 0) {
      return NextResponse.json({
        message: 'No content warnings generated',
        confidence: result.confidence,
        reasoning: result.reasoning
      })
    }

    // Insert the generated warnings into the database
    // Note: reasoning is now always included (parsing logic ensures it exists)
    // If the column doesn't exist, the insert will fail gracefully
    const validCategories = ['violence', 'sexual_content', 'substance_abuse', 'mental_health', 'death', 'abuse', 'discrimination', 'other'];

    const warningsToInsert = result.content_warnings.map(warning => ({
      book_id: bookId,
      category: validCategories.includes(warning.category) ? warning.category : 'other',
      description: warning.category === 'relationships' || warning.category === 'language' ? `[${warning.category.toUpperCase()}] ${warning.description}` : warning.description,
      severity: warning.severity,
      user_id: null, // AI-generated warnings don't have a user_id
      reasoning: warning.reasoning || null // Always include reasoning (parsing ensures it exists)
    })) as any[]

    const { data: insertedWarnings, error: insertError } = await supabaseAdmin
      .from('content_warnings')
      .insert(warningsToInsert)
      .select()

    if (insertError) {
      console.error('Error inserting content warnings:', insertError)
      return NextResponse.json(
        { error: 'Failed to save content warnings' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      warnings_generated: result.content_warnings.length,
      warnings: insertedWarnings,
      confidence: result.confidence,
      reasoning: result.reasoning
    })

  } catch (error) {
    console.error('Content warning generation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const bookId = searchParams.get('bookId')

    if (!bookId) {
      return NextResponse.json(
        { error: 'Book ID is required' },
        { status: 400 }
      )
    }

    // Check if book has content warnings
    const { data: warnings, error } = await supabaseAdmin
      .from('content_warnings')
      .select('*')
      .eq('book_id', bookId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching warnings:', error)
      return NextResponse.json(
        { error: 'Failed to fetch warnings' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      book_id: bookId,
      has_warnings: warnings && warnings.length > 0,
      warning_count: warnings?.length || 0,
      warnings: warnings || []
    })

  } catch (error) {
    console.error('Error checking warnings:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

