"use client"

import { useState, useEffect } from "react"
import { usePathname } from "next/navigation"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, MessageSquare, Send } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { APP_VERSION } from "@/lib/config/version"

interface FeedbackContext {
  bookId?: string
  bookTitle?: string
  bookAuthor?: string
  bookIsbn?: string
  warningsCount?: number
  analysisStatus?: string
  metadataIssues?: {
    missingCover?: boolean
    missingDescription?: boolean
  }
}

interface FeedbackDialogProps {
  trigger?: React.ReactNode
  pageUrl?: string
  defaultFeedbackType?: string // Optional: override auto-detection (e.g., "content_issue" for book pages)
  context?: FeedbackContext // Optional: context information to prefill (book info, etc.)
}

/**
 * Automatically detects the best feedback type based on current page/route
 */
function getSmartFeedbackType(pathname: string | null, override?: string): string {
  // If override is provided, use it
  if (override) return override

  if (!pathname) return "general_feedback"

  // Book page - likely content or metadata issues
  if (pathname.startsWith('/book/')) {
    return "content_issue" // Default to content issue, but user can change to metadata_issue
  }

  // Scan page - likely performance or bug issues
  if (pathname.startsWith('/scan')) {
    return "performance_issue" // Scan-related issues are often performance
  }

  // Home page - general feedback or feature requests
  if (pathname === '/') {
    return "general_feedback"
  }

  // Collection/bookshelf - could be data quality or UI issues
  if (pathname.startsWith('/collection') || pathname.startsWith('/bookshelf')) {
    return "data_quality"
  }

  // Default to general feedback for other pages
  return "general_feedback"
}

/**
 * Generates a prefilled message based on context and feedback type
 */
function generatePrefilledMessage(feedbackType: string, context?: FeedbackContext, pathname?: string | null): string {
  if (!context) return ""

  const parts: string[] = []

  // Book-specific context
  if (context.bookTitle) {
    parts.push(`Book: "${context.bookTitle}"`)
    if (context.bookAuthor) {
      parts.push(`by ${context.bookAuthor}`)
    }
    if (context.bookIsbn) {
      parts.push(`(ISBN: ${context.bookIsbn})`)
    }
  }

  // Add context based on feedback type
  if (feedbackType === 'content_issue' || feedbackType === 'warning_accuracy') {
    if (context.warningsCount !== undefined) {
      parts.push(`\nCurrent warnings: ${context.warningsCount}`)
    }
    parts.push(`\n\nIssue with content warnings:`)
  } else if (feedbackType === 'metadata_issue') {
    parts.push(`\n\nIssue with book metadata:`)
    if (context.metadataIssues?.missingCover) {
      parts.push(`- Missing cover image`)
    }
    if (context.metadataIssues?.missingDescription) {
      parts.push(`- Missing description`)
    }
  } else if (feedbackType === 'performance_issue') {
    if (pathname?.startsWith('/scan')) {
      parts.push(`\n\nPerformance issue on scan page:`)
    } else {
      parts.push(`\n\nPerformance issue:`)
    }
  } else if (feedbackType === 'bug_report') {
    parts.push(`\n\nBug description:`)
  } else if (feedbackType === 'feature_request') {
    parts.push(`\n\nFeature request:`)
  }

  return parts.join(' ')
}

