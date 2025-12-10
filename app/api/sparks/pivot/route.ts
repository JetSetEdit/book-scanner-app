import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { recordPivot } from '@/lib/services/sparks-service'

/**
 * POST /api/sparks/pivot
 * 
 * Records a user pivot (deciding not to read a book based on warnings).
 * Awards sparks and checks for "Pivot Prodigy" badge.
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { bookId, isbn, pivotReason } = body

    if (!bookId || !isbn) {
      return NextResponse.json(
        { error: 'bookId and isbn are required' },
        { status: 400 }
      )
    }

    await recordPivot(user.id, bookId, isbn, pivotReason)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error recording pivot:', error)
    return NextResponse.json(
      { error: 'Failed to record pivot' },
      { status: 500 }
    )
  }
}

