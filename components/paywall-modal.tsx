"use client"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

interface PaywallModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title?: string
  subtitle?: string
}

/**
 * Shown when user has reached their free-tier daily scan limit.
 * "Free triage. Pay for depth." See OpenSpec add-positioning-and-monetization-strategy.
 */
export function PaywallModal({
  open,
  onOpenChange,
  title = "Free tier complete",
  subtitle = "You've used your free scans for today. Upgrade for deep analysis and more scans.",
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{subtitle}</DialogDescription>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          Free triage. Pay for depth.
        </p>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
