"use client"

import { Button } from "@/components/ui/button"
import { ThumbsUp, ThumbsDown } from "lucide-react"
import { validateWarning } from "@/app/actions/warning-actions"
import { useRouter } from "next/navigation"
import { useState } from "react"

interface ThumbsButtonsProps {
  warningId: string
  helpfulCount: number
  notHelpfulCount: number
  userValidation?: boolean | null
}

export function ThumbsButtons({ warningId, helpfulCount, notHelpfulCount, userValidation }: ThumbsButtonsProps) {
  const router = useRouter()
  
  // Local state for optimistic updates
  const [localCounts, setLocalCounts] = useState({
    helpful: helpfulCount,
    notHelpful: notHelpfulCount
  })
  const [localUserValidation, setLocalUserValidation] = useState(userValidation)
  
  const handleValidate = async (isHelpful: boolean) => {
    try {
      console.log(`👍 Thumbs button clicked: ${warningId}, isHelpful: ${isHelpful}`)
      
      // Optimistic update - update UI immediately
      if (isHelpful) {
        setLocalCounts(prev => ({ ...prev, helpful: prev.helpful + 1 }))
        setLocalUserValidation(true)
      } else {
        setLocalCounts(prev => ({ ...prev, notHelpful: prev.notHelpful + 1 }))
        setLocalUserValidation(false)
      }
      
      // Add a timeout to prevent hanging
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Request timeout')), 10000)
      )
      
      const result = await Promise.race([
        validateWarning(warningId, isHelpful),
        timeoutPromise
      ])
      
      console.log("✅ Validation result:", result)
      
      if (result && typeof result === 'object' && 'error' in result) {
        console.error("❌ Validation error:", result.error)
        // Revert optimistic update on error
        if (isHelpful) {
          setLocalCounts(prev => ({ ...prev, helpful: prev.helpful - 1 }))
        } else {
          setLocalCounts(prev => ({ ...prev, notHelpful: prev.notHelpful - 1 }))
        }
        setLocalUserValidation(userValidation) // Reset to original state
        alert(`Error: ${result.error}`)
      } else {
        console.log("✅ Validation successful! Refreshing page...")
        // Use router.refresh() to trigger server-side revalidation
        router.refresh()
      }
    } catch (error) {
      console.error("❌ Unexpected error:", error)
      // Revert optimistic update on error
      if (isHelpful) {
        setLocalCounts(prev => ({ ...prev, helpful: prev.helpful - 1 }))
      } else {
        setLocalCounts(prev => ({ ...prev, notHelpful: prev.notHelpful - 1 }))
      }
      setLocalUserValidation(userValidation) // Reset to original state
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      if (errorMessage === 'Request timeout') {
        alert('Request timed out. Please try again.')
      } else if (errorMessage === 'Failed to fetch') {
        alert('Network error. Please check your connection and try again.')
      } else {
        alert(`Unexpected error: ${errorMessage}`)
      }
    }
  }

  return (
    <div className="flex items-center gap-2 pt-2 border-t">
      <span className="text-sm text-muted-foreground">Was this helpful?</span>
      <div className="flex items-center gap-1">
        <Button
          variant={localUserValidation === true ? "default" : "outline"}
          size="sm"
          onClick={() => handleValidate(true)}
          className="gap-1"
        >
          <ThumbsUp className="h-3 w-3" />
          <span className="text-xs">{localCounts.helpful}</span>
        </Button>
        <Button
          variant={localUserValidation === false ? "default" : "outline"}
          size="sm"
          onClick={() => handleValidate(false)}
          className="gap-1"
        >
          <ThumbsDown className="h-3 w-3" />
          <span className="text-xs">{localCounts.notHelpful}</span>
        </Button>
      </div>
    </div>
  )
}
