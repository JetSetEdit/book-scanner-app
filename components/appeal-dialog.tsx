"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, Flag, CheckCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export interface WarningOption {
  id: string
  label: string
}

interface AppealDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  bookId: string
  isbn: string
  bookTitle?: string
  warnings: WarningOption[]
  /** When opened from a per-warning "Report", pre-select this warning. */
  initialWarningIds?: string[]
}

const SLA_MESSAGE =
  "We'll acknowledge within one business day and resolve within five business days. The disputed warning(s) are hidden until we complete the review."

export function AppealDialog({
  open,
  onOpenChange,
  bookId,
  isbn,
  bookTitle,
  warnings,
  initialWarningIds = [],
}: AppealDialogProps) {
  const [selectedWarningIds, setSelectedWarningIds] = useState<string[]>([])
  const [wholeBook, setWholeBook] = useState(false)
  const [message, setMessage] = useState("")
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState<{ ticketNumber: string } | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    if (open) {
      setSelectedWarningIds(initialWarningIds)
      setWholeBook(initialWarningIds.length === 0 && warnings.length === 0)
      setMessage("")
      setEmail("")
      setSuccess(null)
    }
  }, [open, initialWarningIds, warnings.length])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!message.trim()) {
      toast({
        title: "Message required",
        description: "Please describe what's wrong.",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    setSuccess(null)
    try {
      const res = await fetch("/api/appeals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookId,
          isbn,
          message: message.trim(),
          contentWarningIds: wholeBook ? [] : selectedWarningIds,
          email: email.trim() || undefined,
        }),
      })
      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || "Failed to submit")
      }

      setSuccess({ ticketNumber: data.ticketNumber })
      toast({
        title: "Report submitted",
        description: `Ticket ${data.ticketNumber}. ${SLA_MESSAGE}`,
      })
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Something went wrong. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleClose = (open: boolean) => {
    if (!open) setSuccess(null)
    onOpenChange(open)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Flag className="h-4 w-4" />
            Report a mistake
          </DialogTitle>
          <DialogDescription>
            Report a content warning that&apos;s wrong (e.g. flagged for something the book doesn&apos;t contain).
            We&apos;ll hide the disputed warning(s) until we complete the review.
          </DialogDescription>
        </DialogHeader>

        {success ? (
          <div className="space-y-4 py-2">
            <div className="flex items-start gap-3 rounded-lg border border-border bg-muted/50 p-4">
              <CheckCircle className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
              <div className="space-y-1 text-sm">
                <p className="font-medium">Ticket: {success.ticketNumber}</p>
                <p className="text-muted-foreground">{SLA_MESSAGE}</p>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={() => handleClose(false)}>Done</Button>
            </DialogFooter>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {bookTitle && (
              <p className="text-sm text-muted-foreground">
                Book: {bookTitle}
              </p>
            )}

            <div className="space-y-2">
              <Label>Which warning(s) are wrong? (optional)</Label>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={wholeBook}
                  onChange={(e) => {
                    setWholeBook(e.target.checked)
                    if (e.target.checked) setSelectedWarningIds([])
                  }}
                  className="rounded border-input"
                />
                The whole analysis is wrong
              </label>
              {!wholeBook && warnings.length > 0 && (
                <div className="max-h-40 overflow-y-auto space-y-2 rounded-md border border-input p-3">
                  {warnings.map((w) => (
                    <label key={w.id} className="flex items-center gap-2 text-sm cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedWarningIds.includes(w.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedWarningIds((prev) => [...prev, w.id])
                          } else {
                            setSelectedWarningIds((prev) => prev.filter((id) => id !== w.id))
                          }
                        }}
                        className="rounded border-input"
                      />
                      <span className="line-clamp-2">{w.label}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="appeal-message">What&apos;s wrong? *</Label>
              <textarea
                id="appeal-message"
                className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="e.g. This book is not flagged for sexual violence but was incorrectly tagged."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="appeal-email">Email (optional)</Label>
              <Input
                id="appeal-email"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                We&apos;ll only use this to follow up on your report.
              </p>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => handleClose(false)}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  "Submit report"
                )}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
