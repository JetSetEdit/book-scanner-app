"use client"

import { useEffect, useState } from "react"
import { Zap, Sparkles } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"

interface SparksProfile {
  sparks: {
    total_sparks: number
    scans_count: number
    pivots_count: number
    validations_count: number
  }
  badges: Array<{
    badge: {
      code: string
      name: string
      description: string
      icon_name: string | null
    }
    earned_at: string
  }>
}

export function SparksCounter() {
  const [profile, setProfile] = useState<SparksProfile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchSparksProfile()
  }, [])

  const fetchSparksProfile = async () => {
    try {
      const response = await fetch('/api/sparks/profile', {
        // Suppress error logging for 401s (expected when not logged in)
        signal: AbortSignal.timeout(5000) // 5 second timeout
      })
      if (response.ok) {
        const data = await response.json()
        setProfile(data)
      } else if (response.status === 401) {
        // User not authenticated - this is expected, silently fail
        setProfile(null)
      }
    } catch (error) {
      // Silently fail - sparks is optional/legacy feature
      if (error instanceof Error && error.name !== 'AbortError') {
        // Only log non-timeout errors in dev
        if (process.env.NODE_ENV === 'development') {
          console.debug('Sparks profile fetch failed (optional feature):', error)
        }
      }
      setProfile(null)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2">
        <Skeleton className="h-6 w-20" />
        <Skeleton className="h-6 w-6 rounded-full" />
      </div>
    )
  }

  if (!profile) {
    return null // Don't show if user not logged in or no profile
  }

  const { total_sparks, scans_count, pivots_count } = profile.sparks
  const recentBadges = profile.badges.slice(0, 2) // Show up to 2 most recent badges

  return (
    <div className="flex items-center gap-3">
      {/* Sparks Counter */}
      <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-lg">
        <Zap className="h-4 w-4 text-yellow-600 fill-yellow-600" />
        <span className="text-sm font-semibold text-yellow-900">
          {total_sparks.toLocaleString()}
        </span>
        <span className="text-xs text-yellow-700">Sparks</span>
      </div>

      {/* Recent Badges */}
      {recentBadges.length > 0 && (
        <div className="flex items-center gap-1.5">
          {recentBadges.map((userBadge) => (
            <Badge
              key={userBadge.badge.code}
              variant="secondary"
              className="gap-1 px-2 py-1"
              title={userBadge.badge.description}
            >
              <Sparkles className="h-3 w-3" />
              <span className="text-xs">{userBadge.badge.name}</span>
            </Badge>
          ))}
        </div>
      )}
    </div>
  )
}

