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

export function BookDetails({ book, warnings, analysisStatus = 'unknown', metadataIssues, noWarningsReasoning, analysisMeta }: BookDetailsProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isAuditOpen, setIsAuditOpen] = useState(false)
  const [isDev, setIsDev] = useState(false)
  const [showAuditTrail, setShowAuditTrail] = useState(false)
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false)
  const descriptionRef = useRef<HTMLDivElement>(null)
  const [fullHeight, setFullHeight] = useState<number | null>(null)
  const [focusWarningId, setFocusWarningId] = useState<string | null>(null)

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
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="text-muted-foreground hover:text-foreground hover:bg-transparent pl-0 text-xs font-bold tracking-widest uppercase transition-colors"
          >
            ← Back to Bookshelf
          </Button>
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
            {/* Cover Image - Sharp, elegant shadow */}
            <div className="relative aspect-[2/3] w-full shadow-[0_20px_40px_-10px_rgba(0,0,0,0.15)] bg-muted">
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
            </div>

            {/* Specs Table - Clean, Modernist lines */}
            <div className="border-t-2 border-border pt-6">
              <h3 className="font-sans text-xs font-bold uppercase tracking-widest mb-6 text-muted-foreground">
                Specifications
              </h3>
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
            </div>
          </div>

          {/* Right Column: Content */}
          <div className="space-y-12">
            {/* Header */}
            <div className="space-y-6">
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
                      className="px-3 py-1 text-[10px] font-medium tracking-wide rounded-full bg-teal-50 dark:bg-teal-950/30 text-teal-700 dark:text-teal-300 border-teal-200 dark:border-teal-800"
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
                    className="px-3 py-1 text-[10px] font-medium tracking-wide rounded-full bg-teal-50 dark:bg-teal-950/30 text-teal-700 dark:text-teal-300 border-teal-200 dark:border-teal-800"
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
                        href={`/collection?author=${encodeURIComponent(book.author)}`}
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
                  {/* Australian Classification Rating */}
                  {(() => {
                    const classificationTag = book.categories?.find((c: string) => c.startsWith('CLASSIFICATION:'))
                    const classificationRating = classificationTag ? classificationTag.replace('CLASSIFICATION:', '') : null
                    
                    // Generate explanation based on classification and warnings
                    const getClassificationExplanation = (rating: string): { main: string; process: string; disclaimer: string } => {
                      const severeCount = warnings.filter((w: any) => w.severity === 'severe').length
                      const moderateCount = warnings.filter((w: any) => w.severity === 'moderate').length
                      const mildCount = warnings.filter((w: any) => w.severity === 'mild').length
                      
                      let mainExplanation = ''
                      switch (rating) {
                        case 'G':
                          mainExplanation = 'General: Suitable for all ages. Contains no material likely to offend or harm.'
                          break
                        case 'PG':
                          mainExplanation = `Parental Guidance: May contain mild themes or content. ${mildCount > 0 ? `Includes ${mildCount} mild content warning${mildCount > 1 ? 's' : ''}.` : 'No specific content warnings.'}`
                          break
                        case 'M':
                          mainExplanation = `Mature: Recommended for ages 15+. ${moderateCount > 0 ? `Contains ${moderateCount} moderate content warning${moderateCount > 1 ? 's' : ''}.` : severeCount > 0 ? `Contains ${severeCount} severe content warning${severeCount > 1 ? 's' : ''}.` : 'Contains mature themes.'}`
                          break
                        case 'MA15+':
                          mainExplanation = `Mature Accompanied: Restricted to ages 15+. ${severeCount > 0 ? `Contains ${severeCount} severe content warning${severeCount > 1 ? 's' : ''} including graphic or intense content.` : moderateCount > 0 ? `Contains ${moderateCount} moderate content warning${moderateCount > 1 ? 's' : ''} with mature themes.` : 'Contains intense or graphic content.'}`
                          break
                        case 'R18+':
                          mainExplanation = `Restricted: Adults only (18+). Contains explicit content including ${severeCount > 0 ? `${severeCount} severe warning${severeCount > 1 ? 's' : ''}` : 'graphic material'} that may be disturbing or offensive.`
                          break
                        default:
                          mainExplanation = `Content Rating: ${rating}. Based on content analysis.`
                      }
                      
                      const processExplanation = 'How it works: Our AI analyzes the book\'s content and assigns severity scores (0.0-1.0) to each warning. The classification is determined by the highest severity found—severe warnings indicate MA15+/R18+, moderate indicates M, mild indicates PG, and no warnings indicates G.'
                      
                      const disclaimer = 'This is an indicative rating only. We have no association with the Australian Classification Board and this is not an official rating.'
                      
                      return { main: mainExplanation, process: processExplanation, disclaimer }
                    }
                    
                    return classificationRating && (
                      <div className="flex items-center gap-2 mt-4">
                        <span className="text-sm font-medium text-muted-foreground">Content Rating:</span>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="flex items-center gap-1.5 cursor-help">
                                <span className="text-sm font-semibold bg-primary/10 text-primary px-3 py-1 rounded-full border border-primary/20">
                                  {classificationRating}
                                </span>
                                <Info className="h-3.5 w-3.5 text-muted-foreground" />
                              </div>
                            </TooltipTrigger>
                            <TooltipContent side="right" className="max-w-sm">
                              <div className="text-sm space-y-3">
                                <p>{getClassificationExplanation(classificationRating).main}</p>
                                <div className="border-t border-border pt-2">
                                  <p className="text-xs text-muted-foreground mb-2">
                                    {getClassificationExplanation(classificationRating).process}
                                  </p>
                                  <p className="text-xs text-muted-foreground italic">
                                    {getClassificationExplanation(classificationRating).disclaimer}
                                  </p>
                                </div>
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
            </div>

            {/* Synopsis */}
            {book.description && (() => {
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

            {/* Content Warnings - The "Feature" Block */}
            <div className="mt-16">
              <div className="flex items-center gap-4 mb-4">
                <div className="h-px bg-border flex-1"></div>
                <h3 className="font-serif text-2xl text-foreground italic">Content Analysis</h3>
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
              
              {/* Quick Glance Summary */}
              {warnings && warnings.length > 0 && (
                <BooktokWarningsSummary warnings={warnings} onWarningClick={handleWarningClick} />
              )}
              
              {/* Age Rating - Prominent Display for Parents */}
              {(() => {
                const classificationTag = book.categories?.find((c: string) => c.startsWith('CLASSIFICATION:'))
                const classificationRating = classificationTag ? classificationTag.replace('CLASSIFICATION:', '') : null
                
                if (!classificationRating) {
                  // Age rating will be calculated server-side during scan
                  // If not present, it means the book hasn't been scanned with the new version yet
                  return null
                }
                
                // Calculate age recommendation from rating
                const ageRecommendations: Record<string, string> = {
                  'G': 'Suitable for all ages',
                  'PG': 'Recommended for ages 8+',
                  'M': 'Recommended for ages 13+',
                  'MA15+': 'Recommended for ages 15+',
                  'R18+': 'Recommended for ages 18+',
                  'RC': 'Not recommended - contains extreme content'
                }
                const ageRecommendation = ageRecommendations[classificationRating] || 'See content warnings below'
                
                // Get key elements for display
                const elementMap: Record<string, string> = {
                  'violence': 'violence',
                  'sexual_content': 'sex',
                  'language': 'language',
                  'substance_use_or_alcohol': 'drug use',
                  'mental_health': 'themes',
                  'abuse': 'themes',
                  'emotional_abuse_or_toxic_relationships': 'themes',
                  'death_or_grief': 'themes',
                  'family_dynamics': 'themes'
                }
                
                const elementCounts: Record<string, number> = {}
                warnings?.forEach((w: any) => {
                  const cat = w.category_id || w.category || 'other'
                  const element = elementMap[cat] || 'themes'
                  elementCounts[element] = (elementCounts[element] || 0) + 1
                })
                
                const topElements = Object.entries(elementCounts)
                  .sort(([, a], [, b]) => b - a)
                  .slice(0, 3)
                  .map(([element]) => element.charAt(0).toUpperCase() + element.slice(1))
                
                const elementsText = topElements.length > 0 ? topElements.join(', ') : 'various themes'
                
                return (
                  <div className="mb-6 p-4 bg-primary/10 border-2 border-primary/30 rounded-lg max-w-2xl mx-auto">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-lg font-bold text-foreground">Age Recommendation</h3>
                      <span className="text-2xl font-bold text-primary">{classificationRating}</span>
                    </div>
                    <p className="text-sm font-semibold text-foreground mb-1">{ageRecommendation}</p>
                    <p className="text-xs text-muted-foreground">
                      Based on analysis of {elementsText}. This rating follows Australian Classification Board methodology, assessing the six classifiable elements (themes, violence, sex, language, drug use, nudity) based on impact factors including emphasis, tone, frequency, context, detail, and cumulative effect.
                    </p>
                    <p className="text-xs text-muted-foreground italic mt-2">
                      This is an indicative rating only. We have no association with the Australian Classification Board and this is not an official rating.
                    </p>
                  </div>
                )
              })()}
              
              {/* Disclaimer */}
              <p className="text-sm text-muted-foreground italic mb-6 text-center max-w-2xl mx-auto">
                Content warnings help readers make informed choices — they're not judgments about books or readers.
              </p>

              {/* Dynamic Reader Summary */}
              {warnings && warnings.length > 0 && (
                <div className="mb-8 p-6 bg-muted/30 border border-border rounded-lg">
                  <p className="text-base leading-relaxed font-serif text-foreground italic">
                    {generateSummary(warnings)}
                  </p>
                </div>
              )}


              <ContentWarningsList
                warnings={warnings}
                isAuthorApproved={warnings.some((w: any) => w.is_author_approved === true)}
                analysisStatus={analysisStatus}
                isbn={book.isbn}
                noWarningsReasoning={noWarningsReasoning}
                focusWarningId={focusWarningId}
              />

              {/* Feedback / Report Section */}
              <div className="mt-12 pt-8 border-t border-border">
                <div className="flex flex-col items-center justify-center">
                  <FeedbackDialog
                    trigger={
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-transparent"
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
            </div>

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
