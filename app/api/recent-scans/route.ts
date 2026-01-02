import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

export const runtime = 'nodejs'
export const revalidate = 30 // Revalidate every 30 seconds

export async function GET() {
  try {
    // Fetch recent scans with book information
    // Limit to last 10 scans, ordered by most recent
    const { data: scans, error } = await supabaseAdmin
      .from('scans')
      .select(`
        id,
        isbn,
        created_at,
        book:books (
          id,
          title,
          author,
          cover_url
        )
      `)
      .order('created_at', { ascending: false })
      .limit(10)

    if (error) {
      console.error('Error fetching recent scans:', error)
      return NextResponse.json(
        { error: 'Failed to fetch recent scans' },
        { status: 500 }
      )
    }

    // Format the response
    const recentScans = (scans || []).map((scan: any) => ({
      id: scan.id,
      isbn: scan.isbn,
      createdAt: scan.created_at,
      book: scan.book ? {
        id: scan.book.id,
        title: scan.book.title,
        author: scan.book.author,
        coverUrl: scan.book.cover_url,
      } : null,
    }))

    return NextResponse.json({ scans: recentScans })
  } catch (error) {
    console.error('Error in recent-scans API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

