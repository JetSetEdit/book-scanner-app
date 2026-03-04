"use client"

import Link from "next/link"
import Image from "next/image"
import { BookOpen } from "lucide-react"
import { BookCardAdmin } from "@/components/book-card-admin"
import { RefreshBookButtonWrapper } from "@/components/refresh-book-button-wrapper"

const SPINE_WIDTH = 44
const SPINE_HEIGHT = 200
const EXPANDED_WIDTH = 152 // full book card in row: | | [book] | |

function getContentWarningSummary(contentWarnings?: unknown[]): { severe: number; moderate: number; mild: number } {
  if (!contentWarnings) return { severe: 0, moderate: 0, mild: 0 }
  return contentWarnings.reduce(
    (acc, w: any) => {
      if (w.severity === "severe") acc.severe++
      else if (w.severity === "moderate") acc.moderate++
      else if (w.severity === "mild") acc.mild++
      return acc
    },
    { severe: 0, moderate: 0, mild: 0 }
  )
}

function getClassificationFromCategories(categories?: string[]): string | null {
  if (!categories) return null
  const tag = categories.find((c) => c.startsWith("CLASSIFICATION:"))
  return tag ? tag.replace("CLASSIFICATION:", "") : null
}

interface BookshelfSpineCardProps {
  book: {
    id: string
    isbn: string
    title: string | null
    author: string | null
    cover_url: string | null
    content_warnings?: unknown[]
    categories?: string[] | null
    ai_audit_logs?: unknown[]
    publisher?: string | null
    published_date?: string | null
  }
}

