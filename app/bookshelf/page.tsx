import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { BookOpen, Library, Shield, ScanBarcode, HelpCircle, CheckCircle2, PenLine, Sparkles, Users } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { RefreshBookButtonWrapper } from "@/components/refresh-book-button-wrapper"
import { CollectionSort } from "@/components/collection-sort"
import { CollectionPagination } from "@/components/collection-pagination"
import { compareBySeverity } from "@/lib/utils/severity-scoring"
import { BookCardAdmin } from "@/components/book-card-admin"
import { BookshelfLegendChipSources } from "@/components/bookshelf-legend-chip-sources"
import { NoCoverPlaceholder } from "@/components/no-cover-placeholder"

// Canonical path for bookshelf (nav, links, redirects)
export const BOOKSHELF_PATH = "/bookshelf"

// Helper function to extract classification rating from categories
function getClassificationFromCategories(categories?: string[]): string | null {
  if (!categories) return null
  const classificationTag = categories.find(cat => cat.startsWith('CLASSIFICATION:'))
  return classificationTag ? classificationTag.replace('CLASSIFICATION:', '') : null
}

// Helper function to get content warning summary
function getContentWarningSummary(contentWarnings?: any[]): { severe: number; moderate: number; mild: number } {
  if (!contentWarnings) return { severe: 0, moderate: 0, mild: 0 }

  return contentWarnings.reduce((acc, warning) => {
    if (warning.severity === 'severe') acc.severe++
    else if (warning.severity === 'moderate') acc.moderate++
    else if (warning.severity === 'mild') acc.mild++
    return acc
  }, { severe: 0, moderate: 0, mild: 0 })
}

// Max severity for card accent (severe > moderate > mild)
function getMaxSeverity(summary: { severe: number; moderate: number; mild: number }): 'severe' | 'moderate' | 'mild' | null {
  if (summary.severe > 0) return 'severe'
  if (summary.moderate > 0) return 'moderate'
  if (summary.mild > 0) return 'mild'
  return null
}

interface BookshelfPageProps {
  searchParams: Promise<{ author?: string; q?: string; sort?: string; page?: string }>
}

const BOOKS_PER_PAGE = 12

