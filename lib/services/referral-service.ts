import { supabaseAdmin } from '@/lib/supabase/admin'
import { grantBonusScans } from './referral-bonus-service'

/**
 * Generate a readable referral code
 * Format: user-{random_suffix}
 * Example: user-x9k2
 */
function generateReadableCode(userId: string): string {
  // Generate random suffix (4-5 alphanumeric chars)
  const suffix = Math.random().toString(36).substring(2, 7)

  return `user-${suffix}`
}

/**
 * Get or create a referral code for a user
 * Returns existing code if one exists, creates new one otherwise
 */
export async function getOrCreateReferralCode(userId: string): Promise<string> {
  // Check if code already exists
  const { data: existing } = await supabaseAdmin
    .from('referral_links')
    .select('code')
    .eq('referrer_user_id', userId)
    .single()

  if (existing?.code) {
    return existing.code
  }

  // Generate new code (retry if collision)
  let attempts = 0
  while (attempts < 5) {
    const code = generateReadableCode(userId)

    // Try to insert
    const { data, error } = await supabaseAdmin
      .from('referral_links')
      .insert({
        code,
        referrer_user_id: userId,
      })
      .select()
      .single()

    if (!error && data) {
      return code
    }

    // If unique constraint violation, try again with different suffix
    if (error?.code === '23505') {
      attempts++
      continue
    }

    // Other error
    throw new Error(`Failed to create referral code: ${error?.message}`)
  }

  throw new Error('Failed to generate unique referral code after multiple attempts')
}

/**
 * Claim referral bonus when a user performs their first scan
 * Handles multi-level referrals (max 2 levels)
 */
export async function claimReferralBonus(
  clickerUserId: string,
  code: string
): Promise<{
  success: boolean;
  bonusAwarded: number;
  recipients: string[];
  isMultiLevel: boolean;
  directBonus: number;
  multiLevelBonus: number;
}> {
  // Get referral link info
  const { data: referralLink, error: linkError } = await supabaseAdmin
    .from('referral_links')
    .select('code, referrer_user_id')
    .eq('code', code)
    .single()

  if (linkError || !referralLink) {
    return { success: false, bonusAwarded: 0, recipients: [] }
  }

  // Prevent self-referral
  if (clickerUserId === referralLink.referrer_user_id) {
    return { success: false, bonusAwarded: 0, recipients: [] }
  }

  // Check if already claimed
  const { data: existingClaim } = await supabaseAdmin
    .from('referral_events')
    .select('id')
    .eq('user_id', clickerUserId)
    .eq('referrer_code', code)
    .eq('event_type', 'bonus_granted')
    .limit(1)

  if (existingClaim && existingClaim.length > 0) {
    return { success: false, bonusAwarded: 0, recipients: [] }
  }

  // Record first_scan event
  const { data: firstScanEvent, error: scanEventError } = await supabaseAdmin
    .from('referral_events')
    .insert({
      event_type: 'first_scan',
      user_id: clickerUserId,
      referrer_code: code,
      referrer_user_id: referralLink.referrer_user_id,
    })
    .select()
    .single()

  if (scanEventError) {
    console.error('Error recording first_scan event:', scanEventError)
  }

  // Check if immediate referrer was also referred (for multi-level: A → B → C)
  // If B (immediate referrer) was referred by A, then A is the parent referrer
  // Look for the immediate referrer's 'first_scan' event to find who referred them
  const { data: referrerFirstScan } = await supabaseAdmin
    .from('referral_events')
    .select('referrer_user_id')
    .eq('user_id', referralLink.referrer_user_id) // The immediate referrer (B)
    .eq('event_type', 'first_scan')
    .order('event_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  // Parent referrer is who referred the immediate referrer (A in A→B→C chain)
  const parentReferrerUserId = referrerFirstScan?.referrer_user_id || null

  // Award bonuses
  const bonusAmount = parseInt(process.env.REFERRAL_BONUS_SCANS || '3', 10)
  const recipients: string[] = []

  // Level 1: Immediate referrer
  try {
    await grantBonusScans(referralLink.referrer_user_id, bonusAmount)

    // Record bonus_granted event
    await supabaseAdmin.from('referral_events').insert({
      event_type: 'bonus_granted',
      user_id: clickerUserId,
      referrer_code: code,
      referrer_user_id: referralLink.referrer_user_id,
      parent_referrer_user_id: parentReferrerUserId,
    })

    recipients.push(referralLink.referrer_user_id)
  } catch (error) {
    console.error('Error granting bonus to referrer:', error)
  }

  // Level 2: Parent referrer (if exists and max levels allows)
  if (parentReferrerUserId && parentReferrerUserId !== referralLink.referrer_user_id) {
    try {
      await grantBonusScans(parentReferrerUserId, bonusAmount)

      // Record bonus_granted event for parent
      await supabaseAdmin.from('referral_events').insert({
        event_type: 'bonus_granted',
        user_id: clickerUserId,
        referrer_code: code,
        referrer_user_id: referralLink.referrer_user_id,
        parent_referrer_user_id: parentReferrerUserId,
      })

      recipients.push(parentReferrerUserId)
    } catch (error) {
      console.error('Error granting bonus to parent referrer:', error)
    }
  }

  // Calculate breakdown for multi-level
  const directBonus = recipients.includes(referralLink.referrer_user_id) ? bonusAmount : 0
  const multiLevelBonus = parentReferrerUserId && recipients.includes(parentReferrerUserId) ? bonusAmount : 0
  const isMultiLevel = recipients.length > 1

  return {
    success: recipients.length > 0,
    bonusAwarded: bonusAmount * recipients.length,
    recipients,
    isMultiLevel,
    directBonus,
    multiLevelBonus,
  }
}
