"use client"

import { Share2 } from "lucide-react"
import { Button } from "@/components/ui/button"

interface ShareButtonProps {
  title: string
  author: string
  isbn: string
}

export function ShareButton({ title, author, isbn }: ShareButtonProps) {
  const handleShare = async () => {
    const url = `${window.location.origin}/book/${isbn}`
    const text = `Check out "${title}" by ${author} on Subtext - see content warnings and analysis before you read.`

    // Check if Web Share API is available (mobile browsers)
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${title} by ${author}`,
          text: text,
          url: url,
        })
      } catch (error) {
        // User cancelled or error occurred - silently fail
        if ((error as Error).name !== 'AbortError') {
          console.error('Error sharing:', error)
        }
      }
    } else {
      // Fallback: Copy to clipboard
      try {
        await navigator.clipboard.writeText(`${text}\n${url}`)
        // You could show a toast here if you want
      } catch (error) {
        console.error('Error copying to clipboard:', error)
      }
    }
  }

  return (
    <Button
      onClick={handleShare}
      variant="outline"
      size="sm"
      className="gap-2"
    >
      <Share2 className="h-4 w-4" />
      Share
    </Button>
  )
}
