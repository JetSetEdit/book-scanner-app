import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

/**
 * Check if user is authenticated or in dev mode
 */
async function checkAuth(): Promise<{ authorized: boolean; userId?: string }> {
  // Allow in dev mode
  if (process.env.NODE_ENV === 'development') {
    return { authorized: true }
  }

  // Check authentication
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return { authorized: false }
  }

  return { authorized: true, userId: user.id }
}

/**
 * GET /api/rlhf/analysis
 * Get analysis of RLHF comparisons
 * Requires authentication (or dev mode)
 */
export async function GET() {
  const auth = await checkAuth()
  if (!auth.authorized) {
    return NextResponse.json(
      { error: 'Unauthorized. Please sign in.' },
      { status: 401 }
    )
  }

  try {
    const { data: comparisons, error } = await supabaseAdmin
      .from('rlhf_comparisons')
      .select(`
        *,
        book_a:books!rlhf_comparisons_book_a_id_fkey(title, author),
        book_b:books!rlhf_comparisons_book_b_id_fkey(title, author)
      `)
      .order('created_at', { ascending: false })

    if (error) throw error

    const total = comparisons?.length || 0
    const matches = comparisons?.filter(c => c.match).length || 0
    const mismatches = total - matches
    const matchRate = total > 0 ? (matches / total) * 100 : 0

    return NextResponse.json({
      success: true,
      comparisons: comparisons || [],
      stats: {
        total,
        matches,
        mismatches,
        matchRate
      }
    })
  } catch (error) {
    console.error('RLHF analysis error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch analysis' },
      { status: 500 }
    )
  }
}

