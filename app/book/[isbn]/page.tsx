import { BookDetails } from "@/components/book-details"
import { supabaseAdmin } from "@/lib/supabase/admin"
import { notFound } from "next/navigation"

interface BookPageProps {
  params: Promise<{
    isbn: string
  }>
}

export default async function BookPage({ params }: BookPageProps) {
  const { isbn } = await params
  const supabase = supabaseAdmin

  // No authentication required

  // Fetch book data
  const { data: book, error: bookError } = await supabase.from("books").select("*").eq("isbn", isbn).single()

  if (bookError || !book) {
    notFound()
  }


  // Fetch content warnings (include evidence for dev mode model source tracking)
  const { data: warnings } = await supabase
    .from("content_warnings")
    .select("*")
    .eq("book_id", book.id)
    .order("helpful_count", { ascending: false })

  // Fetch audit logs to determine if analysis has been completed and get metadata issues
  // Also fetch ai_reasoning for dev mode display when no warnings were found
  const { data: auditLogs } = await supabase
    .from("ai_audit_logs")
    .select("decision_type, metadata_issues, ai_reasoning")
    .eq("book_id", book.id)
    .in("decision_type", ["warnings_generated", "no_warnings"])
    .order("created_at", { ascending: false })
    .limit(1)

  // Determine analysis status
  // Analysis is complete if:
  // 1. There's an audit log with 'warnings_generated' or 'no_warnings', OR
  // 2. There are AI-generated warnings (even without audit log - indicates analysis was done)
  const hasAuditLog = auditLogs && auditLogs.length > 0
  const hasAiWarnings = warnings && warnings.some((w: any) => w.source === 'ai_generated')
  const hasAnalysisCompleted = hasAuditLog || hasAiWarnings
  const analysisStatus: 'complete' | 'unknown' = hasAnalysisCompleted ? 'complete' : 'unknown'
  const metadataIssues = auditLogs && auditLogs.length > 0 ? (auditLogs[0] as any).metadata_issues : null
  
  // Extract no_warnings_reasoning from audit log for dev mode display
  const noWarningsReasoning = auditLogs && auditLogs.length > 0 && auditLogs[0].decision_type === 'no_warnings'
    ? (auditLogs[0] as any).ai_reasoning
    : null

  // No user validation needed - all warnings are shown without user-specific data
  const warningsWithValidations = warnings || []

  return (
    <main className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <BookDetails
            book={book}
            warnings={warningsWithValidations}
            analysisStatus={analysisStatus}
            metadataIssues={metadataIssues}
            noWarningsReasoning={noWarningsReasoning}
          />
        </div>
      </div>
    </main>
  )
}
