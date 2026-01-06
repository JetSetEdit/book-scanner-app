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
 * Check if IP has exceeded rate limit
 * @param ip Client IP address
 * @param limit Maximum scans per day (default: 5)
 * @returns Object with { allowed: boolean, remaining: number, resetAt: number }
 */
export function checkRateLimit(ip: string, limit: number = 5): {
  allowed: boolean
  remaining: number
  resetAt: number
} {
  const now = Date.now()
  const tomorrow = new Date()
  tomorrow.setHours(24, 0, 0, 0) // Reset at midnight
  const resetAt = tomorrow.getTime()
  
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
 */
export function incrementRateLimit(ip: string): void {
  const now = Date.now()
  const tomorrow = new Date()
  tomorrow.setHours(24, 0, 0, 0)
  const resetAt = tomorrow.getTime()
  
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
 */
export function getRateLimitStatus(ip: string, limit: number = 5): {
  count: number
  remaining: number
  limit: number
  resetAt: number
} {
  const now = Date.now()
  const entry = rateLimitStore.get(ip)
  
  if (!entry || entry.resetAt < now) {
    const tomorrow = new Date()
    tomorrow.setHours(24, 0, 0, 0)
    return {
      count: 0,
      remaining: limit,
      limit,
      resetAt: tomorrow.getTime()
    }
  }
  
  return {
    count: entry.count,
    remaining: Math.max(0, limit - entry.count),
    limit,
    resetAt: entry.resetAt
  }
}

