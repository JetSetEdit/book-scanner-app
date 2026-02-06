import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { BookOpen, Library, Shield, AlertTriangle, Info, AlertCircle, ScanBarcode, HelpCircle } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { RefreshBookButtonWrapper } from "@/components/refresh-book-button-wrapper"
import { SeverityMild, SeverityModerate, SeveritySevere } from "@/components/severity-icons"
import { SeverityLegend } from "@/components/severity-legend"
import { CollectionSort } from "@/components/collection-sort"
import { CollectionPagination } from "@/components/collection-pagination"
import { compareBySeverity } from "@/lib/utils/severity-scoring"
import { SeverityScoreWrapper } from "@/components/severity-score-wrapper"
import { BookAdminControls } from "@/components/book-admin-controls"
import { BookCardAdmin } from "@/components/book-card-admin"
import { CollectionFiltersWrapper } from "@/components/collection-filters-wrapper"
import { FilterCounts } from "@/components/collection-filters"

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

interface CollectionPageProps {
  searchParams: Promise<{
    author?: string;
    q?: string;
    sort?: string;
    page?: string;
    rating?: string;
    severity?: string;
    category?: string;
    sss?: string;
  }>
}

const BOOKS_PER_PAGE = 12

export default async function CollectionPage({ searchParams }: CollectionPageProps) {
  const supabase = await createClient()
  const params = await searchParams
  const authorFilter = params?.author
  const searchQuery = params?.q
  const sortOption = params?.sort || "newest"
  const currentPage = Math.max(1, parseInt(params?.page || "1"))

  // Parse filter params
  const ratingFilters = params?.rating?.split(",").filter(Boolean) || []
  const severityFilters = params?.severity?.split(",").filter(Boolean) || []
  const categoryFilters = params?.category?.split(",").filter(Boolean) || []
  const sssFilters = params?.sss?.split(",").filter(Boolean) || []

  // Build base query for counting total books
  let countQuery = supabase.from("books").select("*", { count: "exact", head: true })

  // Build query with optional filters
  let query = supabase
    .from("books")
    .select(`
      *,
      content_warnings (
        id,
        description,
        severity
      ),
      ai_audit_logs!left (
        id,
        decision_type,
        created_at
      )
    `)

  // Apply filters
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

  // Check if we need to fetch all books for severity sorting
  const needsSeveritySort = sortOption === "severity-desc" || sortOption === "severity-asc"

  if (!needsSeveritySort) {
    // Apply database sorting for non-severity sorts
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

    // Apply pagination at database level
    const from = (currentPage - 1) * BOOKS_PER_PAGE
    const to = from + BOOKS_PER_PAGE - 1
    query = query.range(from, to)
  } else {
    // For severity sorting, we need all books to sort client-side
    // Apply a default order for consistency (newest first)
    query = query.order("created_at", { ascending: false })
  }

  // Get total count for pagination
  const { count: totalBooks } = await countQuery
  const totalPages = Math.ceil((totalBooks || 0) / BOOKS_PER_PAGE)

  // Fetch books with content warnings
  const { data: books, error } = await query

  // Apply client-side sorting for severity (since it requires complex calculation)
  let sortedBooks = books || []
  if (sortOption === "severity-desc") {
    sortedBooks = [...sortedBooks].sort((a, b) =>
      compareBySeverity(
        { warnings: a.content_warnings || [] },
        { warnings: b.content_warnings || [] }
      )
    )
    // Paginate after sorting
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
    // Paginate after sorting
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
              <p className="text-muted-foreground">Error loading your collection. Please try again later.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // Client-side filtering based on URL params
  let filteredBooks = sortedBooks

  // Filter by severity
  if (severityFilters.length > 0) {
    filteredBooks = filteredBooks.filter((book) => {
      const warnings = book.content_warnings || []
      const severities = new Set(warnings.map((w: any) => w.severity))

      if (severityFilters.includes("severe") && severities.has("severe")) return true
      if (severityFilters.includes("moderate") && severities.has("moderate")) return true
      if (severityFilters.includes("mild") && warnings.length > 0 && !severities.has("moderate") && !severities.has("severe")) return true
      return false
    })
  }

  // Filter by age rating
  if (ratingFilters.length > 0) {
    filteredBooks = filteredBooks.filter((book) => {
      const rating = getClassificationFromCategories(book.categories || undefined)
      return rating && ratingFilters.includes(rating)
    })
  }

  // Filter by warning category
  if (categoryFilters.length > 0) {
    filteredBooks = filteredBooks.filter((book) => {
      const warnings = book.content_warnings || []
      return warnings.some((w: any) => categoryFilters.includes(w.category))
    })
  }

  // Filter by SSS level
  if (sssFilters.length > 0) {
    filteredBooks = filteredBooks.filter((book) => {
      return book.sss_level && sssFilters.includes(book.sss_level)
    })
  }

  // Compute filter counts for sidebar
  const filterCounts: FilterCounts = {
    ratings: {},
    severities: {},
    categories: {},
    sss: {},
  }

  // Count all books (before filtering) for display counts
  const allBooksForCounts = sortedBooks || []
  allBooksForCounts.forEach((book) => {
    // Count ratings
    const rating = getClassificationFromCategories(book.categories || undefined)
    if (rating) {
      filterCounts.ratings[rating] = (filterCounts.ratings[rating] || 0) + 1
    }

    // Count severities
    const warnings = book.content_warnings || []
    const severities = new Set(warnings.map((w: any) => w.severity))
    if (severities.has("severe")) filterCounts.severities["severe"] = (filterCounts.severities["severe"] || 0) + 1
    if (severities.has("moderate")) filterCounts.severities["moderate"] = (filterCounts.severities["moderate"] || 0) + 1
    if (warnings.length > 0 && !severities.has("moderate") && !severities.has("severe")) {
      filterCounts.severities["mild"] = (filterCounts.severities["mild"] || 0) + 1
    }

    // Count categories
    warnings.forEach((w: any) => {
      if (w.category) {
        filterCounts.categories[w.category] = (filterCounts.categories[w.category] || 0) + 1
      }
    })

    // Count SSS levels
    if (book.sss_level) {
      filterCounts.sss[book.sss_level] = (filterCounts.sss[book.sss_level] || 0) + 1
    }
  })

  // If filters are active, use filtered count
  const displayedBooks = filteredBooks
  const displayedTotal = filteredBooks.length

  return (
    <div className="container mx-auto px-4 py-8 overflow-x-hidden">
      <div className="max-w-7xl mx-auto w-full">
        {/* Header section */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-4">
            <div className="flex-1 min-w-0">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mb-2">
                <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
                  <Library className="h-6 w-6 sm:h-8 sm:w-8" />
                  {authorFilter ? (
                    <>
                      Books by {decodeURIComponent(authorFilter)}
                    </>
                  ) : searchQuery ? (
                    <>
                      Search Results for &quot;{searchQuery}&quot;
                    </>
                  ) : (
                    "Bookshelf"
                  )}
                </h1>
                <Link href="/scan" className="self-start sm:self-auto">
                  <Button size="sm" className="gap-2">
                    <ScanBarcode className="h-4 w-4" />
                    Scan Book
                  </Button>
                </Link>
              </div>
              <p className="text-muted-foreground">
                {displayedTotal} {authorFilter || searchQuery ? "book" : "books"} {authorFilter || searchQuery ? "found" : "with content warnings available"}
                {(ratingFilters.length > 0 || severityFilters.length > 0 || categoryFilters.length > 0) && (
                  <span className="text-muted-foreground/70"> (filtered)</span>
                )}
                {authorFilter && (
                  <Link
                    href="/collection"
                    className="ml-2 text-sm text-primary hover:underline"
                  >
                    (View all books)
                  </Link>
                )}
              </p>
            </div>
            {/* Sort Selector */}
            {totalBooks && totalBooks > 0 && (
              <div className="flex-shrink-0">
                <CollectionSort />
              </div>
            )}
          </div>

          {/* Content Warning Legend */}
          <div className="mt-8 border-t-2 border-border pt-6">
            <div className="flex items-center gap-4 mb-6">
              <div className="h-px bg-border flex-1"></div>
              <h3 className="font-sans text-xs font-bold uppercase tracking-widest text-muted-foreground">
                Warning Legend
              </h3>
              <div className="h-px bg-border flex-1"></div>
            </div>
            <SeverityLegend />
          </div>
        </div>

        {/* Main content area with sidebar */}
        <div className="flex gap-8">
          {/* Sidebar filters - desktop */}
          <CollectionFiltersWrapper counts={filterCounts} />
          {/* Main content */}
          <div className="flex-1 min-w-0">
            {!displayedBooks || displayedBooks.length === 0 ? (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5" />
                    No Books Yet
                  </CardTitle>
                  <CardDescription>
                    Your collection is empty. Start by adding some books!
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <BookOpen className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground mb-4">
                      Scan a barcode or enter an ISBN to add your first book
                    </p>
                    <a
                      href="/"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
                    >
                      <BookOpen className="h-4 w-4" />
                      Add Your First Book
                    </a>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8" style={{ gap: '2rem' }}>
                {displayedBooks.map((book) => {
                  const warningSummary = getContentWarningSummary(book.content_warnings)
                  const hasWarnings = warningSummary.severe > 0 || warningSummary.moderate > 0 || warningSummary.mild > 0

                  // Check if book has been analyzed
                  // Analysis is complete if:
                  // 1. There's an audit log with 'warnings_generated' or 'no_warnings', OR
                  // 2. There are AI-generated warnings (even without audit log - indicates analysis was done)
                  const auditLogs = (book.ai_audit_logs as any[]) || []
                  const hasAuditLog = auditLogs.length > 0 && auditLogs.some(log =>
                    log.decision_type === 'warnings_generated' || log.decision_type === 'no_warnings'
                  )
                  const hasAiWarnings = (book.content_warnings as any[])?.some((w: any) => w.source === 'ai_generated') || false
                  const isAnalyzed = hasAuditLog || hasAiWarnings

                  return (
                    <Link key={book.id} href={`/book/${book.isbn}`} className="block h-full relative">
                      <Card className="h-full overflow-hidden hover:shadow-lg transition-shadow cursor-pointer">
                        <BookCardAdmin isbn={book.isbn} title={book.title} />
                        <CardContent className="p-6 flex flex-col h-full">
                          <div className="flex gap-4 flex-1">
                            {/* Book Cover */}
                            <div className="flex-shrink-0">
                              <div className="w-20 h-32 bg-muted rounded-lg overflow-hidden relative">
                                {book.cover_url ? (
                                  <Image
                                    src={book.cover_url.startsWith('http')
                                      ? `/api/book-cover?url=${encodeURIComponent(book.cover_url)}`
                                      : book.cover_url}
                                    alt={`Cover of ${book.title}`}
                                    fill
                                    className="object-cover"
                                  />
                                ) : (
                                  <div className="w-full h-full flex flex-col items-center justify-center gap-1 text-muted-foreground">
                                    <BookOpen className="h-6 w-6" />
                                    <span className="text-[10px]">No cover</span>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Book Details */}
                            <div className="flex-1 space-y-2">
                              <div className="flex justify-between items-start gap-2">
                                <div className="flex-1">
                                  <h3 className="font-bold text-lg text-balance leading-tight mb-1">{book.title}</h3>
                                  {book.author && <p className="text-sm text-muted-foreground">by {book.author}</p>}
                                </div>
                                <RefreshBookButtonWrapper isbn={book.isbn} />
                              </div>

                              {/* Content Warnings Summary */}
                              {hasWarnings ? (
                                <div className="space-y-1">
                                  <div className="flex items-center gap-2">
                                    <Shield className="h-3 w-3" />
                                    <span className="text-xs font-medium">Content Warnings:</span>
                                  </div>
                                  <ul className="text-xs space-y-0.5">
                                    {warningSummary.severe > 0 && (
                                      <li className="flex items-center gap-2">
                                        <div className="p-0.5 rounded-full bg-red-50 text-red-600">
                                          <SeveritySevere className="h-3 w-3" />
                                        </div>
                                        <span>{warningSummary.severe} severe</span>
                                      </li>
                                    )}
                                    {warningSummary.moderate > 0 && (
                                      <li className="flex items-center gap-2">
                                        <div className="p-0.5 rounded-full bg-orange-50 text-orange-600">
                                          <SeverityModerate className="h-3 w-3" />
                                        </div>
                                        <span>{warningSummary.moderate} moderate</span>
                                      </li>
                                    )}
                                    {warningSummary.mild > 0 && (
                                      <li className="flex items-center gap-2">
                                        <div className="p-0.5 rounded-full bg-yellow-50 text-yellow-600">
                                          <SeverityMild className="h-3 w-3" />
                                        </div>
                                        <span>{warningSummary.mild} mild</span>
                                      </li>
                                    )}
                                  </ul>
                                </div>
                              ) : isAnalyzed ? (
                                <div className="space-y-1">
                                  <div className="flex items-center gap-2 text-muted-foreground">
                                    <Shield className="h-3 w-3" />
                                    <span className="text-xs font-medium">Content Warnings:</span>
                                  </div>
                                  <p className="text-xs text-muted-foreground pl-5">No specific warnings</p>
                                </div>
                              ) : (
                                <div className="space-y-1">
                                  <div className="flex items-center gap-2 text-muted-foreground">
                                    <HelpCircle className="h-3 w-3" />
                                    <span className="text-xs font-medium">Status:</span>
                                  </div>
                                  <p className="text-xs text-muted-foreground pl-5 italic">Not analyzed yet</p>
                                </div>
                              )}

                              {/* SSS Rating Pill - Primary display */}
                              {book.sss_level && (() => {
                                const sssConfig: Record<string, { label: string; bg: string; text: string }> = {
                                  'S0_NO_INPUT': { label: 'Not yet assessed', bg: 'bg-muted', text: 'text-muted-foreground' },
                                  'S1_GENTLE': { label: 'S1 Gentle', bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-700 dark:text-green-300' },
                                  'S2_MILD': { label: 'S2 Mild', bg: 'bg-yellow-100 dark:bg-yellow-900/30', text: 'text-yellow-700 dark:text-yellow-300' },
                                  'S3_MODERATE': { label: 'S3 Moderate', bg: 'bg-orange-100 dark:bg-orange-900/30', text: 'text-orange-700 dark:text-orange-300' },
                                  'S4_INTENSE': { label: 'S4 Intense', bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-300' },
                                }
                                const config = sssConfig[book.sss_level]
                                return config && (
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs font-medium">Suitability:</span>
                                    <span className={`text-xs px-2 py-1 rounded font-medium ${config.bg} ${config.text}`}>
                                      {config.label}
                                    </span>
                                  </div>
                                )
                              })()}

                              {/* Classification Rating */}
                              {(() => {
                                const classificationRating = getClassificationFromCategories(book.categories || undefined)
                                return classificationRating && (
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs font-medium">Classification:</span>
                                    <span className="text-xs bg-muted px-2 py-1 rounded">
                                      {classificationRating}
                                    </span>
                                  </div>
                                )
                              })()}

                              {/* Metadata */}
                              <div className="text-xs text-muted-foreground space-y-1">
                                {book.publisher && <div>Publisher: {book.publisher}</div>}
                                {book.published_date && <div>Published: {book.published_date}</div>}
                              </div>
                            </div>
                          </div>

                          {/* View Book Link */}
                          <div className="mt-4 pt-4 border-t border-slate-100">
                            <div className="text-center">
                              <span className="text-xs font-bold tracking-widest uppercase text-slate-400 hover:text-slate-600 transition-colors">
                                View Book
                              </span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  )
                })}
              </div>
            )}

            {/* Pagination */}
            {displayedTotal > BOOKS_PER_PAGE && (
              <CollectionPagination
                currentPage={currentPage}
                totalPages={Math.ceil(displayedTotal / BOOKS_PER_PAGE)}
                totalBooks={displayedTotal}
                booksPerPage={BOOKS_PER_PAGE}
              />
            )}
          </div>
        </div>
      </div>
    </div >
  )
}
