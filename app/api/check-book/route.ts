import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const bookId = searchParams.get('bookId')

  if (!bookId) {
    return NextResponse.json({ error: 'Book ID is required' }, { status: 400 })
  }

  try {
    const { data: book, error } = await supabaseAdmin
      .from('books')
      .select('*')
      .eq('id', bookId)
      .single()

    if (error) {
      console.error('Error fetching book:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, book })
  } catch (e) {
    console.error('Unexpected error:', e)
    return NextResponse.json({ error: 'Unexpected error', details: e instanceof Error ? e.message : 'Unknown error' }, { status: 500 })
  }
}

