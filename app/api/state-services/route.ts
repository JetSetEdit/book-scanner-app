import { NextRequest, NextResponse } from 'next/server'
import { getAllStateServices } from '@/lib/config/state-services'

export const runtime = 'nodejs'

/**
 * GET /api/state-services?state=NSW
 * Returns state-specific support services
 */
export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams
    const state = searchParams.get('state')

    if (!state) {
      return NextResponse.json(
        { error: 'State parameter required' },
        { status: 400 }
      )
    }

    const services = getAllStateServices(state)

    if (!services) {
      return NextResponse.json(
        { error: 'Invalid state or no services available' },
        { status: 404 }
      )
    }

    return NextResponse.json(services)
  } catch (error) {
    console.error('Error getting state services:', error)
    return NextResponse.json(
      { error: 'Failed to get state services' },
      { status: 500 }
    )
  }
}
