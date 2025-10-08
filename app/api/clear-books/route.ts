import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

export async function POST(request: NextRequest) {
  try {
    console.log('Clear books API called')
    
    // Get confirmation from request body
    const { confirm } = await request.json()
    
    if (confirm !== 'yes') {
      return NextResponse.json({ 
        error: 'Confirmation required. Send { "confirm": "yes" } to clear all books.' 
      }, { status: 400 })
    }

    // First, get count of books to be deleted
    const { count: bookCount, error: countError } = await supabaseAdmin
      .from('books')
      .select('*', { count: 'exact', head: true })

    if (countError) {
      console.error('Error counting books:', countError)
      return NextResponse.json({ 
        error: 'Failed to count books', 
        details: countError.message 
      }, { status: 500 })
    }

    console.log(`Found ${bookCount} books to delete`)

    // Delete all books (this will cascade to related tables due to foreign key constraints)
    const { error: deleteError } = await supabaseAdmin
      .from('books')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000') // Delete all books

    if (deleteError) {
      console.error('Error deleting books:', deleteError)
      return NextResponse.json({ 
        error: 'Failed to delete books', 
        details: deleteError.message 
      }, { status: 500 })
    }

    console.log(`Successfully deleted ${bookCount} books`)
    
    return NextResponse.json({ 
      success: true, 
      message: `Successfully deleted ${bookCount} books from the database`,
      deletedCount: bookCount
    })

  } catch (error) {
    console.error('Clear books error:', error)
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 })
  }
}

// GET endpoint to check current book count
export async function GET() {
  try {
    const { count, error } = await supabaseAdmin
      .from('books')
      .select('*', { count: 'exact', head: true })

    if (error) {
      return NextResponse.json({ 
        error: 'Failed to count books', 
        details: error.message 
      }, { status: 500 })
    }

    return NextResponse.json({ 
      bookCount: count || 0,
      message: `There are currently ${count || 0} books in the database`
    })

  } catch (error) {
    console.error('Count books error:', error)
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 })
  }
}
