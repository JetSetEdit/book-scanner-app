"use client"

import { useEffect, useState, useRef } from "react"
import Link from "next/link"
import { Clock, BookOpen } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { cn } from "@/lib/utils"

/** Pixels per second for the carousel auto-scroll (~5s per item at ~144px). */
const CAROUSEL_PX_PER_SEC = 28
const CAROUSEL_TICK_MS = 80

interface RecentScan {
  id: string
  isbn: string
  createdAt: string
  book: {
    id: string
    title: string
    author: string | null
    coverUrl: string | null
  } | null
}

export function RecentScans() {
  const [scans, setScans] = useState<RecentScan[]>([])
  const [loading, setLoading] = useState(true)
  const [isPaused, setIsPaused] = useState(false)
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(true) // assume reduced until we've checked
  const scrollRef = useRef<HTMLDivElement>(null)
  const programmaticScrollRef = useRef(false)
  const userScrollPauseUntilRef = useRef(0)

  useEffect(() => {
    async function fetchRecentScans() {
      try {
        const response = await fetch('/api/recent-scans')
        const data = await response.json()
        if (data.scans) {
          setScans(data.scans)
        }
      } catch (error) {
        console.error('Error fetching recent scans:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchRecentScans()
    // Refresh every 30 seconds
    const interval = setInterval(fetchRecentScans, 30000)
    return () => clearInterval(interval)
  }, [])

  // Respect prefers-reduced-motion: disable auto-scroll when set
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)")
    setPrefersReducedMotion(mq.matches)
    const handler = () => setPrefersReducedMotion(mq.matches)
    mq.addEventListener("change", handler)
    return () => mq.removeEventListener("change", handler)
  }, [])

  // Auto-scroll: slow horizontal nudge, loop at end. Off when prefersReducedMotion or (paused by hover/focus) or (recent user scroll).
  useEffect(() => {
    const el = scrollRef.current
    if (!el || prefersReducedMotion) return

    const pxPerTick = (CAROUSEL_PX_PER_SEC * CAROUSEL_TICK_MS) / 1000

    const id = setInterval(() => {
      if (isPaused) return
      const target = scrollRef.current
      if (!target) return
      if (target.scrollWidth <= target.clientWidth) return
      if (Date.now() < userScrollPauseUntilRef.current) return

      programmaticScrollRef.current = true
      target.scrollLeft += pxPerTick
      if (target.scrollLeft >= target.scrollWidth - target.clientWidth - 2) {
        target.scrollLeft = 0
      }
      requestAnimationFrame(() => {
        programmaticScrollRef.current = false
      })
    }, CAROUSEL_TICK_MS)

    return () => clearInterval(id)
  }, [prefersReducedMotion, isPaused])

  // Pause on focus within carousel, resume on focus out
  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    const onFocusIn = () => setIsPaused(true)
    const onFocusOut = (e: FocusEvent) => {
      if (!el.contains(e.relatedTarget as Node)) setIsPaused(false)
    }
    el.addEventListener("focusin", onFocusIn)
    el.addEventListener("focusout", onFocusOut)
    return () => {
      el.removeEventListener("focusin", onFocusIn)
      el.removeEventListener("focusout", onFocusOut)
    }
  }, [scans.length])

  // On user scroll (non-programmatic), pause auto-scroll briefly
  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    let throttle: ReturnType<typeof setTimeout> | null = null
    const onScroll = () => {
      if (programmaticScrollRef.current) return
      if (throttle) return
      throttle = setTimeout(() => {
        userScrollPauseUntilRef.current = Date.now() + 2500
        throttle = null
      }, 100)
    }
    el.addEventListener("scroll", onScroll, { passive: true })
    return () => {
      el.removeEventListener("scroll", onScroll)
      if (throttle) clearTimeout(throttle)
    }
  }, [scans.length])

  if (loading) {
    return (
      <div className="border-t border-border/50 bg-card/60 py-12">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-center gap-2 text-muted-foreground">
            <Clock className="h-4 w-4 animate-spin" />
            <span className="text-sm">Loading recent scans...</span>
          </div>
        </div>
      </div>
    )
  }

  if (scans.length === 0) {
    return null // Don't show section if no scans
  }

  // API now handles filtering and deduplication, but double-check for safety
  // Show recent scans even if cover is missing (use placeholder icon).
  const scansWithBooks = scans.filter(scan => scan.book)

  if (scansWithBooks.length === 0) {
    return null
  }

  return (
    <div className="border-t border-border/50 bg-card/60 py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-2 mb-6">
            <Clock className="h-5 w-5 text-muted-foreground" />
            <h2 className="font-serif text-2xl font-bold text-foreground">
              Recently Scanned
            </h2>
          </div>
          
          <div
            ref={scrollRef}
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
            className="flex gap-4 overflow-x-auto overflow-y-visible pt-3 pb-6 -mx-4 px-4 scrollbar-hide"
          >
            {scansWithBooks.slice(0, 8).map((scan) => {
              const timeAgo = formatDistanceToNow(new Date(scan.createdAt), {
                addSuffix: true,
              })

              return (
                <Link
                  key={scan.isbn} // Use ISBN as key since we deduplicate by ISBN
                  href={`/book/${scan.isbn}`}
                  className="flex-shrink-0 group"
                >
                  <div className="relative w-32 md:w-40 overflow-visible">
                    <div className="aspect-[2/3] rounded-lg overflow-hidden border-2 border-border/50 group-hover:border-primary transition-colors shadow-lg group-hover:shadow-xl group-hover:scale-105 transition-all duration-200 origin-center">
                      {scan.book?.coverUrl ? (
                        <img
                          src={scan.book.coverUrl.startsWith('http') 
                            ? `/api/book-cover?url=${encodeURIComponent(scan.book.coverUrl)}`
                            : scan.book.coverUrl}
                          alt={scan.book.title || 'Book cover'}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            // If image fails to load (CORS, broken URL, etc.), show placeholder
                            const target = e.target as HTMLImageElement
                            target.style.display = 'none'
                            const parent = target.parentElement
                            if (parent && !parent.querySelector('.cover-placeholder')) {
                              const placeholder = document.createElement('div')
                              placeholder.className = 'cover-placeholder w-full h-full flex items-center justify-center bg-muted text-muted-foreground'
                              placeholder.innerHTML = '<svg class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>'
                              parent.appendChild(placeholder)
                            }
                          }}
                        />
                      ) : (
                        <div className="w-full h-full bg-muted flex items-center justify-center">
                          <BookOpen className="h-8 w-8 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    <div className="mt-2 text-center">
                      <p className="text-xs text-muted-foreground truncate px-1">
                        {timeAgo}
                      </p>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>

          {scans.length > 8 && (
            <div className="mt-6 text-center">
              <Link
                href="/collection"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors underline underline-offset-2"
              >
                View all scanned books →
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

