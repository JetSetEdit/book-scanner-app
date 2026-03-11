/**
 * Book Page Route - Enhanced with SEO-friendly stub pages
 * 
 * This route implements programmatic SEO by creating indexable landing pages
 * for books that haven't been scanned yet. When a book doesn't exist in Subtext,
 * we fetch metadata from external sources (Open Library, Google Books) and display
 * a helpful stub page that can be indexed by search engines.
 * 
 * SEO Quality Gates:
 * - Invalid ISBNs (wrong length, checksum failure) → 404
 * - Valid ISBNs without minimum metadata (title + author) → 200 OK with `noindex`
 * - Valid ISBNs with minimum metadata → 200 OK, indexable
 * 
 * This follows the "future-complete page" pattern used by Goodreads, StoryGraph, etc.
 */

import { BookDetails } from "@/components/book-details"
import { SponsoredCard } from "@/components/sponsored-card"
import { supabaseAdmin } from "@/lib/supabase/admin"
import { getWarningsForBookExcludingAppeals } from "@/lib/warnings-for-book"
import { fetchBookByISBN } from "@/lib/book-api"
import { validateISBNWithChecksum } from "@/lib/isbn-validation"
import { BookStubPage } from "@/components/book-stub-page"
import { monetizationConfig, defaultResultsFooterSponsor } from "@/lib/config/monetization"
import { notFound } from "next/navigation"
import type { Metadata } from "next"
import { calculateAgeRating, type ClassificationRating } from "@/lib/utils/age-rating"
import type { EnhancedContentWarning } from "@/lib/config/taxonomy-context"

interface BookPageProps {
  params: Promise<{
    isbn: string
  }>
}

// Generate metadata for SEO
export async function generateMetadata({ params }: BookPageProps): Promise<Metadata> {
  const { isbn } = await params
  const supabase = supabaseAdmin

  // Check if book exists in Subtext
  const { data: book } = await supabase.from("books").select("*").eq("isbn", isbn).single()

  if (book) {
    // Full page with content warnings
    return {
      title: `${book.title} – Content Warnings | Subtext Scanner`,
      description: `View content warnings for ${book.title}${book.author ? ` by ${book.author}` : ''}. Discover what's inside before you read.`,
      openGraph: {
        title: `${book.title} – Content Warnings`,
        description: `View content warnings for ${book.title}${book.author ? ` by ${book.author}` : ''}.`,
        type: "website",
        images: book.cover_url ? [book.cover_url] : [],
      },
    }
  }

  // Try to fetch metadata for stub page
  const externalMetadata = await fetchBookByISBN(isbn)
  const hasMinimumMetadata = externalMetadata && externalMetadata.title && externalMetadata.author

  if (hasMinimumMetadata) {
    // Stub page with metadata
    return {
      title: `${externalMetadata.title} – Scan for Content Warnings | Subtext Scanner`,
      description: `Check content warnings for ${externalMetadata.title}${externalMetadata.author ? ` by ${externalMetadata.author}` : ''}. Scan this book with Subtext Scanner to unlock community-reviewed warnings before you read.`,
      openGraph: {
        title: `${externalMetadata.title} – Scan for Content Warnings`,
        description: `Check content warnings for ${externalMetadata.title}${externalMetadata.author ? ` by ${externalMetadata.author}` : ''}.`,
        type: "website",
        images: externalMetadata.cover_url ? [externalMetadata.cover_url] : [],
      },
      robots: {
        index: true,
        follow: true,
      },
    }
  }

  // Fallback metadata
  return {
    title: `Book ${isbn} – Subtext Scanner`,
    description: "Scan this book to unlock content warnings and help others read safely.",
    robots: {
      index: false,
      follow: true,
    },
  }
}

