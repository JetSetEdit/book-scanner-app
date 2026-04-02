"use client"

import { ContentWarningsList } from "@/components/content-warnings-list"
import { BooktokWarningsSummary } from "@/components/booktok-warnings-summary"
import { AuditHistory } from "@/components/audit-history"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, ChevronDown, ChevronUp, Code, ScanBarcode, Flag, BookOpen, Flame, Info, Sparkles } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"
import { useState, useEffect, useRef } from "react"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import Link from "next/link"
import { SeverityScoreBadge } from "@/components/severity-score-badge"
import { GoogleBooksAttribution } from "@/components/google-books-attribution"
import { ShareButton } from "@/components/ShareButton"
import { BuyButton } from "@/components/BuyButton"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { getSubcategoryById } from "@/lib/config/taxonomy-v2"
import { APP_VERSION } from "@/lib/config/version"
import { generateSummary } from "@/lib/services/warning-renderer"
import { FeedbackDialog } from "@/components/feedback-dialog"
import { AppealDialog } from "@/components/appeal-dialog"
import {
  CONTENT_WARNING_GENERATION_EXPLANATION,
  CONTENT_WARNING_GENERATION_TEASER,
  HOW_WE_GENERATE_LABEL,
} from "@/lib/content-warning-explanation"
import { getVariantConfig } from "@/lib/config/variants"
import { cn } from "@/lib/utils"
import { computeSpiceLevel } from "@/lib/utils/spice-level"
import { formatPublicationDateDisplay } from "@/lib/utils/format-publication-date"

const DESCRIPTION_TRUNCATE_LENGTH = 600

function shouldSuggestDeepScan(opts: {
  analysisStatus: 'complete' | 'unknown'
  warnings: any[]
  analysisMeta: {
    hadThinMetadata: boolean
    usedWebSearch: boolean
    pipelinePath: string | null
    analyzedAt: string | null
  } | null
  description: string
}): boolean {
  const { analysisStatus, warnings, analysisMeta, description } = opts
  if (analysisStatus !== 'complete' || !Array.isArray(warnings) || warnings.length === 0) return false
  const descriptionLength = (description || '').length
  const crossChecked = warnings.some((w: any) => w?.evidence?.[0]?.model_source === 'both')
  const votesPresent = warnings.some(
    (w: any) => (w?.helpful_count || 0) + (w?.not_helpful_count || 0) > 0
  )
  const pipeline = analysisMeta?.pipelinePath?.includes('quick')
    ? 'Quick'
    : analysisMeta?.pipelinePath?.includes('deep')
      ? 'Deep'
      : null
  const isThin = analysisMeta?.hadThinMetadata === true || descriptionLength < 200
  return pipeline === 'Quick' || isThin || !crossChecked || !votesPresent
}

interface BookDetailsProps {
  book: any
  warnings: any[]
  analysisStatus?: 'complete' | 'unknown'
  metadataIssues?: {
    missingCover?: boolean
    missingDescription?: boolean
    coverReason?: string
    descriptionReason?: string
    bookInfoIssues?: string[]
  } | null
  noWarningsReasoning?: string | null // Dev mode: reasoning when no warnings were found
  authorContentWarningsList?: string[] | null // Parsed list from author_content_warnings_url
  /** When "cards", content warnings render as disclosure list (e.g. sandbox). */
  contentDisplayVariant?: 'default' | 'cards'
  /** When set, nav shows "View live page" link to this href instead of "Back to Bookshelf" (sandbox). */
  liveBookHref?: string | null
  analysisMeta?: {
    hadThinMetadata: boolean
    usedWebSearch: boolean
    pipelinePath: string | null
    analyzedAt: string | null
  } | null
}

// Check if we're in dev mode (localhost or dev environment)
function isDevMode(): boolean {
  if (typeof window === 'undefined') return false
  return (
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1' ||
    process.env.NODE_ENV === 'development'
  )
}

