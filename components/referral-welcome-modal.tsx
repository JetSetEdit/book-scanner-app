"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Gift } from "lucide-react"

interface ReferralWelcomeModalProps {
  referralCode: string
  onDismiss: () => void
}

export function ReferralWelcomeModal({ referralCode, onDismiss }: ReferralWelcomeModalProps) {
  const router = useRouter()
  const [autoDismissTimer, setAutoDismissTimer] = useState<NodeJS.Timeout | null>(null)

  useEffect(() => {
    // Auto-dismiss after 10 seconds
    const timer = setTimeout(() => {
      handleDismiss()
    }, 10000)

    setAutoDismissTimer(timer)

    return () => {
      if (timer) clearTimeout(timer)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleDismiss = () => {
    if (autoDismissTimer) {
      clearTimeout(autoDismissTimer)
    }
    // Mark as shown in localStorage to prevent re-showing
    try {
      localStorage.setItem(`referral_welcome_shown_${referralCode}`, 'true')
    } catch (error) {
      // Ignore localStorage errors (private browsing, etc.)
    }
    onDismiss()
  }

  const handleStartScanning = () => {
    handleDismiss()
    router.push('/scan')
  }

  return (
    <Dialog open={true} onOpenChange={(open) => !open && handleDismiss()}>
      <DialogContent 
        className="sm:max-w-md"
        aria-describedby="referral-welcome-description"
        aria-labelledby="referral-welcome-title"
      >
        <DialogHeader>
          <div className="flex items-center justify-center mb-4">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
              <Gift className="h-8 w-8 text-primary" />
            </div>
          </div>
          <DialogTitle id="referral-welcome-title" className="text-center text-2xl">
            You've been invited to Subtext!
          </DialogTitle>
          <DialogDescription id="referral-welcome-description" className="text-center pt-2">
            Scan your first book to unlock 3 bonus scans for your friend
          </DialogDescription>
        </DialogHeader>
        
        <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={handleDismiss}
            className="w-full sm:w-auto"
            aria-label="Continue to Subtext"
          >
            Continue to Subtext
          </Button>
          <Button
            onClick={handleStartScanning}
            className="w-full sm:w-auto"
            aria-label="Start scanning books"
          >
            Start Scanning
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
