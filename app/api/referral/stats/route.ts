import { NextRequest, NextResponse } from 'next/server'
import { getUserIdentifier, getActiveBonusScans } from '@/lib/services/referral-bonus-service'
import { supabaseAdmin } from '@/lib/supabase/admin'

export const runtime = 'nodejs'

// Simple in-memory cache with TTL (5 minutes)
const statsCache = new Map<string, { data: any; expiresAt: number }>()

const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

/**
 * GET /api/referral/stats
 * Returns referral statistics for the current user
 * Cached for 5 minutes to reduce database load
 */
export async function GET(req: NextRequest) {
  try {
    const userId = getUserIdentifier(req)
    const now = Date.now()
    
    // Check cache
    const cached = statsCache.get(userId)
    if (cached && cached.expiresAt > now) {
      return NextResponse.json(cached.data)
    }
    
    // Get active bonus scans
    const activeBonusScans = await getActiveBonusScans(userId)
    
    // Get base limit from env
    const baseLimit = parseInt(process.env.SCAN_RATE_LIMIT || '5', 10)
    const effectiveLimit = baseLimit + activeBonusScans
    
    // Get total bonus scans earned (all time)
    const { data: allBonuses } = await supabaseAdmin
      .from('user_bonus_scans')
      .select('bonus_amount')
      .eq('user_id', userId)
    
    const totalBonusScansEarned = allBonuses?.reduce((sum, b) => sum + b.bonus_amount, 0) || 0
    
    // Get successful referrals (bonus_granted events where this user is the referrer)
    const { data: successfulReferrals } = await supabaseAdmin
      .from('referral_events')
      .select('id')
      .eq('referrer_user_id', userId)
      .eq('event_type', 'bonus_granted')
    
    const successfulReferralsCount = successfulReferrals?.length || 0
    
    // Get pending referrals (clicks without first_scan yet)
    // More efficient: get all clicks, then check which don't have first_scan
    const { data: clicks } = await supabaseAdmin
      .from('referral_events')
      .select('user_id, referrer_code')
      .eq('referrer_user_id', userId)
      .eq('event_type', 'click')
    
    let pendingReferralsCount = 0
    if (clicks && clicks.length > 0) {
      // Get all first_scan events for these user_id + referrer_code combinations
      const clickKeys = clicks.map(c => `${c.user_id}:${c.referrer_code}`)
      const { data: firstScans } = await supabaseAdmin
        .from('referral_events')
        .select('user_id, referrer_code')
        .eq('referrer_user_id', userId)
        .eq('event_type', 'first_scan')
      
      const firstScanKeys = new Set(
        (firstScans || []).map(s => `${s.user_id}:${s.referrer_code}`)
      )
      
      // Count clicks that don't have a corresponding first_scan
      pendingReferralsCount = clickKeys.filter(key => !firstScanKeys.has(key)).length
    }
    
    // Get expiring bonuses
    const twoDaysFromNow = new Date(now + 2 * 24 * 60 * 60 * 1000).toISOString()
    const oneDayFromNow = new Date(now + 24 * 60 * 60 * 1000).toISOString()
    
    const { data: expiringBonuses } = await supabaseAdmin
      .from('user_bonus_scans')
      .select('bonus_amount, expires_at')
      .eq('user_id', userId)
      .gt('expires_at', now.toString())
      .lt('expires_at', twoDaysFromNow)
      .order('expires_at', { ascending: true })
    
    const expiringIn2Days = expiringBonuses?.filter(b => 
      new Date(b.expires_at) <= new Date(twoDaysFromNow) &&
      new Date(b.expires_at) > new Date(oneDayFromNow)
    ) || []
    
    const expiringIn1Day = expiringBonuses?.filter(b => 
      new Date(b.expires_at) <= new Date(oneDayFromNow)
    ) || []
    
    const result = {
      activeBonusScans,
      totalBonusScansEarned,
      successfulReferrals: successfulReferralsCount,
      pendingReferrals: pendingReferralsCount,
      expiringBonuses: {
        expiringIn2Days: expiringIn2Days.map(b => ({
          amount: b.bonus_amount,
          expiresAt: b.expires_at,
        })),
        expiringIn1Day: expiringIn1Day.map(b => ({
          amount: b.bonus_amount,
          expiresAt: b.expires_at,
        })),
      },
      baseLimit,
      effectiveLimit,
    }
    
    // Cache the result
    statsCache.set(userId, {
      data: result,
      expiresAt: now + CACHE_TTL,
    })
    
    return NextResponse.json(result)
  } catch (error) {
    console.error('Error fetching referral stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch referral stats' },
      { status: 500 }
    )
  }
}

/**
 * Clear cache for a user (call this when bonus is claimed)
 */
export function clearStatsCache(userId: string) {
  statsCache.delete(userId)
}
