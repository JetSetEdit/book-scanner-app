"use client"

import { useEffect, useState } from "react"
import { SeverityScoreBadge } from "./severity-score-badge"

interface SeverityScoreWrapperProps {
  warnings: any[]
  className?: string
}

// Check if we're in dev mode
function isDevMode(): boolean {
  if (typeof window === 'undefined') return false
  return (
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1' ||
    process.env.NODE_ENV === 'development'
  )
}

export function SeverityScoreWrapper({ warnings, className }: SeverityScoreWrapperProps) {
  const [showScore, setShowScore] = useState(false)
  const [isDev, setIsDev] = useState(false)

  useEffect(() => {
    setIsDev(isDevMode())
    if (isDevMode()) {
      const saved = localStorage.getItem('dev-show-severity-score')
      setShowScore(saved === 'true')
    }

    // Listen for dev settings changes from navbar
    const handleDevSettingsChange = (event: CustomEvent) => {
      setShowScore(event.detail.showSeverityScore)
    }
    
    window.addEventListener('dev-settings-changed', handleDevSettingsChange as EventListener)
    return () => {
      window.removeEventListener('dev-settings-changed', handleDevSettingsChange as EventListener)
    }
  }, [])

  if (!isDev || !showScore) {
    return null
  }

  return <SeverityScoreBadge warnings={warnings || []} className={className} />
}

