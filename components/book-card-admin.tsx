"use client"

import { useState, useEffect } from "react"
import { Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"

// Check if we're in dev mode
function isDevMode(): boolean {
  if (typeof window === 'undefined') return false
  return (
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1' ||
    process.env.NODE_ENV === 'development'
  )
}

interface BookCardAdminProps {
  isbn: string
  title: string
}

export function BookCardAdmin({ isbn, title }: BookCardAdminProps) {
  const router = useRouter()
  const [isDev, setIsDev] = useState(false)
  const [showAdminControls, setShowAdminControls] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    setIsDev(isDevMode())
    if (isDevMode()) {
      const saved = localStorage.getItem('dev-show-admin-controls')
      setShowAdminControls(saved === 'true')
    }
    
    // Listen for dev settings changes from navbar
    const handleDevSettingsChange = (event: CustomEvent) => {
      setShowAdminControls(event.detail.showAdminControls || false)
    }
    
    window.addEventListener('dev-settings-changed', handleDevSettingsChange as EventListener)
    return () => {
      window.removeEventListener('dev-settings-changed', handleDevSettingsChange as EventListener)
    }
  }, [])

  if (!isDev || !showAdminControls) {
    return null
  }

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (!confirm(`Delete "${title}" (${isbn})?\n\nThis will delete the book and all related data. This cannot be undone.`)) {
      return
    }

    setIsDeleting(true)
    try {
      const response = await fetch('/api/admin/delete-book', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isbn }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete book')
      }

      // Refresh the page to remove the deleted book
      router.refresh()
    } catch (error) {
      console.error('Error deleting book:', error)
      alert(`Error: ${error instanceof Error ? error.message : 'Failed to delete book'}`)
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleDelete}
      onMouseDown={(e) => e.stopPropagation()}
      disabled={isDeleting}
      className="absolute top-2 right-2 h-6 w-6 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 z-10"
      title={`Delete ${title}`}
    >
      <Trash2 className="h-3 w-3" />
    </Button>
  )
}

