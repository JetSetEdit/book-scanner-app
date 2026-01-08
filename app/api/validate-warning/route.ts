import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { getSubcategoryById, getSeverityScore } from '@/lib/config/taxonomy-v2'

/**
 * Log severity score data for RLHF analysis
 * This captures the comparison between hand-tuned scores and user perception
 */
async function logSeverityScoreData(
  warningId: string,
  modelSeverity: string,
  categoryId: string | null,
  subcategoryId: string | null,
  isHelpful: boolean
) {
  try {
    // Fetch taxonomy data if subcategory is available
    let taxonomyScore: number | undefined
    let scoreOrigin: string | undefined
    
    if (categoryId && subcategoryId) {
      const subcategory = getSubcategoryById(categoryId, subcategoryId)
      if (subcategory) {
        taxonomyScore = getSeverityScore(subcategory)
        scoreOrigin = subcategory.severityScoreOrigin || 'unknown'
      }
    }

    // Log for RLHF analysis (proto-RLHF data collection)
    // TODO: Migrate to dedicated table when RLHF pipeline is ready
    const rlhfLog = {
      warning_id: warningId,
      timestamp: new Date().toISOString(),
      model_assigned_severity: modelSeverity, // mild/moderate/severe from AI
      taxonomy_severity_score: taxonomyScore, // 0-10 scale from hand_tuned_v1
      severity_score_origin: scoreOrigin, // 'hand_tuned_v1', 'rlhf_v2', etc.
      category_id: categoryId,
      subcategory_id: subcategoryId,
      user_feedback: isHelpful, // true = helpful, false = not helpful
      // Future: Add user_perceived_severity when we collect explicit severity feedback
    }

    // Log to console for now (can be migrated to analytics/table later)
    console.log('[RLHF] Severity score comparison:', JSON.stringify(rlhfLog, null, 2))
    
    // TODO: Store in dedicated rlhf_severity_feedback table when ready:
    // await supabaseAdmin.from('rlhf_severity_feedback').insert(rlhfLog)
  } catch (error) {
    // Don't fail the vote if logging fails
    console.error('[RLHF] Error logging severity score data:', error)
  }
}

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

    // Fetch warning data to get severity, taxonomy info, and model_used for RLHF logging
    const { data: warningData, error: warningError } = await supabaseAdmin
      .from('content_warnings')
      .select('severity, category_id, subcategory_id, model_used')
      .eq('id', warningId)
      .single()

    if (warningError) {
      console.error('Error fetching warning data:', warningError)
      // Continue with vote even if we can't fetch warning data
    }

    const { data, error } = await supabaseAdmin.rpc('apply_anonymous_warning_vote', {
      p_warning_id: warningId,
      p_device_id: trimmedDeviceId,
      p_is_helpful: isHelpful,
      p_model_used: warningData?.model_used || null,
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

    // Log severity score data for RLHF analysis (non-blocking)
    if (warningData) {
      await logSeverityScoreData(
        warningId,
        warningData.severity,
        warningData.category_id,
        warningData.subcategory_id,
        isHelpful
      )
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