export default async function BookPage({ params }: BookPageProps) {
  const { isbn } = await params
  const supabase = supabaseAdmin

  // Step 1: Validate ISBN format and checksum
  // Quality gate: Invalid ISBNs return 404 to avoid polluting search index
  if (!validateISBNWithChecksum(isbn)) {
    // Invalid ISBN (wrong length, checksum failure, non-ISBN characters) → 404
    notFound()
  }

  // Step 2: Check if book exists in Subtext database
  const { data: book, error: bookError } = await supabase.from("books").select("*").eq("isbn", isbn).single()

  // Step 3: If book doesn't exist, fetch external metadata and show stub page
  // This creates SEO-friendly landing pages for unscanned books
  if (bookError || !book) {
    const externalMetadata = await fetchBookByISBN(isbn)
    
    // Quality gate: Only index pages with minimum metadata (title + author)
    // Pages without minimum metadata return 200 OK but with `noindex` directive
    // This prevents indexing low-quality pages while maintaining helpful UX
    const hasMinimumMetadata = externalMetadata && externalMetadata.title && externalMetadata.author
    const shouldIndex = hasMinimumMetadata === true

    return (
      <>
        {/* JSON-LD structured data for stub pages (schema.org Book schema)
            Only included when minimum metadata is available to ensure quality.
            Helps Google understand page content and improves rich snippet eligibility. */}
        {hasMinimumMetadata && (
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify({
                "@context": "https://schema.org",
                "@type": "Book",
                isbn: isbn,
                name: externalMetadata.title,
                ...(externalMetadata.author && {
                  author: {
                    "@type": "Person",
                    name: externalMetadata.author,
                  },
                }),
                ...(externalMetadata.cover_url && {
                  image: externalMetadata.cover_url,
                }),
                ...(externalMetadata.publisher && {
                  publisher: {
                    "@type": "Organization",
                    name: externalMetadata.publisher,
                  },
                }),
                url: process.env.NEXT_PUBLIC_SITE_URL 
                  ? `${process.env.NEXT_PUBLIC_SITE_URL}/book/${isbn}`
                  : `https://subtextscanner.com.au/book/${isbn}`,
                ...(externalMetadata.source === "openlibrary" && {
                  sameAs: `https://openlibrary.org/isbn/${isbn}`,
                }),
              }),
            }}
          />
        )}

        <BookStubPage 
          isbn={isbn} 
          metadata={externalMetadata}
          shouldIndex={shouldIndex}
        />
      </>
    )
  }


  // Fetch content warnings, excluding any under open appeal (suppressed until resolution)
  const warnings = await getWarningsForBookExcludingAppeals(supabase, book.id)

  // Fetch audit logs to determine if analysis has been completed and get metadata issues
  // Also fetch ai_reasoning for dev mode display when no warnings were found
  const { data: auditLogs } = await supabase
    .from("ai_audit_logs")
    .select("decision_type, metadata_issues, ai_reasoning, had_thin_metadata, used_web_search, pipeline_path, created_at")
    .eq("book_id", book.id)
    .in("decision_type", ["warnings_generated", "no_warnings"])
    .order("created_at", { ascending: false })
    .limit(1)

  // Determine analysis status
  // Analysis is complete if:
  // 1. There's an audit log with 'warnings_generated' or 'no_warnings', OR
  // 2. There are AI-generated warnings (even without audit log - indicates analysis was done)
  const hasAuditLog = auditLogs && auditLogs.length > 0
  const hasAiWarnings = warnings.some((w: any) => w.source === 'ai_generated')
  const hasAnalysisCompleted = hasAuditLog || hasAiWarnings
  const analysisStatus: 'complete' | 'unknown' = hasAnalysisCompleted ? 'complete' : 'unknown'
  const metadataIssues = auditLogs && auditLogs.length > 0 ? (auditLogs[0] as any).metadata_issues : null
  const latestAudit = auditLogs && auditLogs.length > 0 ? (auditLogs[0] as any) : null
  
  // Extract no_warnings_reasoning from audit log for dev mode display
  const noWarningsReasoning = auditLogs && auditLogs.length > 0 && auditLogs[0].decision_type === 'no_warnings'
    ? (auditLogs[0] as any).ai_reasoning
    : null

  // No user validation needed - all warnings are shown without user-specific data
  const warningsWithValidations = (() => {
    const list: any[] = warnings
    // Dedupe by (category_id, subcategory_id) for display stability.
    // This protects the UI even if multiple scans accidentally inserted duplicates.
    const severityRank = (sev: any) => {
      switch (String(sev || '').toLowerCase()) {
        case 'severe': return 3
        case 'moderate': return 2
        case 'mild': return 1
        default: return 0
      }
    }
    const byKey = new Map<string, any>()
    for (const w of list) {
      const key = `${w?.category_id || w?.category || 'unknown'}.${w?.subcategory_id || 'unknown'}`
      const existing = byKey.get(key)
      if (!existing) {
        byKey.set(key, w)
        continue
      }
      // Prefer higher severity; if equal, prefer the one with more votes; else keep existing.
      const existingVotes = (existing?.helpful_count || 0) + (existing?.not_helpful_count || 0)
      const wVotes = (w?.helpful_count || 0) + (w?.not_helpful_count || 0)
      const sevDelta = severityRank(w?.severity) - severityRank(existing?.severity)
      if (sevDelta > 0 || (sevDelta === 0 && wVotes > existingVotes)) {
        byKey.set(key, w)
      }
    }
    return Array.from(byKey.values())
  })()

  // Use stored author list when provided (no scraping)
  const rawList = (book as { author_content_warnings_list?: string[] | null }).author_content_warnings_list
  const authorContentWarningsList = Array.isArray(rawList) ? rawList : []

  // Display-time safeguard: recompute age rating from current warnings and show the stricter of (stored, computed).
  // Ensures we never show a lower rating than the content warrants (e.g. M when it should be R18+).
  const RATING_STRICTNESS: Record<ClassificationRating, number> = {
    G: 0,
    PG: 1,
    M: 2,
    "MA15+": 3,
    "R18+": 4,
    RC: 5,
  }
  let displayCategories = (book.categories as string[] | null) || []
  if (warningsWithValidations.length > 0) {
    const enhancedWarnings: EnhancedContentWarning[] = warningsWithValidations.map((w: any) => ({
      subcategory_id: w.subcategory_id || "",
      severity: (w.severity || "mild") as "mild" | "moderate" | "severe",
      modifiers: (w.context_modifiers || []) as EnhancedContentWarning["modifiers"],
      evidence: (w.evidence || []) as EnhancedContentWarning["evidence"],
      severity_signals: w.severity_signals ?? {
        frequency: 0.5,
        explicitness: 0.5,
        proximity: 0.5,
        centrality: 0.5,
        intensity_markers: [],
      },
      taxonomy_version: w.taxonomy_version || "2.5.0",
      is_spoiler: w.is_spoiler ?? false,
      description: w.description,
      reasoning: w.reasoning,
    }))
    const computed = calculateAgeRating(enhancedWarnings)
    const storedTag = displayCategories.find((c: string) => c.startsWith("CLASSIFICATION:"))
    const storedRating = storedTag ? (storedTag.replace("CLASSIFICATION:", "") as ClassificationRating) : null
    const storedLevel = storedRating != null ? RATING_STRICTNESS[storedRating] ?? -1 : -1
    const computedLevel = RATING_STRICTNESS[computed.rating]
    const effectiveRating: ClassificationRating =
      computedLevel > storedLevel ? computed.rating : (storedRating ?? computed.rating)
    const categoriesWithoutRating = displayCategories.filter((c: string) => !c.startsWith("CLASSIFICATION:"))
    displayCategories = [...categoriesWithoutRating, `CLASSIFICATION:${effectiveRating}`]
  }
  const bookForDisplay = { ...book, categories: displayCategories }

  return (
    <main className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <BookDetails
            book={bookForDisplay}
            warnings={warningsWithValidations}
            analysisStatus={analysisStatus}
            metadataIssues={metadataIssues}
            noWarningsReasoning={noWarningsReasoning}
            authorContentWarningsList={authorContentWarningsList}
            contentDisplayVariant="cards"
            analysisMeta={latestAudit ? {
              hadThinMetadata: !!latestAudit.had_thin_metadata,
              usedWebSearch: !!latestAudit.used_web_search,
              pipelinePath: latestAudit.pipeline_path || null,
              analyzedAt: latestAudit.created_at || null,
            } : null}
          />
          {monetizationConfig.adsEnabled && monetizationConfig.placements.resultsFooter && (
            <div className="mt-8">
              <SponsoredCard item={defaultResultsFooterSponsor} />
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
