import { NextRequest, NextResponse } from 'next/server'
import { getUserIdentifier } from '@/lib/services/referral-bonus-service'
import { getOrCreateReferralCode } from '@/lib/services/referral-service'

export const runtime = 'nodejs'

/**
 * GET /api/referral/generate
 * Generate or retrieve user's referral code
 * Returns existing code if one exists, creates new one otherwise
 */
export async function GET(req: NextRequest) {
  try {
    const userId = getUserIdentifier(req)
    const code = await getOrCreateReferralCode(userId)
    
    // Build share URL
    const origin = req.headers.get('origin') || 
                   req.headers.get('host') || 
                   'https://www.subtextscanner.com.au'
    const protocol = origin.includes('localhost') ? 'http' : 'https'
    const host = origin.replace(/^https?:\/\//, '')
    const shareUrl = `${protocol}://${host}/share/${code}`
    
    return NextResponse.json({
      code,
      shareUrl,
    })
  } catch (error) {
    console.error('Error generating referral code:', error)
    return NextResponse.json(
      { error: 'Failed to generate referral code' },
      { status: 500 }
    )
  }
}
