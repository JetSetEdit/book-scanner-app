import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { validateISBN, normalizeISBN } from "@/lib/isbn-validation"
import { extractISBNsFromGoogleBooks } from "@/lib/book-api"

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

    /**
     * External API search fallback
     * Only when database returns < 3 results, query length >= 3, and not an ISBN query.
     * Gracefully degrades on 429, timeout, or other API errors.
     */
    let externalResults: Array<{
      isbn: string
      title: string
      author: string | null
      cover_url: string | null
      description: string | null
      source: 'external_api'
    }> = []

    if (booksWithWarnings.length < 3 && query.length >= 3 && !isISBN) {
      try {
        const apiKey = process.env.GOOGLE_BOOKS_API_KEY
        const searchQuery = query.trim()
        const url = new URL('https://www.googleapis.com/books/v1/volumes')
        url.searchParams.append('q', searchQuery)
        url.searchParams.append('maxResults', '10')
        if (apiKey) {
          url.searchParams.append('key', apiKey)
        }

        const externalResponse = await fetch(url.toString(), {
          headers: { 'User-Agent': 'Book-Scanner-App/1.0' },
          signal: AbortSignal.timeout(5000),
        })

        if (externalResponse.ok) {
          const externalData = await externalResponse.json()
          if (externalData.items?.length > 0) {
            const existingISBNs = new Set(
              booksWithWarnings.map((book) => normalizeISBN(book.isbn)).filter(Boolean)
            )
            for (const item of externalData.items.slice(0, 10)) {
              const volumeInfo = item.volumeInfo
              if (!volumeInfo?.title) continue
              const returnedISBNs = extractISBNsFromGoogleBooks(volumeInfo.industryIdentifiers)
              if (returnedISBNs.length === 0) continue
              const bookISBN = normalizeISBN(returnedISBNs[0])
              if (!bookISBN || existingISBNs.has(bookISBN)) continue
              let coverUrl: string | null = null
              if (volumeInfo.imageLinks) {
                coverUrl =
                  volumeInfo.imageLinks.thumbnail?.replace('http:', 'https:')?.replace('&edge=curl', '') ||
                  volumeInfo.imageLinks.smallThumbnail?.replace('http:', 'https:')?.replace('&edge=curl', '') ||
                  null
              }
              let description: string | null = null
              if (volumeInfo.description) {
                description =
                  volumeInfo.description.length > 100
                    ? volumeInfo.description.substring(0, 100) + '...'
                    : volumeInfo.description
              }
              externalResults.push({
                isbn: bookISBN,
                title: volumeInfo.title,
                author: volumeInfo.authors?.[0] || null,
                cover_url: coverUrl,
                description,
                source: 'external_api',
              })
            }
          }
        } else if (externalResponse.status === 429) {
          console.warn('[Search API] Google Books API rate limited (429), returning database results only')
        } else {
          console.warn(`[Search API] Google Books API search failed: ${externalResponse.status}`)
        }
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
          console.warn('[Search API] Google Books API request timed out (5s limit)')
        } else {
          console.warn('[Search API] External API search error:', error)
        }
      }
    }

    return NextResponse.json({
      books: booksWithWarnings || [],
      externalResults,
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

