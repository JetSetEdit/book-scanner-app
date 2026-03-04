import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

/**
 * GET /api/user-location
 * Returns user's location information from Vercel geo headers
 * Used to provide state-specific support resources
 */
export async function GET(req: NextRequest) {
  try {
    // Get location from Vercel geo headers (absent on localhost)
    let country = req.geo?.country || req.headers.get('x-vercel-ip-country')
    let region = req.geo?.region || req.headers.get('x-vercel-ip-region')
    const city = req.geo?.city || req.headers.get('x-vercel-ip-city')

    // Localhost / dev: no geo headers → treat as Australia so you're not "international"
    const isLocal =
      process.env.NODE_ENV !== 'production' ||
      req.headers.get('host')?.startsWith('localhost') ||
      req.headers.get('host')?.startsWith('127.0.0.1')
    if (isLocal && !country) {
      country = 'AU'
      // Leave region null so state-specific services stay optional, or set e.g. 'NSW' to test state services
      if (!region) region = null
    }

    // Map Vercel region codes to Australian states
    // Vercel uses ISO region codes or city names
    let state: string | null = null
    
    if (region) {
      // Normalize region to Australian state
      const regionLower = region.toLowerCase()
      
      // Map common region codes/names to Australian states
      const stateMap: Record<string, string> = {
        'nsw': 'NSW',
        'new south wales': 'NSW',
        'sydney': 'NSW',
        'vic': 'VIC',
        'victoria': 'VIC',
        'melbourne': 'VIC',
        'qld': 'QLD',
        'queensland': 'QLD',
        'brisbane': 'QLD',
        'wa': 'WA',
        'western australia': 'WA',
        'perth': 'WA',
        'sa': 'SA',
        'south australia': 'SA',
        'adelaide': 'SA',
        'tas': 'TAS',
        'tasmania': 'TAS',
        'hobart': 'TAS',
        'act': 'ACT',
        'australian capital territory': 'ACT',
        'canberra': 'ACT',
        'nt': 'NT',
        'northern territory': 'NT',
        'darwin': 'NT',
      }
      
      // Check direct match
      if (stateMap[regionLower]) {
        state = stateMap[regionLower]
      } else {
        // Check if region contains state name
        for (const [key, value] of Object.entries(stateMap)) {
          if (regionLower.includes(key)) {
            state = value
            break
          }
        }
      }
    }

    return NextResponse.json({
      country: country || null,
      region: region || null,
      state: state || null,
      city: city || null,
    })
  } catch (error) {
    console.error('Error getting user location:', error)
    return NextResponse.json(
      { error: 'Failed to get location' },
      { status: 500 }
    )
  }
}
