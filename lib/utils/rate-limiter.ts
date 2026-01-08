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

// In-memory store for Gemini daily usage (single global counter)
interface GeminiUsageEntry {
  count: number
  resetAt: number // Timestamp when limit resets (UTC midnight)
}
const geminiUsageStore = new Map<string, GeminiUsageEntry>()

function getIpAllowlistSet(): Set<string> {
  const raw = process.env.RATE_LIMIT_IP_ALLOWLIST || ''
  const items = raw
    .split(/[,;\n]/g)
    .map((s) => s.trim())
    .filter(Boolean)

  return new Set(items)
}

/**
 * Allowlist specific client IPs from rate limiting.
 *
 * Configure via env:
 *   RATE_LIMIT_IP_ALLOWLIST="1.2.3.4, 5.6.7.8"
 */
export function isIpAllowlisted(ip: string): boolean {
  if (!ip || ip === 'unknown') return false
  const allowlist = getIpAllowlistSet()
  return allowlist.size > 0 && allowlist.has(ip)
}

// Clean up old entries every hour
setInterval(() => {
  const now = Date.now()
  for (const [ip, entry] of rateLimitStore.entries()) {
    if (entry.resetAt < now) {
      rateLimitStore.delete(ip)
    }
  }
  // Also clean up Gemini usage store
  for (const [key, entry] of geminiUsageStore.entries()) {
    if (entry.resetAt < now) {
      geminiUsageStore.delete(key)
    }
  }
}, 60 * 60 * 1000) // 1 hour

/**
 * Get client IP from request
 */
export function getClientIP(request: Request): string {
  // Try various headers (Vercel, Cloudflare, etc.)
  const cfConnectingIp = request.headers.get('cf-connecting-ip')
  if (cfConnectingIp) {
    return cfConnectingIp.trim()
  }

  const vercelForwardedFor = request.headers.get('x-vercel-forwarded-for')
  if (vercelForwardedFor) {
    return vercelForwardedFor.split(',')[0].trim()
  }

  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }
  
  const realIP = request.headers.get('x-real-ip')
  if (realIP) {
    return realIP.trim()
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
  
  // Check if limit exceeded (count is "credits used")
  const remaining = Math.max(0, limit - entry.count)
  const allowed = entry.count < limit
  
  return {
    allowed,
    remaining,
    resetAt: entry.resetAt
  }
}

/**
 * Check whether a request costing N credits is allowed.
 * This is useful when certain actions (e.g., Deep scan) should cost more.
 */
export function checkRateLimitWithCost(
  ip: string,
  limit: number = 5,
  timezone?: string,
  cost: number = 1
): {
  allowed: boolean
  remaining: number
  resetAt: number
  cost: number
  required: number
} {
  const normalizedCost = Number.isFinite(cost) && cost > 0 ? Math.floor(cost) : 1
  const status = checkRateLimit(ip, limit, timezone)
  return {
    ...status,
    allowed: status.remaining >= normalizedCost,
    cost: normalizedCost,
    required: normalizedCost,
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
 * Increment by N credits (default 1).
 */
export function incrementRateLimitBy(ip: string, timezone?: string, cost: number = 1): void {
  const normalizedCost = Number.isFinite(cost) && cost > 0 ? Math.floor(cost) : 1

  const now = Date.now()
  const resetAt = timezone
    ? getMidnightInTimezone(timezone)
    : (() => {
        const tomorrow = new Date()
        tomorrow.setUTCHours(24, 0, 0, 0) // Reset at midnight UTC
        return tomorrow.getTime()
      })()

  const entry = rateLimitStore.get(ip)

  if (!entry || entry.resetAt < now) {
    rateLimitStore.set(ip, {
      count: normalizedCost,
      resetAt,
    })
  } else {
    entry.count += normalizedCost
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

/**
 * Deterministically assign model based on IP address
 * Same IP always gets same model for consistency
 * @param ip Client IP address
 * @returns 'gemini' | 'openai'
 */
export function getModelForIP(ip: string): 'gemini' | 'openai' {
  // Simple hash for deterministic assignment
  let hash = 0
  for (let i = 0; i < ip.length; i++) {
    hash = ((hash << 5) - hash) + ip.charCodeAt(i)
    hash = hash & hash // Convert to 32-bit integer
  }
  // Use hash to assign: 50% Gemini, 50% OpenAI
  // This ensures same IP always gets same model
  return Math.abs(hash) % 2 === 0 ? 'gemini' : 'openai'
}

/**
 * Get current day's Gemini usage count
 * @returns Number of Gemini requests today (resets at UTC midnight)
 */
export function getDailyGeminiUsage(): number {
  const now = Date.now()
  const resetAt = (() => {
    const tomorrow = new Date()
    tomorrow.setUTCHours(24, 0, 0, 0) // Reset at midnight UTC
    return tomorrow.getTime()
  })()
  
  const entry = geminiUsageStore.get('gemini_daily_usage')
  if (!entry || entry.resetAt < now) {
    return 0
  }
  return entry.count
}

/**
 * Increment Gemini usage counter
 * Resets at UTC midnight
 */
export function incrementGeminiUsage(): void {
  const now = Date.now()
  const resetAt = (() => {
    const tomorrow = new Date()
    tomorrow.setUTCHours(24, 0, 0, 0) // Reset at midnight UTC
    return tomorrow.getTime()
  })()
  
  const entry = geminiUsageStore.get('gemini_daily_usage')
  if (!entry || entry.resetAt < now) {
    geminiUsageStore.set('gemini_daily_usage', { count: 1, resetAt })
  } else {
    entry.count++
  }
}

/**
 * Check if IP should be assigned Gemini (considers daily quota)
 * @param ip Client IP address
 * @returns true if IP should get Gemini, false for OpenAI
 */
export function shouldAssignGemini(ip: string): boolean {
  const usage = getDailyGeminiUsage()
  const threshold = parseInt(process.env.GEMINI_QUOTA_WARNING_THRESHOLD || '15', 10)
  
  // If over threshold, force OpenAI for all new assignments
  if (usage >= threshold) {
    return false
  }
  
  // Otherwise, use IP hash
  // Note: With 20 RPD limit, this will primarily assign Gemini to a small subset
  // of IPs for experimental testing. Most users will get OpenAI.
  return getModelForIP(ip) === 'gemini'
}
