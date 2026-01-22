import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { requireAdmin } from '@/lib/utils/admin-auth'

// Dev-only endpoint to delete a book and all related data
// Requires x-admin-secret header (ADMIN_SECRET or DEBUG_IP_SECRET)
export async function DELETE(request: NextRequest) {
  const auth = requireAdmin(request);
  if (auth) return auth;

  // Check if we're in dev mode
  const isDev = process.env.NODE_ENV === 'development' || 
                request.headers.get('host')?.includes('localhost')

  if (!isDev) {
    return NextResponse.json({ error: 'Not available in production' }, { status: 403 })
  }

  try {
    const { isbn } = await request.json()

    if (!isbn) {
      return NextResponse.json({ error: 'ISBN is required' }, { status: 400 })
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

    const bookId = book.id

    // Delete in order: content_warnings, scans, ai_audit_logs, ambiguous_scans, then book
    await supabaseAdmin.from('content_warnings').delete().eq('book_id', bookId)
    await supabaseAdmin.from('scans').delete().eq('book_id', bookId)
    await supabaseAdmin.from('ai_audit_logs').delete().eq('book_id', bookId)
    await supabaseAdmin.from('ambiguous_scans').delete().eq('book_id', bookId)
    
    const { error: deleteError } = await supabaseAdmin
      .from('books')
      .delete()
      .eq('id', bookId)

    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      message: `Book ${isbn} and all related data deleted successfully` 
    })
  } catch (error) {
    console.error('Error deleting book:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}























