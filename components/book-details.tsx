"use client"

import { ContentWarningsList } from "@/components/content-warnings-list"
import { BooktokWarningsSummary } from "@/components/booktok-warnings-summary"
import { AuditHistory } from "@/components/audit-history"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, ChevronDown, ChevronUp, Code, ScanBarcode, Flag, BookOpen } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"
import { useState, useEffect, useRef } from "react"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import Link from "next/link"
import { SeverityScoreBadge } from "@/components/severity-score-badge"
import { GoogleBooksAttribution } from "@/components/google-books-attribution"
import { ShareButton } from "@/components/ShareButton"
import { BuyButton } from "@/components/BuyButton"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Info } from "lucide-react"
import { getSubcategoryById } from "@/lib/config/taxonomy-v2"
import { APP_VERSION } from "@/lib/config/version"
import { generateSummary } from "@/lib/services/warning-renderer"
import { FeedbackDialog } from "@/components/feedback-dialog"
import { CONTENT_WARNING_GENERATION_EXPLANATION, HOW_WE_GENERATE_LABEL } from "@/lib/content-warning-explanation"
import { getVariantConfig } from "@/lib/config/variants"

const DESCRIPTION_TRUNCATE_LENGTH = 600

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

            {/* Content at a glance: severity bar + counts + age classification (above Specifications) */}
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
                  aria-label="Content at a glance"
                >
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
                    </>
                  ) : (
                    <p className="text-xs text-muted-foreground">No content warnings</p>
                  )}
                  {classificationRating && (
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-md text-sm font-bold border ${pillClass}`}
                        aria-label={`Content rating: ${classificationRating}`}
                      >
                        {classificationRating}
                      </span>
                      {ageLine && <span className="text-xs text-muted-foreground">{ageLine}</span>}
                    </div>
                  )}
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
                {book.published_date && (
                  <div className="flex justify-between items-baseline border-b border-border pb-2">
                    <span className="font-medium text-muted-foreground">Released</span>
                    <span className="text-foreground">{book.published_date}</span>
                  </div>
                )}
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
                  {/* Subtext Suitability Scale (SSS) - Primary Rating (always show row; use "Not yet assessed" when no level) */}
                  {(() => {
                    const sssConfig: Record<string, { label: string; description: string; bg: string; text: string; border: string }> = {
                      'S0_NO_INPUT': {
                        label: 'Not yet assessed',
                        description: 'No description or community content was available, so emotional intensity could not be assessed.',
                        bg: 'bg-muted',
                        text: 'text-muted-foreground',
                        border: 'border-border'
                      },
                      'S1_GENTLE': {
                        label: 'S1 – Gentle',
                        description: 'Very low-intensity content with only brief or background difficulty.',
                        bg: 'bg-green-100 dark:bg-green-900/30',
                        text: 'text-green-700 dark:text-green-300',
                        border: 'border-green-300 dark:border-green-700'
                      },
                      'S2_MILD': {
                        label: 'S2 – Mild',
                        description: 'Some upsetting moments (brief bullying, sad events, mild peril), overall light tone.',
                        bg: 'bg-yellow-100 dark:bg-yellow-900/30',
                        text: 'text-yellow-700 dark:text-yellow-300',
                        border: 'border-yellow-300 dark:border-yellow-700'
                      },
                      'S3_MODERATE': {
                        label: 'S3 – Moderate',
                        description: 'Recurring difficult content such as bullying, abuse, discrimination, grief, or violence; important to the plot, generally non-graphic.',
                        bg: 'bg-orange-100 dark:bg-orange-900/30',
                        text: 'text-orange-700 dark:text-orange-300',
                        border: 'border-orange-300 dark:border-orange-700'
                      },
                      'S4_INTENSE': {
                        label: 'S4 – Intense',
                        description: 'Frequent, sustained, or detailed depictions of distressing content (severe abuse, torture, graphic violence, sexual assault, extreme discrimination, or real-world trauma).',
                        bg: 'bg-red-100 dark:bg-red-900/30',
                        text: 'text-red-700 dark:text-red-300',
                        border: 'border-red-300 dark:border-red-700'
                      },
                    }
                    const level = book.sss_level ?? null
                    const config = (level && sssConfig[level]) ? sssConfig[level] : sssConfig['S0_NO_INPUT']

                    return (
                      <div className="flex items-center gap-2 mt-4">
                        <span className="text-sm font-medium text-muted-foreground">Subtext Suitability:</span>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="flex items-center gap-1.5 cursor-help">
                                <span className={`text-sm font-semibold px-3 py-1 rounded-full border ${config.bg} ${config.text} ${config.border}`}>
                                  {config.label}
                                </span>
                                <Info className="h-3.5 w-3.5 text-muted-foreground" />
                              </div>
                            </TooltipTrigger>
                            <TooltipContent side="right" className="max-w-sm">
                              <div className="text-sm space-y-2">
                                <p>{config.description}</p>
                                {((level === 'S0_NO_INPUT' || !level || isDev) && book.sss_notes) && (
                                  <p className="text-xs text-muted-foreground italic border-t border-border pt-2">
                                    Notes: {book.sss_notes}
                                  </p>
                                )}
                                <p className="text-xs text-muted-foreground border-t border-border pt-2">
                                  The Subtext Suitability Scale (SSS) reflects how emotionally intense a book may feel to sensitive readers.
                                </p>
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    )
                  })()}
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
                    const shouldSuggestDeep = analysisStatus === 'complete' && (pipeline === 'Quick' || isThin || !crossChecked || !votesPresent)
                    const parts = [
                      `Description: ${descriptionLength} chars`,
                      pipeline ? `Mode: ${pipeline}` : null,
                      enrichment ? `Web enrichment: ${enrichment}` : null,
                      `Verified: ${crossChecked ? 'Yes' : 'No'}`,
                    ].filter(Boolean)
                    return (
                      <div className="flex items-start gap-2">
                        <Info className="h-4 w-4 mt-0.5 text-muted-foreground" />
                        <div>
                          <div className="font-medium text-foreground">Based on</div>
                          <div>{parts.join(' • ')}</div>
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

              {/* Quick Glance (includes severity overview bar + key triggers / tropes / spice) */}
              {getVariantConfig().flags?.showBookTokSummary !== false && warnings && warnings.length > 0 && (
                <BooktokWarningsSummary warnings={warnings} onWarningClick={handleWarningClick} />
              )}

              {/* Disclaimer (text-foreground/80 for WCAG AA contrast) */}
              <p className="text-sm text-foreground/80 italic mb-6 text-center max-w-2xl mx-auto">
                Content warnings help readers make informed choices — they're not judgments about books or readers.
              </p>

              {/* How we generate these — expandable (hidden in lite) */}
              {getVariantConfig().flags?.showHowWeGenerate !== false && (
                <Collapsible
                  open={isHowWeGenerateOpen}
                  onOpenChange={setIsHowWeGenerateOpen}
                  className="mb-6 flex flex-col items-center"
                >
                  <CollapsibleTrigger
                    id="how-we-generate-trigger"
                    aria-expanded={isHowWeGenerateOpen}
                    aria-controls="how-we-generate-cw-explanation"
                    className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded px-1 -mx-1"
                  >
                    {HOW_WE_GENERATE_LABEL}
                    {isHowWeGenerateOpen ? (
                      <ChevronUp className="h-3.5 w-3.5 shrink-0" aria-hidden />
                    ) : (
                      <ChevronDown className="h-3.5 w-3.5 shrink-0" aria-hidden />
                    )}
                  </CollapsibleTrigger>
                  <CollapsibleContent id="how-we-generate-cw-explanation" className="w-full max-w-2xl">
                    <p className="text-sm text-muted-foreground mt-2 text-center">
                      {CONTENT_WARNING_GENERATION_EXPLANATION}
                    </p>
                  </CollapsibleContent>
                </Collapsible>
              )}

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
              />

              {/* Feedback / Report Section */}
              <div id="feedback" className="mt-12 pt-8 border-t border-border">
                <div className="flex flex-col items-center justify-center">
                  <FeedbackDialog
                    trigger={
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-transparent focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      >
                        <Flag className="h-3.5 w-3.5 mr-1.5" />
                        Found an error? Report this book.
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
