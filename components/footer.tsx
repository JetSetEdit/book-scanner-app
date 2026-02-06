"use client"

import Link from "next/link"
import { APP_VERSION_LABEL, APP_VERSION, APP_BUILD_DATE, APP_BUILD_ID } from "@/lib/config/version"
import { getVariantConfig } from "@/lib/config/variants"
import { usePathname } from "next/navigation"
import { useState, useEffect } from "react"
import { FeedbackDialog } from "@/components/feedback-dialog"

export function Footer() {
  const pathname = usePathname()
  const [isComfortRead, setIsComfortRead] = useState(false)
  const [isDismissed, setIsDismissed] = useState(false)
  const v = getVariantConfig()

  // Check if we're on a book page and if it's a Comfort Read
  useEffect(() => {
    if (pathname?.startsWith('/book/')) {
      // Check for Comfort Read badge in the DOM (hacky but works without prop drilling)
      const checkComfortRead = () => {
        const comfortReadBadge = document.querySelector('[data-comfort-read="true"]')
        setIsComfortRead(!!comfortReadBadge)
      }

      // Check after a short delay to allow page to render
      const timer = setTimeout(checkComfortRead, 100)
      checkComfortRead() // Also check immediately

      return () => clearTimeout(timer)
    } else {
      setIsComfortRead(false)
    }
  }, [pathname])

  // Load dismissed state from localStorage
  useEffect(() => {
    const dismissed = localStorage.getItem('beta-disclaimer-dismissed') === 'true'
    setIsDismissed(dismissed)
  }, [])

  const handleDismiss = () => {
    localStorage.setItem('beta-disclaimer-dismissed', 'true')
    setIsDismissed(true)
  }

  return (
    <footer className="border-t border-border bg-card/30 mt-auto pb-20 md:pb-8">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <p className="text-xs text-muted-foreground text-center leading-relaxed max-w-2xl mx-auto mb-4">
            Subtext is in public beta—warnings are automated with human review in progress. Use your own judgment and let us know if something looks off.
          </p>

          {/* Beta Disclaimer - Contextualized for Comfort Read */}
          {!isDismissed && (
            <div className="text-xs text-muted-foreground/70 text-center mb-4">
              <div className="flex items-center justify-center gap-2 flex-wrap">
                {isComfortRead ? (
                  <p className="italic">
                    {v.footer.comfortReadPrefix} • {APP_VERSION_LABEL}
                  </p>
                ) : (
                  <p>
                    {APP_VERSION_LABEL} • {v.footer.betaDisclaimer}
                  </p>
                )}
                <button
                  onClick={handleDismiss}
                  className="text-muted-foreground/50 hover:text-muted-foreground transition-colors underline underline-offset-2"
                  aria-label="Dismiss beta disclaimer"
                >
                  Dismiss
                </button>
              </div>
            </div>
          )}

          {v.flags?.showAffiliate !== false && (
            <p className="text-xs text-muted-foreground text-center leading-relaxed max-w-2xl mx-auto mb-4">
              Subtext is a participant in the Amazon Services LLC Associates Program. As an Amazon Associate, we earn from qualifying purchases.
            </p>
          )}
          <div className="text-center space-y-2">
            <div className="flex flex-wrap items-center justify-center gap-4 text-xs">
              {v.flags?.showTransparencyLink !== false && (
                <>
                  <Link href="/transparency" className="text-muted-foreground hover:text-foreground transition-colors underline underline-offset-2">
                    Learn how we work
                  </Link>
                  <span className="text-muted-foreground/40">•</span>
                </>
              )}
              <Link href="/terms" className="text-muted-foreground hover:text-foreground transition-colors underline underline-offset-2">
                Terms of Service
              </Link>
              <span className="text-muted-foreground/40">•</span>
              <Link href="/privacy" className="text-muted-foreground hover:text-foreground transition-colors underline underline-offset-2">
                Privacy Policy
              </Link>
              <span className="text-muted-foreground/40">•</span>
              <FeedbackDialog />
            </div>
            <div className="text-xs text-muted-foreground/60">
              {APP_VERSION_LABEL} (v{APP_VERSION}) • Build {APP_BUILD_ID} • Updated {APP_BUILD_DATE}
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}

