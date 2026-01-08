import { NextRequest, NextResponse } from 'next/server'
import { getClientIP, isIpAllowlisted } from '@/lib/utils/rate-limiter'

function getIpHeaderSource(req: NextRequest): string {
  if (req.headers.get('cf-connecting-ip')) return 'cf-connecting-ip'
  if (req.headers.get('x-vercel-forwarded-for')) return 'x-vercel-forwarded-for'
  if (req.headers.get('x-forwarded-for')) return 'x-forwarded-for'
  if (req.headers.get('x-real-ip')) return 'x-real-ip'
  return 'unknown'
}

export const runtime = 'nodejs'

/**
 * Protected helper endpoint to reveal the client IP as seen by the server.
 *
 * Usage:
 *   /api/debug/ip?secret=YOUR_SECRET
 *
 * Set env var:
 *   DEBUG_IP_SECRET=YOUR_SECRET
 */
export async function GET(req: NextRequest) {
  const configuredSecret = process.env.DEBUG_IP_SECRET
  const { searchParams } = new URL(req.url)
  const providedSecret = searchParams.get('secret') || ''

  // If no secret configured, or the secret is wrong, pretend this endpoint doesn't exist.
  if (!configuredSecret || providedSecret !== configuredSecret) {
    return new NextResponse(null, { status: 404 })
  }

  const ip = getClientIP(req)
  return NextResponse.json({
    ip,
    source: getIpHeaderSource(req),
    allowlisted: isIpAllowlisted(ip),
  })
}


