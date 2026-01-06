"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, MessageSquare, Send } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface RateLimitFeedbackDialogProps {
  rateLimitRemaining: number
}

export function RateLimitFeedbackDialog({ rateLimitRemaining }: RateLimitFeedbackDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [feedbackType, setFeedbackType] = useState<string>("")
  const [message, setMessage] = useState("")
  const [email, setEmail] = useState("")
  const [useCase, setUseCase] = useState("")
  const { toast } = useToast()

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
      const response = await fetch('/api/rate-limit-feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          feedbackType,
          message: message.trim(),
          email: email.trim() || undefined,
          useCase: useCase.trim() || undefined,
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

      // Reset form and close dialog
      setFeedbackType("")
      setMessage("")
      setEmail("")
      setUseCase("")
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

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="text-xs"
        >
          <MessageSquare className="h-3.5 w-3.5 mr-1.5" />
          {rateLimitRemaining === 0 ? "Request Access" : "Provide Feedback"}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Rate Limit Feedback</DialogTitle>
          <DialogDescription>
            {rateLimitRemaining === 0 
              ? "You've reached the daily scan limit. Request higher access or provide feedback about the limit."
              : "Have feedback about our rate limits? Let us know!"}
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
                <SelectItem value="request_access">Request Higher Access</SelectItem>
                <SelectItem value="general_feedback">General Feedback</SelectItem>
                <SelectItem value="report_issue">Report an Issue</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {feedbackType === "request_access" && (
            <div className="space-y-2">
              <Label htmlFor="use-case">Use Case (Optional)</Label>
              <Input
                id="use-case"
                placeholder="e.g., Library cataloging, School project, Research..."
                value={useCase}
                onChange={(e) => setUseCase(e.target.value)}
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="message">Message *</Label>
            <textarea
              id="message"
              className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              placeholder={feedbackType === "request_access" 
                ? "Please explain why you need higher access limits..."
                : "Tell us what you think..."}
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
              We'll only use this to respond to your feedback or access request.
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

