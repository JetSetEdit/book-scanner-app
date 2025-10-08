import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

// Sample books with content warnings
const sampleBooks = [
  {
    isbn: "9780316769174",
    title: "The Catcher in the Rye",
    author: "J.D. Salinger",
    cover_url: "https://covers.openlibrary.org/b/id/8230991-L.jpg",
    description: "The story of Holden Caulfield, a teenager who has been expelled from prep school and is wandering around New York City.",
    publisher: "Little, Brown and Company",
    published_date: "1951-07-16",
    page_count: 277,
    categories: ["Fiction", "Coming of Age", "American Literature"],
    contentWarnings: [
      {
        category: "mental_health",
        description: "Depression, anxiety, and suicidal ideation are themes throughout the book",
        severity: "moderate"
      },
      {
        category: "substance_abuse",
        description: "Alcohol consumption by minors and references to drinking",
        severity: "mild"
      },
      {
        category: "sexual_content",
        description: "References to sexual encounters and prostitution",
        severity: "mild"
      }
    ],
    spiceLevel: "none",
    ageRating: "PG-13"
  },
  {
    isbn: "9780061120084",
    title: "To Kill a Mockingbird",
    author: "Harper Lee",
    cover_url: "https://covers.openlibrary.org/b/id/8230992-L.jpg",
    description: "The story of young Scout Finch and her father Atticus, a lawyer who defends a Black man falsely accused of rape.",
    publisher: "J.B. Lippincott & Co.",
    published_date: "1960-07-11",
    page_count: 281,
    categories: ["Fiction", "Southern Literature", "Social Justice"],
    contentWarnings: [
      {
        category: "violence",
        description: "Racial violence, assault, and murder are central to the plot",
        severity: "moderate"
      },
      {
        category: "discrimination",
        description: "Extensive themes of racism and racial injustice in the American South",
        severity: "severe"
      },
      {
        category: "abuse",
        description: "Child abuse and domestic violence are mentioned",
        severity: "moderate"
      }
    ],
    spiceLevel: "none",
    ageRating: "PG-13"
  },
  {
    isbn: "9780141439518",
    title: "1984",
    author: "George Orwell",
    cover_url: "https://covers.openlibrary.org/b/id/8230993-L.jpg",
    description: "A dystopian novel set in a totalitarian society where independent thinking is a crime.",
    publisher: "Secker & Warburg",
    published_date: "1949-06-08",
    page_count: 328,
    categories: ["Fiction", "Dystopian", "Political Fiction"],
    contentWarnings: [
      {
        category: "violence",
        description: "Torture, psychological manipulation, and state-sanctioned violence",
        severity: "severe"
      },
      {
        category: "mental_health",
        description: "Psychological torture, brainwashing, and mental breakdown",
        severity: "severe"
      },
      {
        category: "sexual_content",
        description: "Sexual themes and references to sexual repression",
        severity: "mild"
      }
    ],
    spiceLevel: "mild",
    ageRating: "R"
  },
  {
    isbn: "9780743273565",
    title: "The Great Gatsby",
    author: "F. Scott Fitzgerald",
    cover_url: "https://covers.openlibrary.org/b/id/8230994-L.jpg",
    description: "A story of the fabulously wealthy Jay Gatsby and his love for the beautiful Daisy Buchanan.",
    publisher: "Charles Scribner's Sons",
    published_date: "1925-04-10",
    page_count: 180,
    categories: ["Fiction", "American Literature", "Classic"],
    contentWarnings: [
      {
        category: "substance_abuse",
        description: "Heavy drinking and alcohol abuse throughout the story",
        severity: "moderate"
      },
      {
        category: "violence",
        description: "Car accident resulting in death, domestic violence",
        severity: "moderate"
      },
      {
        category: "death",
        description: "Multiple deaths including murder and suicide",
        severity: "moderate"
      }
    ],
    spiceLevel: "mild",
    ageRating: "PG-13"
  },
  {
    isbn: "9780060850524",
    title: "Brave New World",
    author: "Aldous Huxley",
    cover_url: "https://covers.openlibrary.org/b/id/8230995-L.jpg",
    description: "A dystopian novel set in a futuristic world where society is controlled through genetic engineering and psychological conditioning.",
    publisher: "Chatto & Windus",
    published_date: "1932-01-01",
    page_count: 311,
    categories: ["Fiction", "Dystopian", "Science Fiction"],
    contentWarnings: [
      {
        category: "sexual_content",
        description: "Promiscuous sexual behavior and references to sexual freedom",
        severity: "moderate"
      },
      {
        category: "substance_abuse",
        description: "Drug use (soma) as a form of social control",
        severity: "moderate"
      },
      {
        category: "mental_health",
        description: "Psychological conditioning and manipulation",
        severity: "moderate"
      }
    ],
    spiceLevel: "medium",
    ageRating: "R"
  }
]

