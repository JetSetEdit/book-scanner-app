"use client"

import { useState, useEffect, useRef } from "react"
import { usePathname } from "next/navigation"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { BookSpineLogo } from "@/components/book-spine-logo"
import { getVariantConfig, getVariantId } from "@/lib/config/variants"

const STORAGE_KEY = "subtext-beta-onboarding-accepted"
const DISCLAIMER_VERSION = "2026-01-08-v1"

export function BetaOnboardingModal() {
  const [isOpen, setIsOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const hasCheckedRef = useRef(false)
  const pathname = usePathname()

  useEffect(() => {
    // Prevent double-checking in React Strict Mode
    if (hasCheckedRef.current) return
    hasCheckedRef.current = true

    // Don't show modal on the Welcome page (access gate)
    if (pathname === '/welcome') return

    setMounted(true)
    // Check if user has already accepted
    const hasAccepted = localStorage.getItem(STORAGE_KEY) === "true"
    if (!hasAccepted) {
      setIsOpen(true)
    }
  }, [pathname])

  const handleAccept = async () => {
    const consentData = {
      timestamp: new Date().toISOString(),
      disclaimerVersion: DISCLAIMER_VERSION,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
    }
    
    // Log to local storage for the session
    localStorage.setItem(STORAGE_KEY, "true")
    localStorage.setItem('subtext_consent', JSON.stringify(consentData))
    
    // Optional: Send to analytics/backend
    try {
      await fetch('/api/log-consent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(consentData),
      })
    } catch (error) {
      // Don't block the user if logging fails
      if (process.env.NODE_ENV === 'development') {
        console.error('Failed to log consent:', error)
      }
    }
    
    // Close modal and continue
    setIsOpen(false)
  }

  // Don't render until mounted to avoid hydration mismatch
  if (!mounted || !isOpen) {
    return null
  }

  const v = getVariantConfig()
  const isLite = getVariantId() === 'lite'
  const modalSummary = v.footer.betaModalSummary || 'Content warnings are generated from book information. Beta—results may vary. Use your judgment.'

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent 
        className="max-w-2xl p-0 max-h-[min(90vh,720px)] flex flex-col overflow-hidden gap-0"
        showCloseButton={false}
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-6 py-8 sm:px-10 sm:py-10">
        <DialogHeader className="text-center space-y-4">
          <div className="flex justify-center mb-4">
            <BookSpineLogo className="h-16 w-16 text-foreground" />
          </div>
          <DialogTitle className="font-serif text-3xl md:text-4xl font-medium tracking-tight text-foreground">
            Welcome to {v.name}
          </DialogTitle>
          <DialogDescription asChild>
            <div className="text-base text-muted-foreground leading-relaxed max-w-none space-y-6 text-left pb-2">
              {isLite ? (
                <>
                  <p className="font-serif italic text-lg text-center">
                    {modalSummary}
                  </p>
                  <p className="consent-statement font-serif italic pt-4 text-muted-foreground text-center">
                    By clicking below, you acknowledge you have read this and agree to use {v.name} at your own discretion.
                  </p>
                </>
              ) : (
              <>
              <p className="font-serif italic text-lg text-center">
                Discover content warnings and themes in books using automated analysis.
              </p>
              
              <div className="disclaimer-content">
                <p className="mb-4">Before you start scanning, please review these important points:</p>
                
                <ol className="space-y-4 list-decimal list-inside pl-4 text-foreground">
                  <li>
                    <strong className="font-semibold text-[#8B4513]">We're in Public Beta:</strong> Our automated analysis is continuously improving. 
                    Results may vary, and we recommend verifying important warnings independently.
                  </li>
                  
                  <li>
                    <strong className="font-semibold text-[#8B4513]">Not Medical or Safety Advice:</strong> Subtext is an informational tool only. 
                    It does not replace professional mental health advice or personal content screening.
                  </li>
                  
                  <li>
                    <strong className="font-semibold text-[#8B4513]">Spoiler Warning:</strong> While we avoid major plot reveals, some thematic 
                    details may hint at story elements.
                  </li>
                  
                  <li>
                    <strong className="font-semibold text-[#8B4513]">Help Us Improve:</strong> Found an error or missing warning? Use the 
                    <strong> Feedback</strong> button at the bottom of any book page to report issues, 
                    suggest corrections, or contribute your reading experience.
                  </li>
                  
                  <li>
                    <strong className="font-semibold text-[#8B4513]">Content Attribution:</strong> Book metadata is sourced from publicly 
                    available databases. If you believe content is incorrectly attributed or requires 
                    correction, please contact us via the Feedback link.
                  </li>
                  
                  <li>
                    <strong className="font-semibold text-[#8B4513]">Limitation of Liability:</strong> We disclaim all liability for errors, 
                    omissions, or consequences arising from your reliance on automated content. 
                    You use this tool at your own discretion and risk.
                  </li>
                </ol>
                
                <p className="consent-statement font-serif italic pt-4 text-muted-foreground">
                  By clicking below, you acknowledge you have read and accept these terms, 
                  and agree to use Subtext at your own discretion.
                </p>
              </div>
              </>
              )}
            </div>
          </DialogDescription>
        </DialogHeader>
        </div>

        <div className="shrink-0 border-t border-border/60 bg-background px-6 py-4 sm:px-10 sm:py-5">
          <p className="mb-3 text-center text-xs text-muted-foreground sm:hidden">
            Scroll above to read the full terms, then accept below.
          </p>
          <div className="flex justify-center">
            <Button
              onClick={handleAccept}
              size="lg"
              className="h-12 w-full sm:w-auto px-8 text-base font-semibold bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all"
            >
              I Understand & Agree
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

