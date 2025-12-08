import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const query = searchParams.get("q")?.trim()
    const severityParam = searchParams.get("severity")

    if (!query || query.length < 2) {
      return NextResponse.json({ books: [], total: 0 })
    }

    const supabase = await createClient()

    // Parse severity filters
    const allowedSeverities = severityParam
      ? severityParam.split(",").filter((s) => ["mild", "moderate", "severe"].includes(s))
      : ["mild", "moderate", "severe"] // Default: show all

    // Search across title, author, and ISBN using PostgreSQL's full-text search capabilities
    // Using ilike for case-insensitive partial matching
    let booksQuery = supabase
      .from("books")
      .select(`
        id,
        isbn,
        title,
        author,
        cover_url,
        description,
        publisher,
        published_date,
        content_warnings (
          id,
          severity
        )
      `)
      .or(
        `title.ilike.%${query}%,author.ilike.%${query}%,isbn.ilike.%${query}%`
      )

    const { data: books, error } = await booksQuery
      .order("created_at", { ascending: false })
      .limit(50) // Get more to filter client-side

    if (error) {
      console.error("Search error:", error)
      return NextResponse.json({ error: "Search failed" }, { status: 500 })
    }

    // Calculate warning summaries for each book and filter by severity
    const booksWithWarnings = books
      ?.map((book) => {
        const warnings = book.content_warnings || []
        const summary = {
          severe: warnings.filter((w: any) => w.severity === "severe").length,
          moderate: warnings.filter((w: any) => w.severity === "moderate").length,
          mild: warnings.filter((w: any) => w.severity === "mild").length,
        }
        return {
          ...book,
          warningSummary: summary,
          hasWarnings: summary.severe > 0 || summary.moderate > 0 || summary.mild > 0,
        }
      })
      .filter((book) => {
        // Filter by severity tolerance
        // If book has warnings, check if any match the allowed severities
        if (!book.hasWarnings) {
          // Books without warnings are always included
          return true
        }
        
        // Check if book has any warnings matching the allowed severities
        const hasAllowedSeverity =
          (allowedSeverities.includes("mild") && book.warningSummary.mild > 0) ||
          (allowedSeverities.includes("moderate") && book.warningSummary.moderate > 0) ||
          (allowedSeverities.includes("severe") && book.warningSummary.severe > 0)
        
        return hasAllowedSeverity
      })
      .slice(0, 20) // Limit to 20 results after filtering

    return NextResponse.json({
      books: booksWithWarnings || [],
      total: booksWithWarnings?.length || 0,
      query,
    })
  } catch (error) {
    console.error("Search API error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

