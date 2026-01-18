import { NextRequest, NextResponse } from 'next/server'
import { getClientIP } from '@/lib/utils/rate-limiter'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const ip = getClientIP(req)
  return NextResponse.json({ 
    your_ip: ip,
    note: "Send this IP to the developer to get unlimited access."
  })
}