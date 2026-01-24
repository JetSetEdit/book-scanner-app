"use client"

import { useState, useEffect } from "react"
import { Gift } from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"

interface ReferralStats {
  activeBonusScans: number
  expiringBonuses: {
    expiringIn2Days: Array<{ amount: number; expiresAt: string }>
    expiringIn1Day: Array<{ amount: number; expiresAt: string }>
  }
}

interface BonusScanBadgeProps {
  className?: string
  variant?: "nav" | "scan-page"
}

export function BonusScanBadge({ className, variant = "nav" }: BonusScanBadgeProps) {
  const [stats, setStats] = useState<ReferralStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
    
    // Refresh stats periodically (every 5 minutes to match cache)
    const interval = setInterval(fetchStats, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  async function fetchStats() {
    try {
      const response = await fetch('/api/referral/stats')
      if (response.ok) {
        const data = await response.json()
        setStats({
          activeBonusScans: data.activeBonusScans || 0,
          expiringBonuses: data.expiringBonuses || { expiringIn2Days: [], expiringIn1Day: [] },
        })
      }
    } catch (error) {
      console.error('Error fetching referral stats:', error)
    } finally {
      setLoading(false)
    }
  }

  // Don't show if no bonuses or still loading
  if (loading || !stats || stats.activeBonusScans === 0) {
    return null
  }

  // Calculate days until expiration for the soonest expiring bonus
  const allExpiring = [
    ...stats.expiringBonuses.expiringIn2Days,
    ...stats.expiringBonuses.expiringIn1Day,
  ]
  
  let daysLeft: number | null = null
  let isUrgent = false
  
  if (allExpiring.length > 0) {
    const soonest = allExpiring.sort((a, b) => 
      new Date(a.expiresAt).getTime() - new Date(b.expiresAt).getTime()
    )[0]
    
    const expiresAt = new Date(soonest.expiresAt).getTime()
    const now = Date.now()
    const diffMs = expiresAt - now
    daysLeft = Math.ceil(diffMs / (24 * 60 * 60 * 1000))
    isUrgent = daysLeft <= 1
  }

  const badgeContent = (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium transition-colors",
        isUrgent
          ? "bg-orange-100 text-orange-700 dark:bg-orange-950/30 dark:text-orange-400 border border-orange-300 dark:border-orange-800"
          : "bg-primary/10 text-primary border border-primary/20",
        variant === "scan-page" && "text-sm px-3 py-1.5",
        className
      )}
    >
      <Gift className="h-3.5 w-3.5" />
      <span>
        Bonus: +{stats.activeBonusScans}
        {daysLeft !== null && daysLeft <= 2 && (
          <span className="ml-1">({daysLeft}d left)</span>
        )}
      </span>
    </div>
  )

  // Make it clickable to navigate to settings
  return (
    <Link href="/settings" className="hover:opacity-80 transition-opacity">
      {badgeContent}
    </Link>
  )
}
