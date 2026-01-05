import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { validateISBN, normalizeISBN } from "@/lib/isbn-validation"

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

    // Search across title, author, ISBN, categories, and publisher
    // Using ilike for case-insensitive partial matching
    // For categories (array), we need a separate query
    
    // First: Search text fields
    let textSearchQuery = supabase
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
        categories,
        content_warnings (
          id,
          severity
        )
      `)
      .or(
        `title.ilike.%${query}%,author.ilike.%${query}%,isbn.ilike.%${query}%,publisher.ilike.%${query}%,description.ilike.%${query}%`
      )
      .limit(100)

    // Execute text search
    const textResults = await textSearchQuery

    if (textResults.error) {
      console.error("Text search error:", textResults.error)
      return NextResponse.json({ error: "Search failed" }, { status: 500 })
    }

    // For category search, we'll check in the relevance scoring
    // But if text search returns no results, try a broader search including categories
    let books = textResults.data || []
    
    // If no text matches, search by category (fallback for genre searches)
    const queryLower = query.toLowerCase()
    if (books.length === 0 && query.length >= 3) {
      // Fetch books and filter by category client-side
      // Note: This is a fallback - ideally we'd use PostgreSQL array search
      const { data: allBooks } = await supabase
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
          categories,
          content_warnings (
            id,
            severity
          )
        `)
        .order("created_at", { ascending: false })
        .limit(500) // Check up to 500 books for category matches
      
      if (allBooks) {
        const categoryMatches = allBooks.filter((book) => {
          const categories = (book.categories || []) as string[]
          return categories.some((cat) => 
            cat.toLowerCase().includes(queryLower)
          )
        })
        books = categoryMatches
      }
    } else {
      // Even if we have text matches, boost relevance for category matches
      // (already handled in relevance scoring below)
    }
    
    const uniqueBooks = books

    // Calculate warning summaries and relevance scores for each book
    const booksWithWarnings = uniqueBooks
      ?.map((book) => {
        const warnings = book.content_warnings || []
        const summary = {
          severe: warnings.filter((w: any) => w.severity === "severe").length,
          moderate: warnings.filter((w: any) => w.severity === "moderate").length,
          mild: warnings.filter((w: any) => w.severity === "mild").length,
        }
        
        // Calculate relevance score for ranking
        let relevanceScore = 0
        const titleLower = (book.title || "").toLowerCase()
        const authorLower = (book.author || "").toLowerCase()
        const isbnLower = (book.isbn || "").toLowerCase()
        const publisherLower = (book.publisher || "").toLowerCase()
        const categoriesLower = ((book.categories || []) as string[]).join(" ").toLowerCase()
        
        // Exact matches get highest score
        if (titleLower === queryLower) relevanceScore += 100
        if (authorLower === queryLower) relevanceScore += 90
        if (isbnLower === queryLower) relevanceScore += 95
        if (publisherLower === queryLower) relevanceScore += 80
        
        // Starts with gets high score
        if (titleLower.startsWith(queryLower)) relevanceScore += 50
        if (authorLower.startsWith(queryLower)) relevanceScore += 45
        if (publisherLower.startsWith(queryLower)) relevanceScore += 40
        
        // Contains gets medium score
        if (titleLower.includes(queryLower)) relevanceScore += 30
        if (authorLower.includes(queryLower)) relevanceScore += 25
        if (publisherLower.includes(queryLower)) relevanceScore += 20
        if (categoriesLower.includes(queryLower)) relevanceScore += 15
        
        // ISBN partial match
        if (isbnLower.includes(queryLower)) relevanceScore += 35
        
        return {
          ...book,
          warningSummary: summary,
          hasWarnings: summary.severe > 0 || summary.moderate > 0 || summary.mild > 0,
          relevanceScore,
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
      .sort((a, b) => {
        // Sort by relevance score (highest first), then by title
        if (b.relevanceScore !== a.relevanceScore) {
          return b.relevanceScore - a.relevanceScore
        }
        return (a.title || "").localeCompare(b.title || "")
      })
      .slice(0, 20) // Limit to 20 results after filtering
      .map(({ relevanceScore, ...book }) => book) // Remove relevanceScore from response

    // Check if query is a valid ISBN and no results found
    const normalizedQuery = normalizeISBN(query)
    const isISBN = validateISBN(query)
    const isNotFound = booksWithWarnings?.length === 0

    return NextResponse.json({
      books: booksWithWarnings || [],
      total: booksWithWarnings?.length || 0,
      query,
      isISBN: isISBN,
      isbnNotFound: isISBN && isNotFound,
      normalizedISBN: isISBN ? normalizedQuery : null,
    })
  } catch (error) {
    console.error("Search API error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

