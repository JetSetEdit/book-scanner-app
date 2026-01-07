"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Clock, BookOpen } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { cn } from "@/lib/utils"

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
          
          <div className="flex gap-4 overflow-x-auto overflow-y-visible pt-3 pb-6 -mx-4 px-4 scrollbar-hide">
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
                          src={scan.book.coverUrl}
                          alt={scan.book.title || 'Book cover'}
                          className="w-full h-full object-cover"
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