export function BookDetails({ book, warnings, analysisStatus = 'unknown', metadataIssues, noWarningsReasoning, authorContentWarningsList, contentDisplayVariant = 'default', liveBookHref, analysisMeta }: BookDetailsProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  // Sandbox: always use cards (disclosure) variant so "Detailed content warnings" layout is consistent
  const displayVariant = liveBookHref ? (contentDisplayVariant || 'cards') : contentDisplayVariant
  const [isAuditOpen, setIsAuditOpen] = useState(false)
  const [isDev, setIsDev] = useState(false)
  const [showAuditTrail, setShowAuditTrail] = useState(false)
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false)
  const descriptionRef = useRef<HTMLDivElement>(null)
  const [fullHeight, setFullHeight] = useState<number | null>(null)
  const [focusWarningId, setFocusWarningId] = useState<string | null>(null)
  const [isHowWeGenerateOpen, setIsHowWeGenerateOpen] = useState(false)
  const [appealDialogOpen, setAppealDialogOpen] = useState(false)
  const [appealPreselectedWarningIds, setAppealPreselectedWarningIds] = useState<string[]>([])

  useEffect(() => {
    setIsDev(isDevMode())

    // Load dev settings from localStorage
    if (isDevMode()) {
      const saved = localStorage.getItem('dev-show-audit-trail')
      setShowAuditTrail(saved === 'true')
      setIsAuditOpen(saved === 'true')
    }

    // Check for ?debug=true query param (overrides localStorage)
    if (searchParams?.get('debug') === 'true') {
      setShowAuditTrail(true)
      setIsAuditOpen(true)
    }

    // Listen for dev settings changes from navbar
    const handleDevSettingsChange = (event: CustomEvent) => {
      setShowAuditTrail(event.detail.showAuditTrail)
      setIsAuditOpen(event.detail.showAuditTrail)
    }

    window.addEventListener('dev-settings-changed', handleDevSettingsChange as EventListener)
    return () => {
      window.removeEventListener('dev-settings-changed', handleDevSettingsChange as EventListener)
    }
  }, [searchParams])

  // Measure full height when expanded
  useEffect(() => {
    if (isDescriptionExpanded && descriptionRef.current) {
      const height = descriptionRef.current.scrollHeight
      setFullHeight(height)
    }
  }, [isDescriptionExpanded, book.description])

  const handleWarningClick = (warning: any) => {
    // Just set the ID, let ContentWarningsList handle expansion and scrolling
    setFocusWarningId(warning.subcategory_id || warning.id)

    // Reset after a delay so it can be clicked again
    setTimeout(() => setFocusWarningId(null), 1000)
  }

  return (
    <div className="min-h-screen bg-background text-foreground font-sans selection:bg-foreground selection:text-background">
      <div className="container mx-auto px-4 py-12 max-w-6xl">
        {/* Navigation */}
        <div className="mb-12 flex items-center justify-between border-b border-border pb-4">
          {liveBookHref ? (
            <Link href={liveBookHref}>
              <Button
                variant="ghost"
                className="text-muted-foreground hover:text-foreground hover:bg-transparent pl-0 text-xs font-bold tracking-widest uppercase transition-colors"
              >
                ← View live page
              </Button>
            </Link>
          ) : (
            <Button
              variant="ghost"
              onClick={() => router.back()}
              className="text-muted-foreground hover:text-foreground hover:bg-transparent pl-0 text-xs font-bold tracking-widest uppercase transition-colors"
            >
              ← Back to Bookshelf
            </Button>
          )}
          <div className="flex items-center gap-4">
            <Link href="/scan">
              <Button variant="outline" size="sm" className="gap-2 text-xs font-bold tracking-widest uppercase">
                <ScanBarcode className="h-3 w-3" />
                Scan Another
              </Button>
            </Link>
            <div className="text-xs font-bold tracking-widest uppercase text-muted-foreground">
              Subtext v{APP_VERSION}
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-[380px_1fr] gap-8 lg:gap-16 items-start">
          {/* Left Column: Cover & Specs */}
          <div className="space-y-8 lg:sticky lg:top-8">
            {/* Section: Book cover. Any future badge overlaying the cover MUST use non-overlapping placement, descriptive aria-label, and keyboard-focusable control with visible focus ring. */}
            <section id="book-cover" aria-label="Book cover" className="relative aspect-[2/3] w-full shadow-[0_20px_40px_-10px_rgba(0,0,0,0.15)] bg-muted">
              {book.cover_url ? (
                <img
                  src={book.cover_url.startsWith('http')
                    ? `/api/book-cover?url=${encodeURIComponent(book.cover_url)}`
                    : book.cover_url}
                  alt={`Cover of ${book.title}`}
                  className="object-cover w-full h-full"
                  onError={(e) => {
                    // If image fails to load (CORS, broken URL, etc.), show placeholder
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    const parent = target.parentElement;
                    if (parent && !parent.querySelector('.cover-placeholder')) {
                      const placeholder = document.createElement('div');
                      placeholder.className = 'cover-placeholder w-full h-full flex items-center justify-center bg-muted text-muted-foreground font-serif italic text-sm';
                      placeholder.textContent = 'Image not available';
                      parent.appendChild(placeholder);
                    }
                  }}
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center gap-2 bg-muted text-muted-foreground">
                  <BookOpen className="h-10 w-10" />
                  <span className="font-serif italic text-sm">Cover unavailable</span>
                </div>
              )}
            </section>

            {/* Left overview: severity + spice + age (Key themes card below adds only triggers/tropes). */}
            {(() => {
              const hasWarnings = Array.isArray(warnings) && warnings.length > 0
              const noWarningsComplete = analysisStatus === 'complete' && Array.isArray(warnings) && warnings.length === 0
              const classificationTag = book.categories?.find((c: string) => c.startsWith('CLASSIFICATION:'))
              const classificationRating = classificationTag ? classificationTag.replace('CLASSIFICATION:', '') : null
              const showBlock = hasWarnings || noWarningsComplete || classificationRating
              if (!showBlock) return null

              const mildCount = hasWarnings ? warnings.filter((w: any) => w.severity !== 'moderate' && w.severity !== 'severe').length : 0
              const moderateCount = hasWarnings ? warnings.filter((w: any) => w.severity === 'moderate').length : 0
              const severeCount = hasWarnings ? warnings.filter((w: any) => w.severity === 'severe').length : 0
              const spiceLevel = hasWarnings ? computeSpiceLevel(warnings) : 0
              const ageRecommendations: Record<string, string> = {
                'G': 'All ages',
                'PG': 'Ages 8+',
                'M': 'Ages 13+',
                'MA15+': 'Ages 15+',
                'R18+': 'Ages 18+',
                'RC': 'Extreme content'
              }
              const ageLine = classificationRating ? (ageRecommendations[classificationRating] || classificationRating) : null
              const pillClass = classificationRating === 'G' || classificationRating === 'PG'
                ? 'bg-emerald-100 dark:bg-emerald-900/50 border-emerald-400/50 text-emerald-800 dark:text-emerald-200'
                : classificationRating === 'M'
                  ? 'bg-amber-100 dark:bg-amber-900/50 border-amber-400/50 text-amber-800 dark:text-amber-200'
                  : classificationRating === 'MA15+'
                    ? 'bg-orange-100 dark:bg-orange-900/50 border-orange-400/50 text-orange-800 dark:text-orange-200'
                    : classificationRating === 'R18+' || classificationRating === 'RC'
                      ? 'bg-red-100 dark:bg-red-900/50 border-red-400/50 text-red-800 dark:text-red-200'
                      : 'bg-primary/10 border-primary/50 text-primary'

              return (
                <div
                  className="rounded-xl border border-border/60 bg-muted/10 px-4 py-3"
                  role="region"
                  aria-label="Book overview: warning severity, spice level, and age classification"
                >
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">
                    {'Severity & rating'}
                  </p>
                  {hasWarnings ? (
                    <>
                      <div className="flex flex-wrap gap-0.5 mb-2">
                        {warnings.map((w: any, i: number) => {
                          const severity = w.severity === 'severe' ? 'severe' : w.severity === 'moderate' ? 'moderate' : 'mild'
                          const bg = severity === 'severe' ? 'bg-red-500' : severity === 'moderate' ? 'bg-orange-500' : 'bg-amber-500'
                          return (
                            <span
                              key={w.id || i}
                              className={`inline-block h-3 min-w-[6px] flex-1 max-w-[14px] rounded-sm ${bg} border border-white/20 dark:border-black/20`}
                              style={{ flexBasis: '6px' }}
                              aria-hidden
                            />
                          )
                        })}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Mild {mildCount} · Moderate {moderateCount} · Severe {severeCount}
                      </p>
                      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 mt-2">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Spice</span>
                        <span className="flex items-center gap-0.5" aria-label={`Spice level ${spiceLevel} of 3`}>
                          {[1, 2, 3].map((level) => (
                            <Flame
                              key={level}
                              className={cn(
                                'h-3 w-3 transition-all',
                                level <= spiceLevel
                                  ? 'fill-orange-500 text-orange-500'
                                  : 'text-muted-foreground/20'
                              )}
                            />
                          ))}
                        </span>
                      </div>
                    </>
                  ) : analysisStatus === 'complete' ? (
                    <p className="text-xs text-muted-foreground">No content warnings</p>
                  ) : (
                    <p className="text-xs text-muted-foreground">Content not yet analysed</p>
                  )}
                  {classificationRating && (() => {
                    const ratingDescriptions: Record<string, string> = {
                      'G': 'General — suitable for all ages.',
                      'PG': 'Parental guidance — some material may not be suitable for young children.',
                      'M': 'Mature — recommended for ages 13+. Not legally restricted.',
                      'MA15+': 'Mature Accompanied — not suitable for under 15. May include stronger themes, violence, or sexual content.',
                      'R18+': 'Restricted 18+ — legally restricted to adults. High-impact content.',
                      'RC': 'Refused Classification — extreme content.',
                    }
                    const ratingDescription = ratingDescriptions[classificationRating] ?? `Content rating: ${classificationRating}.`
                    return (
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span
                                className={`inline-flex items-center px-2.5 py-1 rounded-md text-sm font-bold border cursor-help ${pillClass}`}
                                aria-label={`Content rating: ${classificationRating}. ${ratingDescription}`}
                              >
                                {classificationRating}
                              </span>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="max-w-sm">
                              <div className="text-sm space-y-2">
                                <p>{ratingDescription}</p>
                                {ageLine && <p className="text-xs text-muted-foreground">{ageLine}</p>}
                                <p className="text-xs text-muted-foreground">
                                  The label reflects <strong>described content signals</strong> from this scan (severity and themes we could verify)—not genre, popularity, or reputation elsewhere online.
                                </p>
                                <p className="text-xs text-muted-foreground border-t border-border pt-2">
                                  Indicative rating from our analysis; not an official Australian Classification Board rating.{' '}
                                  <Link href="/faq#age-appropriateness" className="text-primary hover:underline underline-offset-2">
                                    How we determine age ratings
                                  </Link>
                                </p>
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                        {ageLine && <span className="text-xs text-muted-foreground">{ageLine}</span>}
                      </div>
                    )
                  })()}
                  <a
                    href="#content-analysis"
                    className="mt-2 inline-block text-xs font-medium text-primary hover:underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded"
                  >
                    See full content analysis
                  </a>
                </div>
              )
            })()}

            {/* Section: Specifications (non-heading label so outline is h1 → h2 Content analysis → h3) */}
            <section id="specifications" aria-label="Book specifications" className="border-t-2 border-border pt-6">
              <p className="font-sans text-xs font-bold uppercase tracking-widest mb-6 text-muted-foreground" aria-hidden="true">
                Specifications
              </p>
              <div className="space-y-4 font-sans text-sm">
                <div className="flex justify-between items-baseline border-b border-border pb-2">
                  <span className="font-medium text-muted-foreground">ISBN</span>
                  <span className="font-mono text-foreground">{book.isbn}</span>
                </div>
                {book.publisher && (
                  <div className="flex justify-between items-baseline border-b border-border pb-2">
                    <span className="font-medium text-muted-foreground">Publisher</span>
                    <span className="text-foreground text-right">{book.publisher}</span>
                  </div>
                )}
                {book.published_date &&
                  (() => {
                    const { text, approximate } = formatPublicationDateDisplay(book.published_date)
                    if (!text) return null
                    return (
                      <div className="flex justify-between items-baseline border-b border-border pb-2 gap-2">
                        <span className="font-medium text-muted-foreground shrink-0">Released</span>
                        <span className="text-foreground text-right">
                          {text}
                          {approximate ? (
                            <span
                              className="text-muted-foreground font-normal text-xs ml-1.5 whitespace-nowrap"
                              title="Source data marked this date as uncertain"
                            >
                              (approx.)
                            </span>
                          ) : null}
                        </span>
                      </div>
                    )
                  })()}
                {book.page_count && (
                  <div className="flex justify-between items-baseline border-b border-border pb-2">
                    <span className="font-medium text-muted-foreground">Length</span>
                    <span className="text-foreground">{book.page_count} pages</span>
                  </div>
                )}
              </div>
            </section>
          </div>

          {/* Right Column: Content */}
          <div className="space-y-12">
            {/* Section: Book info (title, author, ratings) */}
            <section id="book-info" aria-label="Book information" className="space-y-6">
              {/* Categories as Modernist Pills */}
              {book.categories && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {book.categories
                    .filter((c: string) => !c.startsWith('CLASSIFICATION:') && !c.startsWith('nyt:'))
                    .map((category: string, i: number) => (
                      <span
                        key={i}
                        className="px-3 py-1 text-[10px] font-bold uppercase tracking-widest border border-border text-muted-foreground rounded-full bg-card"
                      >
                        {category}
                      </span>
                    ))}
                  {/* Comfort Read Badge */}
                  {analysisStatus === 'complete' && warnings.length === 0 && (
                    <Badge
                      data-comfort-read="true"
                      className="px-3 py-1 text-[10px] font-medium tracking-wide rounded-full bg-forest/10 dark:bg-forest/20 text-forest border border-forest/30 dark:border-forest/40"
                    >
                      ✨ Comfort Read
                    </Badge>
                  )}
                </div>
              )}

              {/* Comfort Read Badge (if no categories) */}
              {(!book.categories || book.categories.length === 0) && analysisStatus === 'complete' && warnings.length === 0 && (
                <div className="mb-4">
                  <Badge
                    data-comfort-read="true"
                    className="px-3 py-1 text-[10px] font-medium tracking-wide rounded-full bg-forest/10 dark:bg-forest/20 text-forest border border-forest/30 dark:border-forest/40"
                  >
                    ✨ Comfort Read
                  </Badge>
                </div>
              )}

              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <h1 className="text-5xl md:text-7xl font-serif font-medium tracking-tight text-foreground leading-[1.1]">
                    {book.title}
                  </h1>
                  <div className="text-xl md:text-2xl font-serif italic text-muted-foreground border-l-2 border-border pl-6 py-1 mt-4">
                    by{" "}
                    {book.author ? (
                      <Link
                        href={`/bookshelf?author=${encodeURIComponent(book.author)}`}
                        className="hover:text-foreground transition-colors underline-offset-4 hover:underline"
                      >
                        {book.author}
                      </Link>
                    ) : (
                      "Unknown Author"
                    )}
                  </div>
                  <div className="flex gap-2 mt-4">
                    <BuyButton isbn={book.isbn} />
                    <ShareButton
                      title={book.title}
                      author={book.author || "Unknown Author"}
                      isbn={book.isbn}
                    />
                  </div>
                </div>
                {/* Severity Score Badge - Dev Only */}
                <div className="flex-shrink-0">
                  <SeverityScoreBadge warnings={warnings || []} bookTitle={book.title} />
              </div>
            </div>
            </section>

            {/* Section: Synopsis */}
            {book.description && (
            <section id="synopsis" aria-label="Synopsis">
            {(() => {
              const cleanDescription = book.description.replace(/<[^>]*>?/gm, '')
              const shouldTruncate = cleanDescription.length > DESCRIPTION_TRUNCATE_LENGTH

              const handleToggle = () => {
                if (!isDescriptionExpanded && descriptionRef.current) {
                  // Temporarily expand to measure height before animating
                  const currentMaxHeight = descriptionRef.current.style.maxHeight
                  descriptionRef.current.style.maxHeight = 'none'
                  const height = descriptionRef.current.scrollHeight
                  descriptionRef.current.style.maxHeight = currentMaxHeight
                  // Use requestAnimationFrame to ensure smooth transition
                  requestAnimationFrame(() => {
                    setFullHeight(height)
                    setIsDescriptionExpanded(true)
                  })
                } else {
                  // Collapse immediately - no pause
                  setFullHeight(null)
                  setIsDescriptionExpanded(false)
                }
              }

              return (
                <div className="prose prose-slate prose-lg max-w-none">
                  <div className="relative">
                    <div
                      ref={descriptionRef}
                      className="overflow-hidden transition-all duration-500 ease-in-out"
                      style={{
                        maxHeight: isDescriptionExpanded && fullHeight
                          ? `${fullHeight}px`
                          : '200px',
                      }}
                    >
                      <p className="text-muted-foreground leading-relaxed text-lg">
                        {cleanDescription}
                      </p>
                    </div>
                    {shouldTruncate && !isDescriptionExpanded && (
                      <div
                        className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-background via-background/95 to-transparent pointer-events-none transition-opacity duration-300 ease-in-out"
                      />
                    )}
                  </div>
                  {shouldTruncate && (
                    <button
                      onClick={handleToggle}
                      className="mt-4 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors underline-offset-4 hover:underline"
                    >
                      {isDescriptionExpanded ? 'Show less' : 'Read more'}
                    </button>
                  )}
                </div>
              )
            })()}
            </section>
            )}

            {/* Metadata Issues - Dev mode only */}
            {isDev && metadataIssues && (metadataIssues.missingCover || metadataIssues.missingDescription) && (
              <div className="mt-12 p-6 border border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/20 rounded-lg">
                <div className="flex items-start gap-3">
                  <Info className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 space-y-3">
                    <h4 className="font-medium text-amber-900 dark:text-amber-100">Metadata Limitations (Dev Mode)</h4>
                    <div className="space-y-2 text-sm text-amber-800 dark:text-amber-200">
                      {metadataIssues.missingCover && (
                        <div>
                          <p className="font-medium mb-1">Cover Image Not Available</p>
                          <p className="text-amber-700 dark:text-amber-300">{metadataIssues.coverReason || 'Cover image could not be sourced from available APIs.'}</p>
                        </div>
                      )}
                      {metadataIssues.missingDescription && (
                        <div>
                          <p className="font-medium mb-1">Limited Description</p>
                          <p className="text-amber-700 dark:text-amber-300">{metadataIssues.descriptionReason || 'Book description was minimal or unavailable from external sources.'}</p>
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-amber-700 dark:text-amber-300 italic mt-3">
                      Analysis was performed using available information. Results may be less comprehensive due to limited metadata.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Section: Content Analysis (warnings, age recommendation, list) */}
            <section id="content-analysis" aria-label="Content analysis" className="mt-16">
              <div className="flex items-center gap-4 mb-4">
                <div className="h-px bg-border flex-1"></div>
                <h2 className="font-serif text-2xl text-foreground italic">Content Analysis</h2>
                <div className="h-px bg-border flex-1"></div>
              </div>

              {!isDev &&
                shouldSuggestDeepScan({
                  analysisStatus,
                  warnings: warnings || [],
                  analysisMeta: analysisMeta ?? null,
                  description: book?.description || '',
                }) && (
                  <div className="mb-6 max-w-2xl mx-auto rounded-lg border border-border/80 bg-muted/20 px-4 py-3 text-sm text-foreground/90">
                    <p className="text-sm">
                      This result is mainly from the available synopsis and metadata. A{' '}
                      <strong>Deep scan</strong> is slower but can surface more detail when the blurb is short or thin.
                    </p>
                    <Link
                      href={`/scan?isbn=${encodeURIComponent(book.isbn)}&scanMode=deep`}
                      className="mt-2 inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded"
                    >
                      <ScanBarcode className="h-4 w-4 shrink-0" aria-hidden />
                      Run Deep scan for this book
                    </Link>
                  </div>
                )}

              {/* Transparency line: what this analysis is based on (Dev mode only) */}
              {isDev && (
                <div className="mb-6 max-w-2xl mx-auto text-xs text-muted-foreground">
                  {(() => {
                    const descriptionLength = (book?.description || '').length
                    const crossChecked = Array.isArray(warnings)
                      ? warnings.some((w: any) => w?.evidence?.[0]?.model_source === 'both')
                      : false
                    const votesPresent = Array.isArray(warnings)
                      ? warnings.some((w: any) => (w?.helpful_count || 0) + (w?.not_helpful_count || 0) > 0)
                      : false
                    const pipeline = analysisMeta?.pipelinePath?.includes('quick')
                      ? 'Quick'
                      : analysisMeta?.pipelinePath?.includes('deep')
                        ? 'Deep'
                        : null
                    const enrichment = (() => {
                      if (!analysisMeta) return null
                      const p = analysisMeta.pipelinePath || ''
                      if (p.includes('->enriched')) return 'Yes'
                      if (p.includes('->enrich_attempted')) return 'Attempted'
                      return analysisMeta.usedWebSearch ? 'Yes' : 'No'
                    })()
                    const isThin = analysisMeta?.hadThinMetadata === true || descriptionLength < 200
                    const shouldSuggestDeep =
                      analysisStatus === 'complete' &&
                      (pipeline === 'Quick' || isThin || !crossChecked || !votesPresent)
                    return (
                      <div className="flex items-start gap-2">
                        <Info className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                        <div className="min-w-0">
                          <div className="font-medium text-foreground mb-2">Based on</div>
                          <div className="flex flex-wrap gap-1.5 items-center">
                            <Badge variant="outline" className="text-[10px] font-medium h-6 px-2 font-mono">
                              {descriptionLength} chars
                            </Badge>
                            {pipeline ? (
                              <Badge
                                variant="secondary"
                                className={cn(
                                  'text-[10px] h-6 px-2 font-medium',
                                  pipeline === 'Deep' && 'bg-violet-100 text-violet-900 dark:bg-violet-900/40 dark:text-violet-100'
                                )}
                              >
                                {pipeline}
                              </Badge>
                            ) : null}
                            {enrichment != null ? (
                              <Badge variant="outline" className="text-[10px] h-6 px-2 font-medium">
                                Web: {enrichment}
                              </Badge>
                            ) : null}
                            <Badge
                              className={cn(
                                'text-[10px] h-6 px-2 font-medium border-0',
                                crossChecked
                                  ? 'bg-emerald-600 text-white hover:bg-emerald-600'
                                  : 'bg-amber-100 text-amber-950 dark:bg-amber-900/50 dark:text-amber-50'
                              )}
                            >
                              Verified: {crossChecked ? 'Yes' : 'No'}
                            </Badge>
                          </div>
                          {shouldSuggestDeep && (
                            <div className="mt-3">
                              <Link href={`/scan?isbn=${encodeURIComponent(book.isbn)}&scanMode=deep`}>
                                <Button variant="outline" size="sm" className="gap-2">
                                  <ScanBarcode className="h-4 w-4" />
                                  Run Deep scan
                                </Button>
                              </Link>
                              <div className="mt-1 text-[10px] text-muted-foreground">
                                Deep scan is slower but can catch warnings that don’t appear in descriptions.
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })()}
                </div>
              )}

              {/* Trust: how warnings are produced (teaser always visible; details on expand) */}
              {getVariantConfig().flags?.showHowWeGenerate !== false && (
                <div className="mb-8 max-w-2xl mx-auto rounded-xl border border-primary/20 bg-primary/[0.04] dark:bg-primary/10 px-4 py-4 shadow-sm">
                  <div className="flex gap-3">
                    <Sparkles className="h-5 w-5 text-primary shrink-0 mt-0.5" aria-hidden />
                    <div className="min-w-0 flex-1 space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-sm font-semibold text-foreground">{HOW_WE_GENERATE_LABEL}</h3>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button
                                type="button"
                                className="inline-flex p-0.5 rounded-md text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                aria-label="More about how Subtext generates warnings"
                              >
                                <Info className="h-3.5 w-3.5" />
                              </button>
                            </TooltipTrigger>
                            <TooltipContent side="bottom" className="max-w-xs text-xs">
                              Advisory only. Warnings tie to this book’s verified text and metadata; severity uses a
                              fixed formula, not opinion or genre stereotypes.{' '}
                              <Link href="/faq" className="text-primary underline underline-offset-2">
                                FAQ
                              </Link>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed">{CONTENT_WARNING_GENERATION_TEASER}</p>
                      <Collapsible open={isHowWeGenerateOpen} onOpenChange={setIsHowWeGenerateOpen}>
                        <CollapsibleTrigger
                          id="how-we-generate-trigger"
                          aria-expanded={isHowWeGenerateOpen}
                          aria-controls="how-we-generate-cw-explanation"
                          className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded"
                        >
                          Read full explanation
                          {isHowWeGenerateOpen ? (
                            <ChevronUp className="h-3.5 w-3.5 shrink-0" aria-hidden />
                          ) : (
                            <ChevronDown className="h-3.5 w-3.5 shrink-0" aria-hidden />
                          )}
                        </CollapsibleTrigger>
                        <CollapsibleContent id="how-we-generate-cw-explanation" className="pt-2">
                          <p className="text-sm text-muted-foreground leading-relaxed border-t border-border/60 pt-3">
                            {CONTENT_WARNING_GENERATION_EXPLANATION}
                          </p>
                        </CollapsibleContent>
                      </Collapsible>
                    </div>
                  </div>
                </div>
              )}

              {/* Key themes: moderate+ triggers and tropes (severity lives under cover) */}
              {getVariantConfig().flags?.showBookTokSummary !== false && warnings && warnings.length > 0 && (
                <BooktokWarningsSummary warnings={warnings} onWarningClick={handleWarningClick} />
              )}

              {/* Disclaimer (text-foreground/80 for WCAG AA contrast) */}
              <p className="text-sm text-foreground/80 italic mb-6 text-center max-w-2xl mx-auto">
                Content warnings help readers make informed choices — they're not judgments about books or readers.
              </p>

              {/* Dynamic Reader Summary: lead line above the list (hidden in lite; text-foreground/80 for WCAG AA) */}
              {getVariantConfig().flags?.showBookTokSummary !== false && warnings && warnings.length > 0 && (
                <p className="mb-6 text-sm text-foreground/80 font-serif italic border-l-2 border-border pl-4">
                  <span className="text-foreground font-medium not-italic">In short: </span>
                  {generateSummary(warnings)}
                </p>
              )}

              <ContentWarningsList
                warnings={warnings}
                isAuthorApproved={warnings.some((w: any) => w.is_author_approved === true)}
                analysisStatus={analysisStatus}
                isbn={book.isbn}
                noWarningsReasoning={noWarningsReasoning}
                focusWarningId={focusWarningId}
                authorContentWarningsUrl={book?.author_content_warnings_url ?? null}
                authorContentWarningsList={authorContentWarningsList ?? null}
                displayVariant={displayVariant}
                onReportWarning={(warningId) => {
                  setAppealPreselectedWarningIds([warningId])
                  setAppealDialogOpen(true)
                }}
              />

              {/* Report a mistake (appeals) + general feedback */}
              <div id="feedback" className="mt-12 pt-8 border-t border-border">
                <div className="flex flex-col items-center justify-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-transparent focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    onClick={() => {
                      setAppealPreselectedWarningIds([])
                      setAppealDialogOpen(true)
                    }}
                  >
                    <Flag className="h-3.5 w-3.5 mr-1.5" />
                    Report a mistake
                  </Button>
                  <AppealDialog
                    open={appealDialogOpen}
                    onOpenChange={setAppealDialogOpen}
                    bookId={book.id}
                    isbn={book.isbn}
                    bookTitle={book.title}
                    warnings={warnings.map((w: any) => ({
                      id: w.id,
                      label: w.description || w.category || String(w.subcategory_id || w.category_id || "Warning"),
                    }))}
                    initialWarningIds={appealPreselectedWarningIds}
                  />
                  <FeedbackDialog
                    trigger={
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-transparent focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      >
                        General feedback
                      </Button>
                    }
                    pageUrl={typeof window !== 'undefined' ? window.location.href : undefined}
                    defaultFeedbackType="content_issue"
                    context={{
                      bookId: book.id,
                      bookTitle: book.title,
                      bookAuthor: book.author,
                      bookIsbn: book.isbn,
                      warningsCount: warnings.length,
                      analysisStatus: analysisStatus,
                      metadataIssues: metadataIssues || undefined,
                    }}
                  />
                </div>
              </div>
            </section>

            {/* Source Attribution (TOS Compliance) */}
            {/* Note: We display Google Books attribution by default as it's the primary source.
                If we had source tracking in the book object, we could conditionally show Open Library attribution. */}
            <GoogleBooksAttribution isbn={book.isbn} className="mt-8" />

            {/* Dev-Only: Collapsible Audit History */}
            {isDev && showAuditTrail && (
              <div className="mt-12 border-t border-border pt-8">
                <Collapsible open={isAuditOpen} onOpenChange={setIsAuditOpen} className="w-full space-y-4">
                  <div className="flex items-center justify-between group cursor-pointer" onClick={() => setIsAuditOpen(!isAuditOpen)}>
                    <div className="flex items-center gap-2">
                      <Code className="h-3 w-3 text-muted-foreground" />
                      <h3 className="font-sans text-xs font-bold uppercase tracking-widest text-muted-foreground group-hover:text-foreground transition-colors">
                        [DEV] System Logs & Audit Trail
                      </h3>
                    </div>
                    <Button variant="ghost" size="sm" className="w-9 p-0 text-muted-foreground group-hover:text-foreground">
                      {isAuditOpen ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                      <span className="sr-only">Toggle Audit Logs</span>
                    </Button>
                  </div>
                  <CollapsibleContent className="space-y-2">
                    <div className="bg-muted rounded-lg p-6 border border-border font-mono text-sm">
                      <AuditHistory bookId={book.id} />
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
