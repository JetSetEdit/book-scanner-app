"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { ReferralWelcomeModal } from "@/components/referral-welcome-modal"

/**
 * Client component wrapper for referral welcome modal detection
 * Detects referral code from URL query params and shows modal
 * Uses localStorage to prevent re-showing after dismiss
 */
export function ReferralWelcomeModalWrapper() {
  const searchParams = useSearchParams()
  const [showReferralModal, setShowReferralModal] = useState(false)
  const [referralCode, setReferralCode] = useState<string | null>(null)

  useEffect(() => {
    // Check for referral code in URL query params
    // The /share/[code] route adds ?ref=code to the redirect
    const refCode = searchParams.get('ref')
    
    if (refCode) {
      // Check if modal was already shown for this code
      try {
        const alreadyShown = localStorage.getItem(`referral_welcome_shown_${refCode}`)
        if (!alreadyShown) {
          setReferralCode(refCode)
          setShowReferralModal(true)
          // Clean URL by removing query param after a brief delay to ensure modal renders
          setTimeout(() => {
            if (typeof window !== 'undefined') {
              const url = new URL(window.location.href)
              url.searchParams.delete('ref')
              window.history.replaceState({}, '', url.pathname + url.search)
            }
          }, 100)
        }
      } catch (error) {
        // Ignore localStorage errors (private browsing, etc.)
        // Still show modal if we can't check localStorage
        setReferralCode(refCode)
        setShowReferralModal(true)
        // Clean URL
        setTimeout(() => {
          if (typeof window !== 'undefined') {
            const url = new URL(window.location.href)
            url.searchParams.delete('ref')
            window.history.replaceState({}, '', url.pathname + url.search)
          }
        }, 100)
      }
    }
  }, [searchParams])

  const handleDismissModal = () => {
    setShowReferralModal(false)
  }

  if (!showReferralModal || !referralCode) {
    return null
  }

  return (
    <ReferralWelcomeModal
      referralCode={referralCode}
      onDismiss={handleDismissModal}
    />
  )
}
