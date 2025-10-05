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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { SpiceRating } from "@/components/spice-rating"
import { Plus, AlertCircle } from "lucide-react"

interface AddSpiceRatingDialogProps {
  bookId: string
  onSubmit: (data: {
    spiceLevel: number
    ageRating: string
  }) => Promise<{ error?: string }>
  trigger?: React.ReactNode
}

const ageRatings = [
  { value: "G", label: "G - General Audiences" },
  { value: "PG", label: "PG - Parental Guidance" },
  { value: "PG-13", label: "PG-13 - Parents Strongly Cautioned" },
  { value: "R", label: "R - Restricted" },
  { value: "18+", label: "18+ - Adults Only" },
]

export function AddSpiceRatingDialog({ bookId, onSubmit, trigger }: AddSpiceRatingDialogProps) {
  const [open, setOpen] = useState(false)
  const [spiceLevel, setSpiceLevel] = useState<number | null>(null)
  const [ageRating, setAgeRating] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (spiceLevel === null || !ageRating) {
      setError("Please select both spice level and age rating")
      return
    }

    setIsSubmitting(true)

    try {
      const result = await onSubmit({ spiceLevel, ageRating })

      if (result.error) {
        setError(result.error)
      } else {
        // Success - reset form and close dialog
        setSpiceLevel(null)
        setAgeRating("")
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
            <Plus className="mr-2 h-4 w-4" />
            Rate Spice Level
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Rate Spice Level</DialogTitle>
          <DialogDescription>Help others understand the content intensity of this book</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-3">
            <Label>Spice Level</Label>
            <div className="space-y-2">
              {[0, 1, 2, 3, 4, 5].map((level) => (
                <button
                  key={level}
                  type="button"
                  onClick={() => setSpiceLevel(level)}
                  className={`w-full p-3 rounded-lg border-2 transition-colors ${
                    spiceLevel === level ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <SpiceRating level={level} showLabel />
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="age-rating">Age Rating</Label>
            <Select value={ageRating} onValueChange={setAgeRating}>
              <SelectTrigger id="age-rating">
                <SelectValue placeholder="Select age rating" />
              </SelectTrigger>
              <SelectContent>
                {ageRatings.map((rating) => (
                  <SelectItem key={rating.value} value={rating.value}>
                    {rating.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
              {isSubmitting ? "Submitting..." : "Submit Rating"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
