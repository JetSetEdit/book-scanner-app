/**
 * Subtext Sparks Service
 * 
 * Handles awarding sparks, checking badge eligibility, and tracking user progress.
 * This is a modular, non-blocking system that hooks into existing events.
 */

import { createClient } from "@/lib/supabase/server"
import { supabaseAdmin } from "@/lib/supabase/admin"

export type SparkActionType = 'scan' | 'pivot' | 'validation' | 'badge_earned'

export interface AwardSparksParams {
  userId: string
  sparksAmount: number
  actionType: SparkActionType
  actionMetadata?: Record<string, any>
  badgeId?: string
}

export interface BadgeCheckResult {
  badgeEarned: boolean
  badgeId?: string
  badgeCode?: string
  badgeName?: string
}

/**
 * Award sparks to a user and update their total
 */
export async function awardSparks(params: AwardSparksParams): Promise<void> {
  const { userId, sparksAmount, actionType, actionMetadata, badgeId } = params
  
  if (sparksAmount <= 0) return // Don't award zero or negative sparks

  try {
    // 1. Check if user_sparks profile exists
    const { data: existing } = await supabaseAdmin
      .from('user_sparks')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (existing) {
      // Increment existing profile
      await supabaseAdmin
        .from('user_sparks')
        .update({
          total_sparks: existing.total_sparks + sparksAmount,
          scans_count: actionType === 'scan' ? existing.scans_count + 1 : existing.scans_count,
          pivots_count: actionType === 'pivot' ? existing.pivots_count + 1 : existing.pivots_count,
          validations_count: actionType === 'validation' ? existing.validations_count + 1 : existing.validations_count,
        })
        .eq('user_id', userId)
    } else {
      // Create new profile
      await supabaseAdmin
        .from('user_sparks')
        .insert({
          user_id: userId,
          total_sparks: sparksAmount,
          scans_count: actionType === 'scan' ? 1 : 0,
          pivots_count: actionType === 'pivot' ? 1 : 0,
          validations_count: actionType === 'validation' ? 1 : 0,
        })
    }

    // 2. Record in sparks_history
    await supabaseAdmin
      .from('sparks_history')
      .insert({
        user_id: userId,
        sparks_amount: sparksAmount,
        action_type: actionType,
        action_metadata: actionMetadata || null,
        badge_id: badgeId || null,
      })

    // 3. Check for new badges
    await checkAndAwardBadges(userId, actionType)

  } catch (error) {
    console.error('Error awarding sparks:', error)
    // Don't throw - sparks are non-critical
  }
}

/**
 * Check if user qualifies for any badges and award them
 */
export async function checkAndAwardBadges(
  userId: string,
  actionType: SparkActionType
): Promise<BadgeCheckResult[]> {
  const results: BadgeCheckResult[] = []

  try {
    // Get user's current stats
    const { data: userStats } = await supabaseAdmin
      .from('user_sparks')
      .select('scans_count, pivots_count, validations_count, total_sparks')
      .eq('user_id', userId)
      .single()

    if (!userStats) return results

    // Get all badges that match the action type
    const requirementTypeMap: Record<SparkActionType, string> = {
      scan: 'scan_count',
      pivot: 'pivot_count',
      validation: 'validation_count',
      badge_earned: 'sparks_total'
    }

    const requirementType = requirementTypeMap[actionType]

    // Get eligible badges
    const { data: eligibleBadges } = await supabaseAdmin
      .from('badges')
      .select('*')
      .eq('requirement_type', requirementType)
      .lte('requirement_value', 
        requirementType === 'scan_count' ? userStats.scans_count :
        requirementType === 'pivot_count' ? userStats.pivots_count :
        requirementType === 'validation_count' ? userStats.validations_count :
        userStats.total_sparks
      )

    if (!eligibleBadges) return results

    // Check which badges user already has
    const { data: existingBadges } = await supabaseAdmin
      .from('user_badges')
      .select('badge_id')
      .eq('user_id', userId)

    const existingBadgeIds = new Set(existingBadges?.map(b => b.badge_id) || [])

    // Award new badges
    for (const badge of eligibleBadges) {
      if (!existingBadgeIds.has(badge.id)) {
        // Award the badge
        await supabaseAdmin
          .from('user_badges')
          .insert({
            user_id: userId,
            badge_id: badge.id,
          })

        // Award badge sparks if any
        if (badge.sparks_reward > 0) {
          await awardSparks({
            userId,
            sparksAmount: badge.sparks_reward,
            actionType: 'badge_earned',
            actionMetadata: { badge_code: badge.code, badge_name: badge.name },
            badgeId: badge.id,
          })
        }

        results.push({
          badgeEarned: true,
          badgeId: badge.id,
          badgeCode: badge.code,
          badgeName: badge.name,
        })
      }
    }

    // Also check meta badges (like spark_collector) that depend on total sparks
    const { data: metaBadges } = await supabaseAdmin
      .from('badges')
      .select('*')
      .eq('requirement_type', 'sparks_total')
      .lte('requirement_value', userStats.total_sparks)

    if (metaBadges) {
      for (const badge of metaBadges) {
        if (!existingBadgeIds.has(badge.id)) {
          await supabaseAdmin
            .from('user_badges')
            .insert({
              user_id: userId,
              badge_id: badge.id,
            })

          results.push({
            badgeEarned: true,
            badgeId: badge.id,
            badgeCode: badge.code,
            badgeName: badge.name,
          })
        }
      }
    }

  } catch (error) {
    console.error('Error checking badges:', error)
  }

  return results
}

/**
 * Record a user pivot (deciding not to read a book)
 */
export async function recordPivot(
  userId: string,
  bookId: string,
  isbn: string,
  pivotReason?: string
): Promise<void> {
  try {
    // Insert pivot (unique constraint prevents duplicates)
    await supabaseAdmin
      .from('user_pivots')
      .insert({
        user_id: userId,
        book_id: bookId,
        isbn,
        pivot_reason: pivotReason || null,
      })
      .select()
      .single()

    // Award sparks for pivot
    await awardSparks({
      userId,
      sparksAmount: 15, // Base sparks for making a smart pivot
      actionType: 'pivot',
      actionMetadata: { isbn, book_id: bookId, reason: pivotReason },
    })

  } catch (error) {
    // Ignore duplicate pivot errors (user already pivoted on this book)
    if ((error as any)?.code !== '23505') {
      console.error('Error recording pivot:', error)
    }
  }
}

/**
 * Get user's sparks profile
 */
export async function getUserSparks(userId: string) {
  const supabase = await createClient()
  
  const { data: sparks } = await supabase
    .from('user_sparks')
    .select('*')
    .eq('user_id', userId)
    .single()

  return sparks
}

/**
 * Get user's badges
 */
export async function getUserBadges(userId: string) {
  const supabase = await createClient()
  
  const { data: badges } = await supabase
    .from('user_badges')
    .select(`
      *,
      badge:badges(*)
    `)
    .eq('user_id', userId)
    .order('earned_at', { ascending: false })

  return badges
}

