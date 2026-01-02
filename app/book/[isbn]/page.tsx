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


  // Fetch content warnings
  const { data: warnings } = await supabase
    .from("content_warnings")
    .select("*")
    .eq("book_id", book.id)
    .order("helpful_count", { ascending: false })

  // Fetch audit logs to determine if analysis has been completed and get metadata issues
  const { data: auditLogs } = await supabase
    .from("ai_audit_logs")
    .select("decision_type, metadata_issues")
    .eq("book_id", book.id)
    .in("decision_type", ["warnings_generated", "no_warnings"])
    .order("created_at", { ascending: false })
    .limit(1)

  // Determine analysis status
  // Analysis is complete if there's an audit log with 'warnings_generated' or 'no_warnings'
  const hasAnalysisCompleted = auditLogs && auditLogs.length > 0
  const analysisStatus: 'complete' | 'unknown' = hasAnalysisCompleted ? 'complete' : 'unknown'
  const metadataIssues = auditLogs && auditLogs.length > 0 ? (auditLogs[0] as any).metadata_issues : null

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
          />
        </div>
      </div>
    </main>
  )
}
