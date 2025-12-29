import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getUserSparks, getUserBadges } from '@/lib/services/sparks-service'

/**
 * GET /api/sparks/profile
 * 
 * Returns the authenticated user's sparks profile, badges, and stats.
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    // Return empty profile instead of 401 - sparks is optional/legacy
    if (authError || !user) {
      return NextResponse.json({
        sparks: {
          total_sparks: 0,
          scans_count: 0,
          pivots_count: 0,
          validations_count: 0,
        },
        badges: [],
      })
    }

    const [sparks, badges] = await Promise.all([
      getUserSparks(user.id),
      getUserBadges(user.id),
    ])

    return NextResponse.json({
      sparks: sparks || {
        total_sparks: 0,
        scans_count: 0,
        pivots_count: 0,
        validations_count: 0,
      },
      badges: badges || [],
    })
  } catch (error) {
    console.error('Error fetching sparks profile:', error)
    return NextResponse.json(
      { error: 'Failed to fetch sparks profile' },
      { status: 500 }
    )
  }
}

