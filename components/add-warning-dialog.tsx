"use client"

import type React from "react"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertTriangle, AlertCircle } from "lucide-react"

interface AddWarningDialogProps {
  bookId: string
  onSubmit: (data: {
    category: string
    description: string
    severity: string
  }) => Promise<{ error?: string }>
  trigger?: React.ReactNode
}

const categories = [
  { value: "violence", label: "Violence" },
  { value: "sexual_content", label: "Sexual Content" },
  { value: "substance_abuse", label: "Substance Abuse" },
  { value: "mental_health", label: "Mental Health" },
  { value: "death", label: "Death" },
  { value: "abuse", label: "Abuse" },
  { value: "discrimination", label: "Discrimination" },
  { value: "other", label: "Other" },
]

const severities = [
  { value: "mild", label: "Mild" },
  { value: "moderate", label: "Moderate" },
  { value: "severe", label: "Severe" },
]

export function AddWarningDialog({ bookId, onSubmit, trigger }: AddWarningDialogProps) {
  const [open, setOpen] = useState(false)
  const [category, setCategory] = useState("")
  const [description, setDescription] = useState("")
  const [severity, setSeverity] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!category || !description.trim() || !severity) {
      setError("Please fill in all fields")
      return
    }

    setIsSubmitting(true)

    try {
      const result = await onSubmit({ category, description, severity })

      if (result.error) {
        setError(result.error)
      } else {
        // Success - reset form and close dialog
        setCategory("")
        setDescription("")
        setSeverity("")
        setOpen(false)
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" className="w-full bg-transparent">
            <AlertTriangle className="mr-2 h-4 w-4" />
            Add Content Warning
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add Content Warning</DialogTitle>
          <DialogDescription>
            Help others by sharing content warnings for this book. Be specific and avoid spoilers.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger id="category">
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="severity">Severity</Label>
            <Select value={severity} onValueChange={setSeverity}>
              <SelectTrigger id="severity">
                <SelectValue placeholder="Select severity" />
              </SelectTrigger>
              <SelectContent>
                {severities.map((sev) => (
                  <SelectItem key={sev.value} value={sev.value}>
                    {sev.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Describe the content warning without spoilers..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground">Be specific but avoid major spoilers</p>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Submitting..." : "Submit Warning"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
