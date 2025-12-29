"use client"

import { useState, useEffect } from "react"
import { RefreshBookButton } from "./refresh-book-button"

// Check if we're in dev mode
function isDevMode(): boolean {
  if (typeof window === 'undefined') return false
  return (
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1' ||
    process.env.NODE_ENV === 'development'
  )
}

export function RefreshBookButtonWrapper({ isbn }: { isbn: string }) {
  const [showRefreshButton, setShowRefreshButton] = useState(false)

  useEffect(() => {
    // Only show in dev mode
    if (!isDevMode()) return

    // Load dev settings from localStorage
    const saved = localStorage.getItem('dev-show-refresh-button')
    setShowRefreshButton(saved === 'true')
    
    // Listen for dev settings changes from navbar
    const handleDevSettingsChange = (event: CustomEvent) => {
      setShowRefreshButton(event.detail.showRefreshButton || false)
    }
    
    window.addEventListener('dev-settings-changed', handleDevSettingsChange as EventListener)
    return () => {
      window.removeEventListener('dev-settings-changed', handleDevSettingsChange as EventListener)
    }
  }, [])

  // Only render in dev mode and when enabled
  if (!isDevMode() || !showRefreshButton) {
    return null
  }

  return <RefreshBookButton isbn={isbn} />
}




















