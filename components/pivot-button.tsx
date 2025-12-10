"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { ArrowRight, Sparkles } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface PivotButtonProps {
  bookId: string
  isbn: string
  onPivot?: () => void
}

/**
 * Pivot Button Component
 * 
 * Allows users to indicate they're choosing not to read a book based on warnings.
 * This awards sparks and tracks progress toward the "Pivot Prodigy" badge.
 */
export function PivotButton({ bookId, isbn, onPivot }: PivotButtonProps) {
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const handlePivot = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/sparks/pivot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookId,
          isbn,
          pivotReason: 'user_choice', // Could be enhanced with specific reasons
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to record pivot')
      }

      // Show success toast
      toast({
        title: "✨ Smart Pivot!",
        description: "You earned 15 Sparks for making a safe reading choice!",
      })

      // Call optional callback
      onPivot?.()
    } catch (error) {
      console.error('Error recording pivot:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to record pivot",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handlePivot}
      disabled={loading}
      className="gap-2"
    >
      <ArrowRight className="h-4 w-4" />
      <span>Choose Another Book</span>
      {loading && <Sparkles className="h-3 w-3 animate-pulse" />}
    </Button>
  )
}

