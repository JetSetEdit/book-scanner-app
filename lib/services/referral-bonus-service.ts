import { NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import crypto from 'crypto'

/**
 * Generate a user identifier from IP address and User-Agent
 * This creates a fingerprint that's more stable than IP alone
 * but still works without requiring client-side storage
 */
export function getUserIdentifier(req: NextRequest): string {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
             req.headers.get('x-vercel-forwarded-for')?.split(',')[0]?.trim() ||
             req.headers.get('x-real-ip') ||
             'unknown'
  
  const userAgent = req.headers.get('user-agent') || 'unknown'
  
  // Create deterministic hash from IP + UA
  const input = `${ip}:${userAgent}`
  const hash = crypto.createHash('sha256').update(input).digest('hex')
  
  // Return first 16 chars for shorter identifier
  return hash.substring(0, 16)
}

/**
 * Grant bonus scans to a user
 * Stores in database with expiration date
 */
export async function grantBonusScans(
  userId: string,
  amount: number,
  expiresInDays: number = 7
): Promise<void> {
  const now = new Date()
  const expiresAt = new Date(now.getTime() + expiresInDays * 24 * 60 * 60 * 1000)
  
  const { error } = await supabaseAdmin
    .from('user_bonus_scans')
    .insert({
      user_id: userId,
      bonus_amount: amount,
      awarded_at: now.toISOString(),
      expires_at: expiresAt.toISOString(),
    })
  
  if (error) {
    console.error('Error granting bonus scans:', error)
    throw new Error(`Failed to grant bonus scans: ${error.message}`)
  }
}

/**
 * Get total active bonus scans for a user
 * Sums all non-expired bonuses
 */
export async function getActiveBonusScans(userId: string): Promise<number> {
  const now = new Date().toISOString()
  
  const { data, error } = await supabaseAdmin
    .from('user_bonus_scans')
    .select('bonus_amount')
    .eq('user_id', userId)
    .gt('expires_at', now)
  
  if (error) {
    console.error('Error fetching bonus scans:', error)
    return 0
  }
  
  if (!data || data.length === 0) {
    return 0
  }
  
  return data.reduce((sum, entry) => sum + entry.bonus_amount, 0)
}

/**
 * Clean up expired bonus scans
 * Can be called periodically or on-demand
 */
export async function cleanupExpiredBonuses(): Promise<number> {
  const now = new Date().toISOString()
  
  const { data, error } = await supabaseAdmin
    .from('user_bonus_scans')
    .delete()
    .lt('expires_at', now)
    .select()
  
  if (error) {
    console.error('Error cleaning up expired bonuses:', error)
    return 0
  }
  
  return data?.length || 0
}
