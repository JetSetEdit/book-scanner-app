"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { BookSpineLogo } from "@/components/book-spine-logo"

const STORAGE_KEY = "subtext-beta-onboarding-accepted"
const DISCLAIMER_VERSION = "2026-01-08-v1"

export function BetaOnboardingModal() {
  const [isOpen, setIsOpen] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    // Check if user has already accepted
    const hasAccepted = localStorage.getItem(STORAGE_KEY) === "true"
    if (!hasAccepted) {
      setIsOpen(true)
    }
  }, [])

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
  if (!mounted) {
    return null
  }

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent 
        className="max-w-2xl p-8 sm:p-10 max-h-[90vh] overflow-y-auto"
        showCloseButton={false}
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader className="text-center space-y-4">
          <div className="flex justify-center mb-4">
            <BookSpineLogo className="h-16 w-16 text-foreground" />
          </div>
          <DialogTitle className="font-serif text-3xl md:text-4xl font-medium tracking-tight text-foreground">
            Welcome to Subtext
          </DialogTitle>
          <DialogDescription asChild>
            <div className="text-base text-muted-foreground leading-relaxed max-w-none space-y-6 text-left">
              <p className="font-serif italic text-lg text-center">
                Discover content warnings and themes in books using AI-powered analysis.
              </p>
              
              <div className="disclaimer-content">
                <p className="mb-4">Before you start scanning, please review these important points:</p>
                
                <ol className="space-y-4 list-decimal list-inside pl-4 text-foreground">
                  <li>
                    <strong className="font-semibold text-[#8B4513]">We're in Public Beta:</strong> Our AI analysis is continuously improving. 
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
                    omissions, or consequences arising from your reliance on AI-generated content. 
                    You use this tool at your own discretion and risk.
                  </li>
                </ol>
                
                <p className="consent-statement font-serif italic pt-4 text-muted-foreground">
                  By clicking below, you acknowledge you have read and accept these terms, 
                  and agree to use Subtext at your own discretion.
                </p>
              </div>
            </div>
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex justify-center pt-6">
          <Button
            onClick={handleAccept}
            size="lg"
            className="h-12 px-8 text-base font-semibold bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all"
          >
            I Understand & Agree
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

