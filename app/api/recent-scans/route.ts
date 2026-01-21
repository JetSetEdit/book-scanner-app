import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

export const runtime = 'nodejs'
export const revalidate = 30 // Revalidate every 30 seconds

export async function GET() {
  try {
    // Fetch recent scans with book information
    // Get more scans than needed to account for duplicates and missing covers
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
      .limit(50) // Get more to filter duplicates and missing covers

    if (error) {
      console.error('Error fetching recent scans:', error)
      return NextResponse.json(
        { error: 'Failed to fetch recent scans' },
        { status: 500 }
      )
    }

    // Format the response
    const formattedScans = (scans || []).map((scan: any) => ({
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

    // Filter out scans without covers
    const scansWithCovers = formattedScans.filter(
      scan => scan.book && scan.book.coverUrl
    )

    // Deduplicate by ISBN - keep only the most recent scan per ISBN
    const seenISBNs = new Set<string>()
    const uniqueScans = scansWithCovers.filter(scan => {
      if (seenISBNs.has(scan.isbn)) {
        return false // Skip duplicate ISBN
      }
      seenISBNs.add(scan.isbn)
      return true
    })

    // Limit to 10 most recent unique scans
    const recentScans = uniqueScans.slice(0, 10)

    // Fetch distinct category ids from content_warnings for these books
    const bookIds = recentScans.flatMap((s) => (s.book ? [s.book.id] : []))
    const categoryMap = new Map<string, string[]>()
    if (bookIds.length > 0) {
      const { data: cw } = await supabaseAdmin
        .from("content_warnings")
        .select("book_id, category_id, category")
        .in("book_id", bookIds)
      for (const r of cw || []) {
        const key = r.category_id ?? r.category
        if (key == null) continue
        const arr = categoryMap.get(r.book_id) ?? []
        if (!arr.includes(key)) arr.push(key)
        categoryMap.set(r.book_id, arr)
      }
    }
    for (const scan of recentScans) {
      if (scan.book) {
        scan.book.warningCategoryIds = categoryMap.get(scan.book.id) ?? []
      }
    }

    return NextResponse.json({ scans: recentScans })
  } catch (error) {
    console.error('Error in recent-scans API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