export default async function BookshelfPage({ searchParams }: BookshelfPageProps) {
  const supabase = await createClient()
  const params = await searchParams
  const authorFilter = params?.author
  const searchQuery = params?.q
  const sortOption = params?.sort || "newest"
  const currentPage = Math.max(1, parseInt(params?.page || "1"))

  let countQuery = supabase.from("books").select("*", { count: "exact", head: true })

  let query = supabase
    .from("books")
    .select(`
      *,
      content_warnings (
        id,
        description,
        severity,
        source,
        is_author_verified,
        user_id
      ),
      ai_audit_logs!left (
        id,
        decision_type,
        created_at
      )
    `)

  if (authorFilter) {
    const decodedAuthor = decodeURIComponent(authorFilter)
    query = query.eq("author", decodedAuthor)
    countQuery = countQuery.eq("author", decodedAuthor)
  } else if (searchQuery) {
    query = query.or(
      `title.ilike.%${searchQuery}%,author.ilike.%${searchQuery}%,isbn.ilike.%${searchQuery}%`
    )
    countQuery = countQuery.or(
      `title.ilike.%${searchQuery}%,author.ilike.%${searchQuery}%,isbn.ilike.%${searchQuery}%`
    )
  }

  const needsSeveritySort = sortOption === "severity-desc" || sortOption === "severity-asc"

  if (!needsSeveritySort) {
    switch (sortOption) {
      case "title-asc":
        query = query.order("title", { ascending: true })
        break
      case "title-desc":
        query = query.order("title", { ascending: false })
        break
      case "author-asc":
        query = query.order("author", { ascending: true, nullsFirst: false })
        break
      case "newest":
      default:
        query = query.order("created_at", { ascending: false })
        break
    }

    const from = (currentPage - 1) * BOOKS_PER_PAGE
    const to = from + BOOKS_PER_PAGE - 1
    query = query.range(from, to)
  } else {
    query = query.order("created_at", { ascending: false })
  }

  const { count: totalBooks } = await countQuery
  const totalPages = Math.ceil((totalBooks || 0) / BOOKS_PER_PAGE)

  const { data: books, error } = await query

  let sortedBooks = books || []
  if (sortOption === "severity-desc") {
    sortedBooks = [...sortedBooks].sort((a, b) =>
      compareBySeverity(
        { warnings: a.content_warnings || [] },
        { warnings: b.content_warnings || [] }
      )
    )
    const from = (currentPage - 1) * BOOKS_PER_PAGE
    const to = from + BOOKS_PER_PAGE
    sortedBooks = sortedBooks.slice(from, to)
  } else if (sortOption === "severity-asc") {
    sortedBooks = [...sortedBooks].sort((a, b) =>
      compareBySeverity(
        { warnings: b.content_warnings || [] },
        { warnings: a.content_warnings || [] }
      )
    )
    const from = (currentPage - 1) * BOOKS_PER_PAGE
    const to = from + BOOKS_PER_PAGE
    sortedBooks = sortedBooks.slice(from, to)
  }

  if (error) {
    console.error("Error fetching books:", error)
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Library className="h-5 w-5" />
                Bookshelf
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Error loading your bookshelf. Please try again later.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6 sm:py-8 overflow-x-hidden">
        <div className="max-w-6xl mx-auto w-full">
          {/* Header: calm hierarchy, warm tone */}
          <header className="mb-5 sm:mb-6">
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-4">
              <div className="min-w-0">
                <h1 className="text-2xl sm:text-3xl font-serif font-semibold tracking-tight text-foreground flex items-center gap-3">
                  <span className="flex items-center justify-center w-11 h-11 rounded-2xl bg-card border border-border shadow-sm" aria-hidden>
                    <Library className="h-6 w-6 text-muted-foreground" />
                  </span>
                  {authorFilter ? (
                    <>Books by {decodeURIComponent(authorFilter)}</>
                  ) : searchQuery ? (
                    <>Search: &quot;{searchQuery}&quot;</>
                  ) : (
                    "Bookshelf"
                  )}
                </h1>
                <p className="text-muted-foreground mt-2 text-sm sm:text-base">
                  {totalBooks ?? 0} {authorFilter || searchQuery ? "book" : "books"} {authorFilter || searchQuery ? "found" : "with content warnings"}
                  {authorFilter && (
                    <Link href={BOOKSHELF_PATH} className="ml-2 text-primary hover:underline font-medium">
                      View all
                    </Link>
                  )}
                </p>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                {totalBooks && totalBooks > 0 && <CollectionSort />}
                <Link href="/scan">
                  <Button size="sm" className="gap-2 rounded-xl shadow-sm">
                    <ScanBarcode className="h-4 w-4" />
                    Scan Book
                  </Button>
                </Link>
              </div>
            </div>

            {/* Legend: chip colors mirrored in text and dots so mapping is obvious */}
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 py-2 text-muted-foreground border-b border-border/50">
              <span className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground/90">Severity</span>
              <div className="flex flex-wrap items-center gap-4 sm:gap-6 font-sans text-[11px]">
                <span className="flex items-center gap-1.5">
                  <span className="inline-block h-1.5 w-1.5 rounded-sm bg-amber-400/90" aria-hidden />
                  <span className="font-medium text-amber-400 dark:text-amber-400/90">Mild</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="inline-block h-1.5 w-1.5 rounded-sm bg-amber-600/90" aria-hidden />
                  <span className="font-medium text-amber-600 dark:text-amber-600/90">Moderate</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="inline-block h-1.5 w-1.5 rounded-sm bg-red-500/90" aria-hidden />
                  <span className="font-medium text-red-500 dark:text-red-500/90">Severe</span>
                </span>
              </div>
              <span className="text-[10px] text-muted-foreground/80">Each dot = one content warning</span>
              <BookshelfLegendChipSources />
            </div>
          </header>

        {!sortedBooks || sortedBooks.length === 0 ? (
          <Card className="rounded-2xl border-border/80 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-xl font-serif">
                <BookOpen className="h-5 w-5 text-muted-foreground" />
                No Books Yet
              </CardTitle>
              <CardDescription className="text-base">
                Your bookshelf is empty. Add books by scanning a barcode or entering an ISBN.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="text-center py-8">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-muted/50 border border-border mb-4">
                  <BookOpen className="h-8 w-8 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground mb-4">
                  Scan a barcode or enter an ISBN to add your first book
                </p>
                <Link
                  href="/"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors font-medium"
                >
                  <BookOpen className="h-4 w-4" />
                  Add Your First Book
                </Link>
              </div>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Bookshelf: rows of book cards (cover as hero) + shelf */}
            {(() => {
              const BOOKS_PER_ROW = 4
              const rows: (typeof sortedBooks)[] = []
              for (let i = 0; i < sortedBooks.length; i += BOOKS_PER_ROW) {
                rows.push(sortedBooks.slice(i, i + BOOKS_PER_ROW))
              }
              return rows.map((rowBooks, rowIndex) => (
                <div key={rowIndex} className="mb-6 last:mb-0">
                  <div className="flex flex-wrap justify-center gap-6 sm:gap-8" style={{ gap: "clamp(1rem, 4vw, 2rem)" }}>
                    {rowBooks.map((book) => {
                      const warningSummary = getContentWarningSummary(book.content_warnings)
                      const hasWarnings = warningSummary.severe > 0 || warningSummary.moderate > 0 || warningSummary.mild > 0
                      const warningsList = (book.content_warnings as any[]) || []
                      const maxDots = 8
                      const dotsToShow = warningsList.slice(0, maxDots)
                      const displayTitle = book.title?.replace(/\s+:\s+/g, ": ") || "Unknown Title"
                      let displayDate = book.published_date
                      if (displayDate) {
                        const yearMatch = displayDate.match(/\b(19|20)\d{2}\b/)
                        if (yearMatch) displayDate = yearMatch[0]
                      }
                      const auditLogs = (book.ai_audit_logs as any[]) || []
                      const hasAuditLog = auditLogs.length > 0 && auditLogs.some((log: any) => log.decision_type === "warnings_generated" || log.decision_type === "no_warnings")
                      const hasAiWarnings = (book.content_warnings as any[])?.some((w: any) => w.source === "ai_generated") || false
                      const isAnalyzed = hasAuditLog || hasAiWarnings
                      const classificationRating = getClassificationFromCategories(book.categories || undefined)

                      const maxSeverity = getMaxSeverity(warningSummary)
                      const severityChipStyle = maxSeverity === 'severe'
                        ? 'bg-red-500/95 text-white border-red-600/80'
                        : maxSeverity === 'moderate'
                          ? 'bg-amber-600/95 text-white border-amber-700/80'
                          : maxSeverity === 'mild'
                            ? 'bg-amber-400/95 text-foreground/90 border-amber-500/80'
                            : isAnalyzed
                              ? 'bg-muted text-muted-foreground border-border'
                              : ''
                      const severityLabel = maxSeverity === 'severe' ? 'Severe' : maxSeverity === 'moderate' ? 'Moderate' : maxSeverity === 'mild' ? 'Mild' : isAnalyzed ? 'None' : null
                      const warningsForSource = (book.content_warnings as any[]) || []
                      const hasAuthorFromWarnings = warningsForSource.some((w: any) => w.is_author_verified === true || w.is_author_approved === true || w.source === 'author_website' || w.source === 'author_approved')
                      const hasAuthorFromBook = !!(book as any).author_content_warnings_list?.length || !!(book as any).author_content_warnings_url
                      const hasAuthor = hasAuthorFromWarnings || hasAuthorFromBook
                      const hasAI = warningsForSource.some((w: any) => w.source === 'ai_generated') || (isAnalyzed && warningsForSource.length > 0 && !warningsForSource.some((w: any) => w.source === 'user_submitted' || (w.user_id != null && w.user_id !== '')))
                      const hasCommunity = warningsForSource.some((w: any) => w.source === 'user_submitted' || (w.user_id != null && w.user_id !== ''))
                      const sourceParts: string[] = []
                      if (hasAuthor) sourceParts.push('Author')
                      if (hasAI) sourceParts.push('AI')
                      if (hasCommunity) sourceParts.push('Community')
                      const sourceLabel = sourceParts.length > 0 ? sourceParts.join(' + ') : (isAnalyzed ? 'AI' : null)

                      return (
                        <Link key={book.id} href={`/book/${book.isbn}`} className="block w-[140px] sm:w-[160px] h-[358px] sm:h-[384px] group flex-shrink-0">
                          <div className="relative rounded-xl overflow-hidden border border-border/70 bg-card/80 shadow-sm hover:shadow-md hover:scale-[1.02] transition-all duration-200 flex flex-col h-full ring-offset-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
                            {/* Severity chip: label + up to 3 source icons (Author, AI, Community) */}
                            {severityLabel && (
                              <span
                                className={`absolute top-1.5 left-1.5 z-10 flex items-center gap-0.5 px-1.5 py-[2px] rounded-sm text-[9px] font-semibold uppercase tracking-wide border shrink-0 min-w-0 ${severityChipStyle}`}
                                style={{ maxWidth: 'calc(100% - 0.5rem)' }}
                                title={sourceLabel ? `Severity: ${severityLabel}. Sources: ${sourceLabel}.` : `Severity: ${severityLabel}.`}
                                aria-label={sourceLabel ? `Severity: ${severityLabel}. Sources: ${sourceLabel}.` : undefined}
                              >
                                <span className="shrink-0" aria-hidden="true">{severityLabel}</span>
                                {(hasAuthor || hasAI || hasCommunity) && (
                                  <span className="inline-flex shrink-0 items-center gap-0.5 flex-nowrap" aria-hidden="true" style={{ minWidth: [hasAuthor, hasAI, hasCommunity].filter(Boolean).length * 11 + 4 }}>
                                    {hasAuthor && <span className="inline-flex flex-shrink-0 w-[10px] justify-center"><PenLine className="h-2.5 w-2.5 opacity-90" title="Author" /></span>}
                                    {hasAI && <span className="inline-flex flex-shrink-0 w-[10px] justify-center"><Sparkles className="h-2.5 w-2.5 opacity-90" title="AI" /></span>}
                                    {hasCommunity && <span className="inline-flex flex-shrink-0 w-[10px] justify-center"><Users className="h-2.5 w-2.5 opacity-90" title="Community" /></span>}
                                  </span>
                                )}
                              </span>
                            )}
                            <BookCardAdmin isbn={book.isbn} title={displayTitle} />
                            {/* Fixed-height cover area (2:3) so all cards match */}
                            <div className="w-full flex-shrink-0 relative bg-muted/30 h-[210px] sm:h-[240px]">
                              {book.cover_url ? (
                                <Image
                                  src={book.cover_url.startsWith("http") ? `/api/book-cover?url=${encodeURIComponent(book.cover_url)}` : book.cover_url}
                                  alt={`Cover: ${displayTitle}`}
                                  fill
                                  className="object-cover"
                                  sizes="(max-width: 640px) 140px, 160px"
                                />
                              ) : (
                                <NoCoverPlaceholder size="default" />
                              )}
                            </div>
                            {/* Bottom block: enough height so title, dots, rating, and "View book" never clip */}
                            <div className="flex-1 flex flex-col min-h-0 p-3 border-t border-border/50 bg-card/95 min-h-[148px] sm:min-h-[144px]">
                              <h3 className="font-serif font-semibold text-sm text-foreground leading-tight line-clamp-2 group-hover:text-primary transition-colors">{displayTitle}</h3>
                              {book.author && <p className="text-xs text-muted-foreground mt-0.5 truncate">by {book.author}</p>}
                              <div className="mt-2 flex items-center justify-between gap-1 flex-wrap">
                                <RefreshBookButtonWrapper isbn={book.isbn} />
                                {hasWarnings ? (
                                  <div className="flex flex-wrap gap-0.5 items-center" role="region" aria-label="Content at a glance">
                                    {dotsToShow.map((w: any, i: number) => {
                                      const severity = w.severity === "severe" ? "severe" : w.severity === "moderate" ? "moderate" : "mild"
                                      const bg = severity === "severe" ? "bg-red-500/90" : severity === "moderate" ? "bg-amber-600/90" : "bg-amber-400/90"
                                      return <span key={w.id || i} className={`inline-block h-1.5 w-1.5 rounded-sm ${bg}`} aria-hidden />
                                    })}
                                    {warningsList.length > maxDots && <span className="text-[10px] text-muted-foreground">+{warningsList.length - maxDots}</span>}
                                  </div>
                                ) : isAnalyzed ? (
                                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400">No warnings</span>
                                ) : (
                                  <span className="text-[10px] text-muted-foreground italic">Not analyzed</span>
                                )}
                              </div>
                              <div className="mt-1.5 min-h-[18px] flex items-center gap-1 text-[10px] text-muted-foreground whitespace-nowrap">
                                {classificationRating && displayDate && (
                                  <span className="bg-muted/70 px-1.5 py-0.5 rounded font-medium">{classificationRating} · {displayDate}</span>
                                )}
                                {classificationRating && !displayDate && <span className="bg-muted/70 px-1.5 py-0.5 rounded font-medium">{classificationRating}</span>}
                                {!classificationRating && displayDate && <span>{displayDate}</span>}
                              </div>
                              <p className="mt-auto pt-1.5 text-[11px] font-medium text-primary">View book →</p>
                            </div>
                          </div>
                        </Link>
                      )
                    })}
                  </div>
                  <div className="mt-4 h-3 rounded-b-md border-t-2 border-border shadow-inner bg-gradient-to-b from-muted to-muted/80 dark:from-muted/60 dark:to-muted/40" aria-hidden />
                </div>
              ))
            })()}
          </>
        )}

        {totalBooks && totalBooks > BOOKS_PER_PAGE && (
          <CollectionPagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalBooks={totalBooks}
            booksPerPage={BOOKS_PER_PAGE}
          />
        )}
        </div>
      </div>
    </div>
  )
}
