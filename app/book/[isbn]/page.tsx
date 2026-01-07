import { BookDetails } from "@/components/book-details"
import { Button } from "@/components/ui/button"
import { supabaseAdmin } from "@/lib/supabase/admin"
import Link from "next/link"

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

  // If book doesn't exist yet, don't 404 — show a recovery path back into scanning.
  // This is critical for the search → click flow (users often click books that haven't been scanned yet).
  if (bookError || !book) {
    return (
      <main className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-2xl mx-auto">
            <div className="border border-border bg-card/60 p-8">
              <h1 className="font-serif text-3xl font-bold text-foreground mb-3">This book isn&apos;t in Subtext yet</h1>
              <p className="text-muted-foreground leading-relaxed mb-6">
                We couldn&apos;t find ISBN <span className="font-mono text-foreground">{isbn}</span> in the database.
                Scan it to create the book page and generate content warnings.
              </p>

              <div className="flex flex-col sm:flex-row gap-3">
                <Link href={`/scan?isbn=${encodeURIComponent(isbn)}`}>
                  <Button className="w-full sm:w-auto">Scan this book</Button>
                </Link>
                <Link href="/scan">
                  <Button variant="outline" className="w-full sm:w-auto">Go to scanner</Button>
                </Link>
                <Link href="/">
                  <Button variant="ghost" className="w-full sm:w-auto">Back to home</Button>
                </Link>
              </div>

              <p className="text-xs text-muted-foreground mt-6">
                Tip: scanning from this page will auto-fill the ISBN and start the scan.
              </p>
            </div>
          </div>
        </div>
      </main>
    )
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
