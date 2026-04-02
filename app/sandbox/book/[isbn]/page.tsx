/**
 * Sandbox Book Page – isolated duplicate of /book/[isbn] for experimentation.
 * Same data and components as the real book page; not indexed by search engines.
 * Use for testing UI changes (e.g. spoiler rendering) without affecting production.
 */

import Link from "next/link"
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

interface SandboxBookPageProps {
  params: Promise<{ isbn: string }>
}

export async function generateMetadata({ params }: SandboxBookPageProps): Promise<Metadata> {
  const { isbn } = await params
  const { data: book } = await supabaseAdmin.from("books").select("title, author").eq("isbn", isbn).single()
  const title = book?.title ? `${book.title} (Sandbox)` : `Book ${isbn} (Sandbox)`
  return {
    title: `${title} | Subtext Sandbox`,
    description: "Isolated sandbox copy of the book page for testing. Not indexed.",
    robots: { index: false, follow: false },
  }
}

export default async function SandboxBookPage({ params }: SandboxBookPageProps) {
  const { isbn } = await params
  const supabase = supabaseAdmin

  if (!validateISBNWithChecksum(isbn)) {
    notFound()
  }

  const { data: book, error: bookError } = await supabase.from("books").select("*").eq("isbn", isbn).single()

  if (bookError || !book) {
    const externalMetadata = await fetchBookByISBN(isbn)
    const hasMinimumMetadata = externalMetadata && externalMetadata.title && externalMetadata.author
    const shouldIndex = false

    return (
      <>
        <SandboxBanner isbn={isbn} />
        <main id="sandbox-main" className="min-h-screen bg-background scroll-mt-14">
          <div className="container mx-auto px-4 py-8">
            <div className="max-w-4xl mx-auto">
              <BookStubPage
                isbn={isbn}
                metadata={externalMetadata}
                shouldIndex={shouldIndex}
              />
            </div>
          </div>
        </main>
      </>
    )
  }

  const warnings = await getWarningsForBookExcludingAppeals(supabase, book.id)

  const { data: auditLogs } = await supabase
    .from("ai_audit_logs")
    .select("decision_type, metadata_issues, ai_reasoning, had_thin_metadata, used_web_search, pipeline_path, created_at")
    .eq("book_id", book.id)
    .in("decision_type", ["warnings_generated", "no_warnings"])
    .order("created_at", { ascending: false })
    .limit(1)

  const hasAuditLog = auditLogs && auditLogs.length > 0
  const hasAiWarnings = warnings.some((w: { source?: string }) => w.source === "ai_generated")
  const analysisStatus: "complete" | "unknown" = hasAuditLog || hasAiWarnings ? "complete" : "unknown"
  const metadataIssues = auditLogs?.length ? (auditLogs[0] as { metadata_issues?: unknown }).metadata_issues : null
  const latestAudit = auditLogs?.length ? auditLogs[0] : null
  const noWarningsReasoning =
    auditLogs?.length && auditLogs[0].decision_type === "no_warnings"
      ? (auditLogs[0] as { ai_reasoning?: string }).ai_reasoning
      : null

  const warningsWithValidations = (() => {
    const list: unknown[] = warnings
    const severityRank = (sev: unknown) => {
      switch (String(sev ?? "").toLowerCase()) {
        case "severe":
          return 3
        case "moderate":
          return 2
        case "mild":
          return 1
        default:
          return 0
      }
    }
    const byKey = new Map<string, { helpful_count?: number; not_helpful_count?: number; severity?: unknown }>()
    for (const w of list as { category_id?: string; category?: string; subcategory_id?: string; helpful_count?: number; not_helpful_count?: number; severity?: unknown }[]) {
      const key = `${w?.category_id ?? w?.category ?? "unknown"}.${w?.subcategory_id ?? "unknown"}`
      const existing = byKey.get(key)
      if (!existing) {
        byKey.set(key, w)
        continue
      }
      const existingVotes = (existing?.helpful_count ?? 0) + (existing?.not_helpful_count ?? 0)
      const wVotes = (w?.helpful_count ?? 0) + (w?.not_helpful_count ?? 0)
      const sevDelta = severityRank(w?.severity) - severityRank(existing?.severity)
      if (sevDelta > 0 || (sevDelta === 0 && wVotes > existingVotes)) {
        byKey.set(key, w)
      }
    }
    return Array.from(byKey.values())
  })()

  const rawList = (book as { author_content_warnings_list?: string[] | null }).author_content_warnings_list
  const authorContentWarningsList = Array.isArray(rawList) ? rawList : []

  return (
    <>
      <SandboxBanner isbn={isbn} />
      <main id="sandbox-main" className="min-h-screen bg-background scroll-mt-14">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <BookDetails
              book={book}
              warnings={warningsWithValidations}
              analysisStatus={analysisStatus}
              metadataIssues={metadataIssues}
              noWarningsReasoning={noWarningsReasoning}
              authorContentWarningsList={authorContentWarningsList}
              contentDisplayVariant="cards"
              liveBookHref={`/book/${isbn}`}
              analysisMeta={
                latestAudit
                  ? {
                      hadThinMetadata: !!(latestAudit as { had_thin_metadata?: boolean }).had_thin_metadata,
                      usedWebSearch: !!(latestAudit as { used_web_search?: boolean }).used_web_search,
                      pipelinePath: (latestAudit as { pipeline_path?: string }).pipeline_path ?? null,
                      analyzedAt: (latestAudit as { created_at?: string }).created_at ?? null,
                    }
                  : null
              }
            />
            {monetizationConfig.adsEnabled && monetizationConfig.placements.resultsFooter && (
              <div className="mt-8">
                <SponsoredCard item={defaultResultsFooterSponsor} />
              </div>
            )}
          </div>
        </div>
      </main>
    </>
  )
}

function SandboxBanner({ isbn }: { isbn: string }) {
  const liveHref = `/book/${isbn}`
  return (
    <div
      className="sticky top-0 z-50 flex items-center justify-between gap-3 border-b border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950/80 dark:text-amber-100"
      role="banner"
      aria-label="Sandbox mode"
    >
      <span className="font-medium truncate min-w-0">
        <span className="hidden sm:inline">Sandbox – changes here do not affect the live book page.</span>
        <span className="sm:hidden">Sandbox</span>
      </span>
      <div className="flex items-center gap-2 shrink-0">
        <Link
          href="/scan"
          className="rounded px-2 py-1 text-amber-800 hover:bg-amber-200/80 dark:text-amber-200 dark:hover:bg-amber-800/80 font-medium"
          aria-label="Scan another book"
        >
          Try another
        </Link>
        <Link
          href={liveHref}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded bg-amber-200 px-2 py-1 font-medium text-amber-900 hover:bg-amber-300 dark:bg-amber-800 dark:text-amber-100 dark:hover:bg-amber-700"
          aria-label="Open live book page in new tab"
        >
          <span className="hidden sm:inline">View live page</span>
          <span className="sm:hidden">Live</span>
          <span aria-hidden> →</span>
        </Link>
      </div>
    </div>
  )
}
