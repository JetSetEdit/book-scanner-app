import { NextRequest, NextResponse } from 'next/server'

/**
 * Require admin authentication via x-admin-secret header
 * Returns null if authenticated, or an error response if not
 */
export function requireAdmin(req: NextRequest): NextResponse | null {
  const secret = req.headers.get('x-admin-secret')
  const adminSecret = process.env.ADMIN_SECRET
  const debugSecret = process.env.DEBUG_IP_SECRET
  
  if (!adminSecret && !debugSecret) {
    return NextResponse.json(
      { 
        ok: false, 
        error: { 
          code: 'ADMIN_NOT_CONFIGURED', 
          message: 'Admin auth not configured (set ADMIN_SECRET or DEBUG_IP_SECRET and pass x-admin-secret).' 
        } 
      },
      { status: 503 }
    )
  }
  
  if (!secret || (secret !== adminSecret && secret !== debugSecret)) {
    return NextResponse.json(
      { 
        ok: false, 
        error: { 
          code: 'UNAUTHORIZED', 
          message: 'Missing or invalid x-admin-secret.' 
        } 
      },
      { status: 401 }
    )
  }
  
  return null
}
