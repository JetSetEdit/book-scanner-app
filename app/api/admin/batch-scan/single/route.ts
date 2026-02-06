import { NextRequest, NextResponse } from 'next/server'
import { processIsbnScan } from '@/lib/services/scan-service'
import { requireAdmin } from '@/lib/utils/admin-auth'
import { getClientIP, isIpAllowlisted } from '@/lib/utils/rate-limiter'

// Set max duration to 5 minutes (Vercel hobby limit is 10s for API routes, but this might run longer)
// For long running tasks, we should ideally use background jobs, but for an admin tool
// processing a few books, we can try to do it in the request or use client-side queuing.
export const maxDuration = 60; 

export async function POST(req: NextRequest) {
  const auth = requireAdmin(req)
  if (auth) return auth
  
  const allowlistRaw = process.env.RATE_LIMIT_IP_ALLOWLIST || ''
  if (allowlistRaw.trim().length > 0) {
    const clientIP = getClientIP(req)
    if (!isIpAllowlisted(clientIP)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }
  }

  try {
    const body = await req.json()
    const { isbn } = body

    if (!isbn) {
      return NextResponse.json({ error: 'ISBN is required' }, { status: 400 })
    }

    // Process a SINGLE ISBN
    // The client will handle the loop/queue to avoid timeouts
    const result = await processIsbnScan(
      isbn,
      undefined, // No progress callback for API
      undefined, // No selected candidate
      true,      // Force refresh (this is an admin action)
      undefined,
      { enableWebEnrichment: true }, // Ensure web enrichment is on
      'deep'
    )

    return NextResponse.json({ 
      success: true, 
      isbn,
      title: result.book?.title,
      scanId: result.scan?.id
    })

  } catch (error) {
    console.error('Batch scan error for ISBN:', error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 })
  }
}
