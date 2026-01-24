"use client"

import { useEffect } from "react"
import { toast } from "sonner"

interface BonusClaimInfo {
  claimed: boolean
  bonusAwarded: number
  recipients: string[]
  isMultiLevel?: boolean
  directBonus?: number
  multiLevelBonus?: number
}

interface BonusClaimNotificationProps {
  claimInfo: BonusClaimInfo | null
  onDismiss?: () => void
}

export function BonusClaimNotification({ claimInfo, onDismiss }: BonusClaimNotificationProps) {
  useEffect(() => {
    if (!claimInfo || !claimInfo.claimed) return

    const { bonusAwarded, recipients, isMultiLevel, directBonus, multiLevelBonus } = claimInfo

    // For referred user (simple notification)
    if (recipients.length === 0) {
      toast.success(`🎉 Bonus claimed! You've earned ${bonusAwarded} bonus scans`, {
        duration: 5000,
      })
      onDismiss?.()
      return
    }

    // For referrer (direct or multi-level)
    if (isMultiLevel && directBonus && multiLevelBonus) {
      // Multi-level: show breakdown
      toast.success(
        `🎉 Friend of friend scanned! You earned ${bonusAwarded} bonus scans (2 levels deep)`,
        {
          duration: 5000,
        }
      )
    } else {
      // Direct referral
      toast.success(
        `🎉 Your friend scanned their first book! You earned ${bonusAwarded} bonus scans`,
        {
          duration: 5000,
        }
      )
    }

    onDismiss?.()
  }, [claimInfo, onDismiss])

  return null // This component doesn't render anything, it just triggers toasts
}
