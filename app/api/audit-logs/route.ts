import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const bookId = searchParams.get('book_id')

    if (!bookId) {
      return NextResponse.json({ error: 'book_id is required' }, { status: 400 })
    }

    const { data: logs, error } = await supabaseAdmin
      .from('ai_audit_logs')
      .select('*')
      .eq('book_id', bookId)
      .order('created_at', { ascending: false })
      .limit(10) // Most recent 10 logs

    if (error) {
      console.error('Error fetching audit logs:', error)
      return NextResponse.json({ error: 'Failed to fetch audit logs' }, { status: 500 })
    }

    return NextResponse.json({ logs: logs || [] })
  } catch (error) {
    console.error('Audit logs API error:', error)
    return NextResponse.json({
      error: 'Failed to process request',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