export function FeedbackDialog({ trigger, pageUrl, defaultFeedbackType, context }: FeedbackDialogProps) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [smartFeedbackType] = useState(() => getSmartFeedbackType(pathname, defaultFeedbackType))
  const [feedbackType, setFeedbackType] = useState<string>(smartFeedbackType)
  const [message, setMessage] = useState("")
  const [email, setEmail] = useState("")
  const { toast } = useToast()

  // Update feedback type and prefill message when dialog opens
  useEffect(() => {
    if (open) {
      const newType = getSmartFeedbackType(pathname, defaultFeedbackType)
      setFeedbackType(newType)
      // Prefill message with context (only if message is empty)
      if (!message.trim()) {
        const prefilled = generatePrefilledMessage(newType, context, pathname)
        if (prefilled) {
          setMessage(prefilled)
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, pathname, defaultFeedbackType])

  // Update message when feedback type changes (if we have context and message was prefilled)
  useEffect(() => {
    if (open && context && message.trim()) {
      // Check if current message looks like a prefilled message
      const currentPrefilled = generatePrefilledMessage(feedbackType, context, pathname)
      const prevTypes = ['content_issue', 'metadata_issue', 'warning_accuracy', 'performance_issue', 'bug_report', 'feature_request']
      const mightBePrefilled = prevTypes.some(type => {
        const typePrefilled = generatePrefilledMessage(type, context, pathname)
        return message.trim() === typePrefilled.trim()
      })
      
      // If message matches a previous prefilled message, update it for new type
      if (mightBePrefilled && currentPrefilled) {
        setMessage(currentPrefilled)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [feedbackType, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!feedbackType || !message.trim()) {
      toast({
        title: "Missing information",
        description: "Please select a feedback type and provide a message.",
        variant: "destructive"
      })
      return
    }

    setLoading(true)
    
    try {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          feedbackType,
          message: message.trim(),
          email: email.trim() || undefined,
          pageUrl: pageUrl || (typeof window !== 'undefined' ? window.location.href : undefined),
          context: context ? {
            bookId: context.bookId,
            bookTitle: context.bookTitle,
            bookAuthor: context.bookAuthor,
            bookIsbn: context.bookIsbn,
            warningsCount: context.warningsCount,
            analysisStatus: context.analysisStatus,
            metadataIssues: context.metadataIssues,
          } : undefined,
          userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : undefined,
          appVersion: APP_VERSION,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit feedback')
      }

      toast({
        title: "Feedback submitted",
        description: data.message || "Thank you for your feedback! We'll review it soon.",
      })

      // Reset form and close dialog (preserve smart default)
      const resetType = getSmartFeedbackType(pathname, defaultFeedbackType)
      setFeedbackType(resetType)
      setMessage("") // Clear message - will be prefilled again when dialog opens
      setEmail("")
      setOpen(false)
    } catch (error) {
      console.error('Error submitting feedback:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to submit feedback. Please try again.",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const defaultTrigger = (
    <Button
      variant="ghost"
      size="sm"
      className="text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-transparent"
    >
      <MessageSquare className="h-3.5 w-3.5 mr-1.5" />
      Feedback
    </Button>
  )

  // Reset form when dialog closes
  useEffect(() => {
    if (!open) {
      // Reset to smart defaults when dialog closes
      const resetType = getSmartFeedbackType(pathname, defaultFeedbackType)
      setFeedbackType(resetType)
      setMessage("")
      setEmail("")
    }
  }, [open, pathname, defaultFeedbackType])

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Send Feedback</DialogTitle>
          <DialogDescription>
            We'd love to hear your thoughts, suggestions, or report any issues you've encountered.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="feedback-type">Feedback Type *</Label>
            <Select value={feedbackType} onValueChange={setFeedbackType}>
              <SelectTrigger id="feedback-type">
                <SelectValue placeholder="Select feedback type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="content_issue">Content Issue (Wrong/Missing Warnings)</SelectItem>
                <SelectItem value="metadata_issue">Book Metadata Issue (Title/Author/Cover)</SelectItem>
                <SelectItem value="warning_accuracy">Warning Accuracy (Severity/Details Wrong)</SelectItem>
                <SelectItem value="bug_report">Bug Report</SelectItem>
                <SelectItem value="performance_issue">Performance Issue (Slow Scan/Loading)</SelectItem>
                <SelectItem value="ui_ux_feedback">UI/UX Feedback</SelectItem>
                <SelectItem value="accessibility_issue">Accessibility Issue</SelectItem>
                <SelectItem value="feature_request">Feature Request</SelectItem>
                <SelectItem value="data_quality">Data Quality Issue</SelectItem>
                <SelectItem value="general_feedback">General Feedback</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="message">Message *</Label>
            <textarea
              id="message"
              className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              placeholder="Tell us what you think, what you'd like to see, or any issues you've encountered..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email (Optional)</Label>
            <Input
              id="email"
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              We'll only use this to respond to your feedback if needed.
            </p>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
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
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Submit
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

