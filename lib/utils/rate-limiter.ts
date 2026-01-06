/**
 * Simple in-memory rate limiter for scan API
 * Tracks scans per IP address per day
 * 
 * For production, consider upgrading to Redis or database-backed solution
 */

interface RateLimitEntry {
  count: number
  resetAt: number // Timestamp when limit resets
}

// In-memory store: IP -> RateLimitEntry
const rateLimitStore = new Map<string, RateLimitEntry>()

// Clean up old entries every hour
setInterval(() => {
  const now = Date.now()
  for (const [ip, entry] of rateLimitStore.entries()) {
    if (entry.resetAt < now) {
      rateLimitStore.delete(ip)
    }
  }
}, 60 * 60 * 1000) // 1 hour

/**
 * Get client IP from request
 */
export function getClientIP(request: Request): string {
  // Try various headers (Vercel, Cloudflare, etc.)
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }
  
  const realIP = request.headers.get('x-real-ip')
  if (realIP) {
    return realIP
  }
  
  // Fallback (won't work in serverless, but good for local dev)
  return 'unknown'
}

/**
 * Calculate midnight in a specific timezone
 * @param timezone IANA timezone string (e.g., 'Australia/Sydney', 'America/New_York')
 * @returns Timestamp of next midnight in that timezone
 */
function getMidnightInTimezone(timezone: string): number {
  const now = new Date()
  
  // Get current date/time components in the target timezone
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  })
  
  const parts = formatter.formatToParts(now)
  const tzNow = {
    year: parseInt(parts.find(p => p.type === 'year')!.value),
    month: parseInt(parts.find(p => p.type === 'month')!.value) - 1, // 0-indexed
    day: parseInt(parts.find(p => p.type === 'day')!.value),
    hour: parseInt(parts.find(p => p.type === 'hour')!.value)
  }
  
  // Calculate tomorrow's midnight in the target timezone
  // We need to find the UTC timestamp that represents midnight in the target timezone
  // Strategy: try UTC times around the expected midnight and find which one formats to 00:00
  
  // Start with an estimate: tomorrow at 00:00 UTC, adjusted by typical timezone offset
  const estimateUTC = Date.UTC(tzNow.year, tzNow.month, tzNow.day + 1, 0, 0, 0, 0)
  
  // Search for the UTC time that formats to midnight in target timezone
  // Check times within ±12 hours of estimate
  let bestMatch = estimateUTC
  let minHourDiff = Infinity
  
  for (let offsetHours = -12; offsetHours <= 12; offsetHours++) {
    const testUTC = estimateUTC + (offsetHours * 60 * 60 * 1000)
    const testDate = new Date(testUTC)
    const testParts = formatter.formatToParts(testDate)
    const testHour = parseInt(testParts.find(p => p.type === 'hour')!.value)
    const testDay = parseInt(testParts.find(p => p.type === 'day')!.value)
    const testMonth = parseInt(testParts.find(p => p.type === 'month')!.value) - 1
    
    // Check if this UTC time represents midnight (00:00) and is tomorrow's date
    if (testHour === 0 && testDay === tzNow.day + 1 && testMonth === tzNow.month) {
      // This is a candidate - prefer the one closest to now but in the future
      if (testUTC > now.getTime()) {
        const hourDiff = Math.abs(testHour - 0)
        if (hourDiff < minHourDiff) {
          minHourDiff = hourDiff
          bestMatch = testUTC
        }
      }
    }
  }
  
  // If we didn't find a good match, try a simpler approach
  if (minHourDiff === Infinity) {
    // Fallback: use estimate and hope it's close enough
    // Add 24 hours if we've already passed today's midnight
    const todayMidnightEstimate = Date.UTC(tzNow.year, tzNow.month, tzNow.day, 0, 0, 0, 0)
    if (now.getTime() > todayMidnightEstimate) {
      return todayMidnightEstimate + (24 * 60 * 60 * 1000)
    }
    return todayMidnightEstimate
  }
  
  return bestMatch
}

/**
 * Check if IP has exceeded rate limit
 * @param ip Client IP address
 * @param limit Maximum scans per day (default: 5)
 * @param timezone Optional IANA timezone string (e.g., 'Australia/Sydney'). If not provided, uses UTC.
 * @returns Object with { allowed: boolean, remaining: number, resetAt: number }
 */
export function checkRateLimit(ip: string, limit: number = 5, timezone?: string): {
  allowed: boolean
  remaining: number
  resetAt: number
} {
  const now = Date.now()
  
  // Calculate reset time based on timezone
  const resetAt = timezone 
    ? getMidnightInTimezone(timezone)
    : (() => {
        const tomorrow = new Date()
        tomorrow.setUTCHours(24, 0, 0, 0) // Reset at midnight UTC
        return tomorrow.getTime()
      })()
  
  const entry = rateLimitStore.get(ip)
  
  // No entry or expired - create new
  if (!entry || entry.resetAt < now) {
    rateLimitStore.set(ip, {
      count: 0,
      resetAt
    })
    return {
      allowed: true,
      remaining: limit,
      resetAt
    }
  }
  
  // Check if limit exceeded
  const remaining = Math.max(0, limit - entry.count)
  const allowed = entry.count < limit
  
  return {
    allowed,
    remaining,
    resetAt: entry.resetAt
  }
}

/**
 * Increment scan count for IP
 * @param ip Client IP address
 * @param timezone Optional IANA timezone string for calculating reset time
 */
export function incrementRateLimit(ip: string, timezone?: string): void {
  const now = Date.now()
  
  // Calculate reset time based on timezone
  const resetAt = timezone 
    ? getMidnightInTimezone(timezone)
    : (() => {
        const tomorrow = new Date()
        tomorrow.setUTCHours(24, 0, 0, 0) // Reset at midnight UTC
        return tomorrow.getTime()
      })()
  
  const entry = rateLimitStore.get(ip)
  
  if (!entry || entry.resetAt < now) {
    // Create new entry
    rateLimitStore.set(ip, {
      count: 1,
      resetAt
    })
  } else {
    // Increment existing
    entry.count++
  }
}

/**
 * Get rate limit status for IP (without incrementing)
 * @param ip Client IP address
 * @param limit Maximum scans per day (default: 5)
 * @param timezone Optional IANA timezone string for calculating reset time
 */
export function getRateLimitStatus(ip: string, limit: number = 5, timezone?: string): {
  count: number
  remaining: number
  limit: number
  resetAt: number
} {
  const now = Date.now()
  const entry = rateLimitStore.get(ip)
  
  // Calculate reset time based on timezone
  const defaultResetAt = timezone 
    ? getMidnightInTimezone(timezone)
    : (() => {
        const tomorrow = new Date()
        tomorrow.setUTCHours(24, 0, 0, 0) // Reset at midnight UTC
        return tomorrow.getTime()
      })()
  
  if (!entry || entry.resetAt < now) {
    return {
      count: 0,
      remaining: limit,
      limit,
      resetAt: defaultResetAt
    }
  }
  
  return {
    count: entry.count,
    remaining: Math.max(0, limit - entry.count),
    limit,
    resetAt: entry.resetAt
  }
}

