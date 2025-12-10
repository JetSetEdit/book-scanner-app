import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { awardSparks, SparkActionType } from '@/lib/services/sparks-service'

/**
 * POST /api/sparks/award
 * 
 * Awards sparks to the authenticated user.
 * Called automatically by the system, but can also be called manually.
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { sparksAmount, actionType, actionMetadata, badgeId } = body

    if (!sparksAmount || sparksAmount <= 0) {
      return NextResponse.json({ error: 'Invalid sparks amount' }, { status: 400 })
    }

    if (!actionType || !['scan', 'pivot', 'validation', 'badge_earned'].includes(actionType)) {
      return NextResponse.json({ error: 'Invalid action type' }, { status: 400 })
    }

    await awardSparks({
      userId: user.id,
      sparksAmount,
      actionType: actionType as SparkActionType,
      actionMetadata,
      badgeId,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error awarding sparks:', error)
    return NextResponse.json(
      { error: 'Failed to award sparks' },
      { status: 500 }
    )
  }
}