export async function POST(request: NextRequest) {
  try {
    console.log('Restore sample books API called')
    
    const results = []
    
    for (const bookData of sampleBooks) {
      try {
        // Insert the book
        const { data: book, error: bookError } = await supabaseAdmin
          .from('books')
          .insert({
            isbn: bookData.isbn,
            title: bookData.title,
            author: bookData.author,
            cover_url: bookData.cover_url,
            description: bookData.description,
            publisher: bookData.publisher,
            published_date: bookData.published_date,
            page_count: bookData.page_count,
            categories: bookData.categories
          })
          .select()
          .single()

        if (bookError) {
          console.error(`Error inserting book ${bookData.isbn}:`, bookError)
          results.push({ isbn: bookData.isbn, success: false, error: bookError.message })
          continue
        }

        // Insert content warnings for this book
        const warningResults = []
        for (const warning of bookData.contentWarnings) {
          const { error: warningError } = await supabaseAdmin
            .from('content_warnings')
            .insert({
              book_id: book.id,
              category: warning.category,
              description: warning.description,
              severity: warning.severity,
              helpful_count: Math.floor(Math.random() * 10) + 1, // Random helpful count
              not_helpful_count: Math.floor(Math.random() * 3) // Random not helpful count
            })

          if (warningError) {
            console.error(`Error inserting warning for book ${bookData.isbn}:`, warningError)
            warningResults.push({ category: warning.category, success: false, error: warningError.message })
          } else {
            warningResults.push({ category: warning.category, success: true })
          }
        }

        results.push({
          isbn: bookData.isbn,
          title: bookData.title,
          success: true,
          bookId: book.id,
          warningsAdded: warningResults.filter(w => w.success).length,
          warnings: warningResults
        })

        console.log(`Successfully added book: ${bookData.title}`)

      } catch (error) {
        console.error(`Error processing book ${bookData.isbn}:`, error)
        results.push({ 
          isbn: bookData.isbn, 
          success: false, 
          error: error instanceof Error ? error.message : 'Unknown error' 
        })
      }
    }

    const successCount = results.filter(r => r.success).length
    const totalWarnings = results.reduce((sum, r) => sum + (r.warningsAdded || 0), 0)

    return NextResponse.json({
      success: true,
      message: `Successfully restored ${successCount} books with ${totalWarnings} content warnings`,
      results: results,
      summary: {
        booksAdded: successCount,
        totalWarnings: totalWarnings,
        totalBooks: sampleBooks.length
      }
    })

  } catch (error) {
    console.error('Restore sample books error:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// GET endpoint to check what sample books would be added
export async function GET() {
  return NextResponse.json({
    message: 'Sample books ready to be restored',
    books: sampleBooks.map(book => ({
      isbn: book.isbn,
      title: book.title,
      author: book.author,
      warningCount: book.contentWarnings.length,
      warnings: book.contentWarnings.map(w => ({ category: w.category, severity: w.severity }))
    }))
  })
}
