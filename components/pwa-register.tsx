"use client"

import { useEffect } from "react"

export function PWARegister() {
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      // Register service worker
      window.addEventListener('load', () => {
        navigator.serviceWorker
          .register('/sw.js', { scope: '/' })
          .then((registration) => {
            console.log('✅ Service Worker registered:', registration.scope)
            
            // Check for updates periodically
            setInterval(() => {
              registration.update()
            }, 60 * 60 * 1000) // Check every hour
          })
          .catch((error) => {
            console.log('❌ Service Worker registration failed:', error)
          })
      })
    }
  }, [])

  return null
}

