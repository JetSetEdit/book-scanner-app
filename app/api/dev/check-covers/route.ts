import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function GET(request: NextRequest) {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')
    const hasCover = searchParams.get('hasCover') // 'true', 'false', or null for all

    let query = supabase
      .from('books')
      .select('id, isbn, title, author, cover_url, created_at')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (hasCover === 'true') {
      query = query.not('cover_url', 'is', null)
    } else if (hasCover === 'false') {
      query = query.is('cover_url', null)
    }

    const { data: books, error } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Get total count
    let countQuery = supabase.from('books').select('*', { count: 'exact', head: true })
    if (hasCover === 'true') {
      countQuery = countQuery.not('cover_url', 'is', null)
    } else if (hasCover === 'false') {
      countQuery = countQuery.is('cover_url', null)
    }
    const { count } = await countQuery

    return NextResponse.json({
      books,
      total: count || 0,
      limit,
      offset,
    })
  } catch (error) {
    console.error('Error fetching books:', error)
    return NextResponse.json(
      { error: 'Failed to fetch books' },
      { status: 500 }
    )
  }
}

