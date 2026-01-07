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

            // Proactively check for an updated SW on page load
            registration.update().catch(() => {})

            // If an update is found, activate it ASAP and reload clients so users see new UI.
            registration.addEventListener('updatefound', () => {
              const newWorker = registration.installing
              if (!newWorker) return

              newWorker.addEventListener('statechange', () => {
                // "installed" + existing controller means there's an update ready.
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  newWorker.postMessage({ type: 'SKIP_WAITING' })
                }
              })
            })

            let refreshing = false
            navigator.serviceWorker.addEventListener('controllerchange', () => {
              if (refreshing) return
              refreshing = true
              window.location.reload()
            })
            
            // Check for updates periodically
            setInterval(() => {
              registration.update()
            }, 10 * 60 * 1000) // Check every 10 minutes
          })
          .catch((error) => {
            console.log('❌ Service Worker registration failed:', error)
          })
      })
    }
  }, [])

  return null
}

