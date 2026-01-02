"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { BookSpineLogo } from "@/components/book-spine-logo"

const STORAGE_KEY = "subtext-beta-onboarding-accepted"

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

  const handleAccept = () => {
    localStorage.setItem(STORAGE_KEY, "true")
    setIsOpen(false)
  }

  // Don't render until mounted to avoid hydration mismatch
  if (!mounted) {
    return null
  }

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent 
        className="max-w-2xl p-8 sm:p-10"
        showCloseButton={false}
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader className="text-center space-y-4">
          <div className="flex justify-center mb-4">
            <BookSpineLogo className="h-16 w-16 text-foreground" />
          </div>
          <DialogTitle className="font-serif text-3xl md:text-4xl font-medium tracking-tight text-foreground">
            Welcome to the Subtext Beta
          </DialogTitle>
          <DialogDescription asChild>
            <div className="text-base text-muted-foreground leading-relaxed max-w-none space-y-6 text-left">
              <p className="font-serif italic text-lg">
                Thanks for helping us build Subtext! Before you start scanning, please agree to our ground rules:
              </p>
              
              <ol className="space-y-4 list-decimal list-inside pl-4">
                <li className="text-foreground">
                  <strong className="font-semibold">We are in Beta:</strong> The AI might make mistakes. Please verify important warnings.
                </li>
                <li className="text-foreground">
                  <strong className="font-semibold">Not Medical Advice:</strong> This tool is for information only, not professional safety advice.
                </li>
                <li className="text-foreground">
                  <strong className="font-semibold">Spoilers:</strong> We try to hide them, but using this app involves some risk of plot details being revealed.
                </li>
              </ol>
              
              <p className="text-muted-foreground font-serif italic pt-2">
                By clicking below, you accept that you use this tool at your own risk.
              </p>
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