export function BookshelfSpineCard({ book }: BookshelfSpineCardProps) {
  const displayTitle = book.title?.replace(/\s+:\s+/g, ": ") || "Unknown Title"
  const warningSummary = getContentWarningSummary(book.content_warnings as any[])
  const hasWarnings = warningSummary.severe > 0 || warningSummary.moderate > 0 || warningSummary.mild > 0
  const warningsList = (book.content_warnings as any[]) || []
  const maxDots = 6
  const dotsToShow = warningsList.slice(0, maxDots)
  const auditLogs = (book.ai_audit_logs as any[]) || []
  const hasAuditLog = auditLogs.length > 0 && auditLogs.some((log: any) => log.decision_type === "warnings_generated" || log.decision_type === "no_warnings")
  const hasAiWarnings = (book.content_warnings as any[])?.some((w: any) => w.source === "ai_generated") || false
  const isAnalyzed = hasAuditLog || hasAiWarnings
  const classificationRating = getClassificationFromCategories(book.categories || undefined)
  const coverSrc = book.cover_url
    ? book.cover_url.startsWith("http")
      ? `/api/book-cover?url=${encodeURIComponent(book.cover_url)}`
      : book.cover_url
    : null

  let displayDate = book.published_date
  if (displayDate) {
    const m = displayDate.match(/\b(19|20)\d{2}\b/)
    if (m) displayDate = m[0]
  }

  return (
    <Link
      href={`/book/${book.isbn}`}
      className="group flex-shrink-0 overflow-hidden transition-[width] duration-200 ease-out h-[200px] min-w-[44px] w-[44px] hover:!w-[152px]"
    >
      <div className="relative h-full" style={{ width: EXPANDED_WIDTH }}>
        {/* Spine: visible by default, fades out on hover */}
        <div
          className="absolute left-0 top-0 z-10 transition-opacity duration-200 group-hover:opacity-0 pointer-events-none group-hover:pointer-events-none"
          style={{ width: SPINE_WIDTH, height: SPINE_HEIGHT }}
        >
          <div className="relative overflow-hidden rounded-sm border border-border/70 bg-muted/40 shadow-md h-full flex flex-col">
            <BookCardAdmin isbn={book.isbn} title={displayTitle} />
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={
                coverSrc
                  ? {
                      backgroundImage: `url(${coverSrc})`,
                      backgroundSize: `${SPINE_WIDTH * 3}px ${SPINE_HEIGHT}px`,
                      backgroundPosition: "center",
                    }
                  : undefined
              }
            />
            {!coverSrc && <div className="absolute inset-0 bg-gradient-to-b from-muted to-muted/80" />}
            <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/30 to-transparent" />
            <div className="absolute inset-0 flex items-center justify-center p-2 overflow-hidden">
              <span
                className="font-serif font-semibold text-[10px] sm:text-[11px] text-white drop-shadow-md [writing-mode:vertical-rl] [text-orientation:mixed] rotate-180 max-h-full overflow-hidden"
                style={{ textShadow: "0 0 2px rgba(0,0,0,0.8), 0 1px 2px rgba(0,0,0,0.6)" }}
              >
                {displayTitle}
              </span>
            </div>
            <div className="absolute bottom-0 left-0 right-0 p-1.5 bg-black/50 flex flex-col gap-1 items-center">
              <div className="flex flex-wrap gap-0.5 justify-center">
                {hasWarnings ? (
                  dotsToShow.map((w: any, i: number) => {
                    const severity = w.severity === "severe" ? "severe" : w.severity === "moderate" ? "moderate" : "mild"
                    const bg = severity === "severe" ? "bg-red-400" : severity === "moderate" ? "bg-amber-500" : "bg-amber-300"
                    return <span key={w.id || i} className={`inline-block h-1 w-1 rounded-sm ${bg}`} aria-hidden />
                  })
                ) : isAnalyzed ? (
                  <span className="h-1 w-1 rounded-full bg-emerald-400" aria-hidden />
                ) : (
                  <span className="h-1 w-1 rounded-full bg-white/50" aria-hidden />
                )}
              </div>
              {classificationRating && (
                <span className="text-[8px] font-bold text-white/90 uppercase tracking-wider">{classificationRating}</span>
              )}
            </div>
          </div>
        </div>

        {/* Full book: hidden by default, fades in on hover (same row, in place) */}
        <div
          className="absolute left-0 top-0 w-[152px] h-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-lg overflow-hidden border border-border/70 bg-card shadow-lg"
          style={{ height: SPINE_HEIGHT }}
        >
          <div className="flex h-full">
            <div className="w-[88px] flex-shrink-0 relative bg-muted/30">
              {coverSrc ? (
                <Image
                  src={coverSrc}
                  alt=""
                  fill
                  className="object-cover"
                  sizes="88px"
                />
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 text-muted-foreground bg-muted/40">
                  <BookOpen className="h-8 w-8 text-muted-foreground/50" />
                  <span className="text-[10px]">No cover</span>
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0 p-2 flex flex-col justify-between">
              <div>
                <h3 className="font-serif font-semibold text-xs text-foreground leading-tight line-clamp-2">{displayTitle}</h3>
                {book.author && <p className="text-[10px] text-muted-foreground mt-0.5 truncate">by {book.author}</p>}
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-1 flex-wrap">
                  <RefreshBookButtonWrapper isbn={book.isbn} />
                  {hasWarnings ? (
                    dotsToShow.map((w: any, i: number) => {
                      const severity = w.severity === "severe" ? "severe" : w.severity === "moderate" ? "moderate" : "mild"
                      const bg = severity === "severe" ? "bg-red-500/90" : severity === "moderate" ? "bg-amber-600/90" : "bg-amber-400/90"
                      return <span key={w.id || i} className={`inline-block h-1.5 w-1.5 rounded-sm ${bg}`} aria-hidden />
                    })
                  ) : isAnalyzed ? (
                    <span className="text-[9px] text-emerald-600 dark:text-emerald-400">No warnings</span>
                  ) : (
                    <span className="text-[9px] text-muted-foreground italic">Not analyzed</span>
                  )}
                </div>
                {(classificationRating || displayDate) && (
                  <div className="flex flex-wrap gap-1 text-[9px] text-muted-foreground">
                    {classificationRating && <span className="bg-muted/80 px-1 py-0.5 rounded font-medium">{classificationRating}</span>}
                    {displayDate && <span>{displayDate}</span>}
                  </div>
                )}
              </div>
              <p className="text-[9px] font-medium text-primary">View book →</p>
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}
