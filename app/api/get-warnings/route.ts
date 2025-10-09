import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const bookId = searchParams.get('bookId')
    
    if (!bookId) {
      return NextResponse.json({ error: 'bookId is required' }, { status: 400 })
    }

    // Get all content warnings for the book
    const { data: warnings, error } = await supabaseAdmin
      .from('content_warnings')
      .select('*')
      .eq('book_id', bookId)
      .order('created_at', { ascending: true })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      warnings: warnings || [],
      count: warnings?.length || 0
    })

  } catch (error) {
    return NextResponse.json({
      error: 'Failed to get warnings',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

