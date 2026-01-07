import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

export async function POST(request: NextRequest) {
  try {
    const { warningId, isHelpful, deviceId } = await request.json()

    if (!warningId || typeof isHelpful !== 'boolean' || !deviceId || typeof deviceId !== 'string') {
      return NextResponse.json({ error: 'Invalid request data' }, { status: 400 })
    }

    const trimmedDeviceId = deviceId.trim()
    if (trimmedDeviceId.length < 8 || trimmedDeviceId.length > 128) {
      return NextResponse.json({ error: 'Invalid deviceId' }, { status: 400 })
    }

    const { data, error } = await supabaseAdmin.rpc('apply_anonymous_warning_vote', {
      p_warning_id: warningId,
      p_device_id: trimmedDeviceId,
      p_is_helpful: isHelpful,
    })

    if (error) {
      console.error('Error applying anonymous warning vote:', error)
      return NextResponse.json({ error: 'Failed to record validation' }, { status: 500 })
    }

    // Supabase RPC returns an array of rows for RETURNS TABLE
    const row = Array.isArray(data) ? data[0] : data
    if (!row) {
      return NextResponse.json({ error: 'No response from vote handler' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      helpful_count: row.helpful_count,
      not_helpful_count: row.not_helpful_count,
      user_vote: row.user_vote, // boolean | null
    })
  } catch (error) {
    console.error('Error validating warning:', error)
    return NextResponse.json({ error: 'Failed to validate warning' }, { status: 500 })
  }
}
