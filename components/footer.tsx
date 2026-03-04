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

  useEffect(() => {
    if (pathname?.startsWith('/book/')) {
      const checkComfortRead = () => {
        const comfortReadBadge = document.querySelector('[data-comfort-read="true"]')
        setIsComfortRead(!!comfortReadBadge)
      }
      const timer = setTimeout(checkComfortRead, 100)
      checkComfortRead()
      return () => clearTimeout(timer)
    } else {
      setIsComfortRead(false)
    }
  }, [pathname])

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
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Single link to knowledge hub (how we work, FAQ, press, privacy, terms all live there) */}
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-1 text-xs">
            <nav aria-label="Footer">
              <Link href="/help" className="text-muted-foreground hover:text-foreground transition-colors underline underline-offset-2">
                Help &amp; policies
              </Link>
              <span className="text-muted-foreground/40 mx-2">·</span>
              <FeedbackDialog />
            </nav>
          </div>

          {/* Beta / version line */}
          {!isDismissed && (
            <div className="text-center">
              <p className="text-xs text-muted-foreground/80">
                {isComfortRead ? (
                  <span className="italic">{v.footer.comfortReadPrefix} • {APP_VERSION_LABEL}</span>
                ) : (
                  <>
                    <span>{APP_VERSION_LABEL} • {v.footer.betaDisclaimer}</span>
                    <button
                      onClick={handleDismiss}
                      className="ml-1 text-muted-foreground/50 hover:text-muted-foreground transition-colors underline underline-offset-2"
                      aria-label="Dismiss beta disclaimer"
                    >
                      Dismiss
                    </button>
                  </>
                )}
              </p>
            </div>
          )}

          <p className="text-xs text-muted-foreground text-center leading-relaxed max-w-2xl mx-auto">
            Subtext is in public beta—warnings are automated with human review in progress. Use your own judgment and let us know if something looks off.
          </p>

          {v.flags?.showAffiliate !== false && (
            <p className="text-xs text-muted-foreground/70 text-center max-w-2xl mx-auto">
              Subtext is a participant in the Amazon Services LLC Associates Program. As an Amazon Associate, we earn from qualifying purchases.
            </p>
          )}

          <p className="text-xs text-muted-foreground/60 text-center">
            {APP_VERSION_LABEL} (v{APP_VERSION}) · Build {APP_BUILD_ID} · {APP_BUILD_DATE}
          </p>
        </div>
      </div>
    </footer>
  )
}
