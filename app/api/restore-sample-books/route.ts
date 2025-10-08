import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

// Original collection books with content warnings
const sampleBooks = [
  {
    isbn: "9780008710262",
    title: "When the Moon Hatched",
    author: "Sarah A. Parker",
    cover_url: null,
    description: "A fantasy romance novel about magic and adventure in a world where the moon has hatched, revealing hidden secrets and ancient powers.",
    publisher: "Harper Voyager",
    published_date: "2025-05-08",
    page_count: 576,
    categories: ["Fiction", "Fantasy", "Romance", "Adventure"],
    contentWarnings: [
      {
        category: "violence",
        description: "Graphic violence including battle scenes, torture, and death",
        severity: "severe"
      },
      {
        category: "violence",
        description: "Intense physical confrontations and dangerous situations",
        severity: "severe"
      },
      {
        category: "violence",
        description: "Warfare and combat scenes with detailed descriptions",
        severity: "severe"
      },
      {
        category: "violence",
        description: "Torture and psychological manipulation",
        severity: "severe"
      },
      {
        category: "violence",
        description: "Graphic depictions of injury and death",
        severity: "severe"
      },
      {
        category: "violence",
        description: "Domestic violence and abuse scenes",
        severity: "severe"
      },
      {
        category: "violence",
        description: "Violent confrontations between characters",
        severity: "severe"
      },
      {
        category: "sexual_content",
        description: "Explicit sexual content and romantic scenes",
        severity: "moderate"
      },
      {
        category: "sexual_content",
        description: "Sexual themes and references",
        severity: "moderate"
      },
      {
        category: "sexual_content",
        description: "Romantic and sexual relationships",
        severity: "moderate"
      },
      {
        category: "sexual_content",
        description: "Sexual violence and assault references",
        severity: "moderate"
      }
    ],
    spiceLevel: "extra_hot",
    ageRating: "18+"
  },
  {
    isbn: "9781668001234",
    title: "Holiday Ever After",
    author: "Hannah Grace",
    cover_url: null,
    description: "A festive holiday romance featuring characters finding love during the most wonderful time of the year.",
    publisher: "Simon and Schuster",
    published_date: "2025-09-30",
    page_count: 320,
    categories: ["Fiction", "Romance", "Holiday", "Contemporary"],
    contentWarnings: [
      {
        category: "sexual_content",
        description: "Mild romantic and sexual content",
        severity: "mild"
      },
      {
        category: "substance_abuse",
        description: "Social drinking in holiday settings",
        severity: "mild"
      },
      {
        category: "mental_health",
        description: "Brief mentions of holiday stress and family dynamics",
        severity: "mild"
      },
      {
        category: "violence",
        description: "Minor conflicts and misunderstandings",
        severity: "mild"
      }
    ],
    spiceLevel: "mild",
    ageRating: "PG-13"
  },
  {
    isbn: "9781668001235",
    title: "Daydream",
    author: "Hannah Grace",
    cover_url: null,
    description: "A contemporary romance about finding love in unexpected places and following your dreams.",
    publisher: "Simon and Schuster",
    published_date: "2024-08-27",
    page_count: 350,
    categories: ["Fiction", "Romance", "Contemporary", "Dreams"],
    contentWarnings: [
      {
        category: "violence",
        description: "Intense confrontations and physical altercations",
        severity: "severe"
      },
      {
        category: "sexual_content",
        description: "Explicit sexual content and romantic scenes",
        severity: "moderate"
      },
      {
        category: "mental_health",
        description: "Themes of anxiety, depression, and emotional trauma",
        severity: "moderate"
      },
      {
        category: "substance_abuse",
        description: "Alcohol consumption and party scenes",
        severity: "moderate"
      },
      {
        category: "death",
        description: "Mention of past deaths and grief",
        severity: "mild"
      },
      {
        category: "abuse",
        description: "References to emotional abuse and manipulation",
        severity: "mild"
      },
      {
        category: "discrimination",
        description: "Brief mentions of workplace discrimination",
        severity: "mild"
      },
      {
        category: "other",
        description: "Family conflicts and relationship drama",
        severity: "mild"
      },
      {
        category: "other",
        description: "Workplace stress and career challenges",
        severity: "mild"
      },
      {
        category: "other",
        description: "Social media and online harassment",
        severity: "mild"
      },
      {
        category: "other",
        description: "Financial stress and economic hardship",
        severity: "mild"
      },
      {
        category: "other",
        description: "Identity and self-discovery themes",
        severity: "mild"
      }
    ],
    spiceLevel: "hot",
    ageRating: "R"
  },
  {
    isbn: "9781668001236",
    title: "Wildfire",
    author: "Hannah Grace",
    cover_url: null,
    description: "A passionate romance set against the backdrop of nature and adventure, where love burns as bright as wildfire.",
    publisher: "Simon and Schuster",
    published_date: "2023-10-03",
    page_count: 380,
    categories: ["Fiction", "Romance", "Adventure", "Nature"],
    contentWarnings: [
      {
        category: "violence",
        description: "Intense physical confrontations and dangerous situations",
        severity: "severe"
      },
      {
        category: "sexual_content",
        description: "Explicit sexual content and passionate scenes",
        severity: "moderate"
      },
      {
        category: "mental_health",
        description: "Themes of PTSD and trauma from past experiences",
        severity: "moderate"
      },
      {
        category: "death",
        description: "References to past deaths and dangerous situations",
        severity: "mild"
      },
      {
        category: "substance_abuse",
        description: "Social drinking and party scenes",
        severity: "mild"
      },
      {
        category: "other",
        description: "High-risk outdoor activities and adventure sports",
        severity: "mild"
      }
    ],
    spiceLevel: "hot",
    ageRating: "R"
  },
  {
    isbn: "9781668001237",
    title: "Icebreaker",
    author: "Hannah Grace",
    cover_url: null,
    description: "A steamy romance set in the world of competitive ice skating, where passion heats up on and off the ice.",
    publisher: "Simon and Schuster",
    published_date: "2022-11-22",
    page_count: 400,
    categories: ["Fiction", "Romance", "Sports", "Ice Skating"],
    contentWarnings: [
      {
        category: "violence",
        description: "Intense confrontations and physical altercations",
        severity: "severe"
      },
      {
        category: "sexual_content",
        description: "Explicit sexual content and steamy romantic scenes",
        severity: "moderate"
      },
      {
        category: "mental_health",
        description: "Themes of performance anxiety, pressure, and emotional stress",
        severity: "moderate"
      },
      {
        category: "substance_abuse",
        description: "Alcohol consumption and party scenes",
        severity: "mild"
      },
      {
        category: "abuse",
        description: "References to emotional manipulation and toxic relationships",
        severity: "mild"
      },
      {
        category: "discrimination",
        description: "Brief mentions of sexism in sports",
        severity: "mild"
      },
      {
        category: "other",
        description: "Competitive sports pressure and injury risks",
        severity: "mild"
      }
    ],
    spiceLevel: "hot",
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
    message: 'Original collection books ready to be restored',
    books: sampleBooks.map(book => ({
      isbn: book.isbn,
      title: book.title,
      author: book.author,
      warningCount: book.contentWarnings.length,
      warnings: book.contentWarnings.map(w => ({ category: w.category, severity: w.severity }))
    }))
  })
}