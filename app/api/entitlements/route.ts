import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

/**
 * GET /api/entitlements
 * Returns whether the current request has unlimited scans (VIP via invite cookie).
 * Used by the scan page to skip the client-side paywall for invite users.
 * Cookie subtext_vip is httpOnly so the client cannot read it; this endpoint checks server-side.
 */
export async function GET(req: NextRequest) {
  const unlimited = req.cookies.has('subtext_vip')
  return NextResponse.json({ ok: true, unlimited })
}
