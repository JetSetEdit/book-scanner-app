// Service Worker for Subtext PWA
// IMPORTANT:
// - Use network-first for navigations to avoid stale UI after deploys.
// - Keep cache name bumpable to force cleanup when needed.
const CACHE_NAME = 'subtext-v2'
const STATIC_ASSETS = [
  '/logo.png',
  '/manifest.json',
]

// Install event - cache resources
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS)
    })
  )
  self.skipWaiting()
})

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName)
          }
        })
      )
    })
  )
  return self.clients.claim()
})

// Allow the app to force activation of an updated SW
self.addEventListener('message', (event) => {
  if (event?.data?.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }
})

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    return
  }

  // Skip cross-origin requests
  if (!event.request.url.startsWith(self.location.origin)) {
    return
  }

  const request = event.request
  const accept = request.headers.get('accept') || ''
  const isNavigation = request.mode === 'navigate' || accept.includes('text/html')

  // Network-first for navigations to prevent stale pages after deploys.
  if (isNavigation) {
    event.respondWith(
      fetch(request)
        .then((networkResponse) => {
          // Cache a copy for offline fallback
          const responseToCache = networkResponse.clone()
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseToCache)
          })
          return networkResponse
        })
        .catch(() => {
          // Offline: fall back to cached navigation or home
          return caches.match(request).then((cached) => cached || caches.match('/'))
        })
    )
    return
  }

  event.respondWith(
    caches.match(request).then((response) => {
      // Return cached version or fetch from network
      return (
        response ||
        fetch(request).then((response) => {
          // Don't cache if not a valid response
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response
          }

          // Clone the response
          const responseToCache = response.clone()

          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseToCache)
          })

          return response
        })
      )
    })
  )
})


















