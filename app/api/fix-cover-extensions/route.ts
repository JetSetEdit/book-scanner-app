import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

// Cover URL fixes for correct file extensions
const coverFixes = [
  {
    isbn: "9780008710262",
    title: "When the Moon Hatched",
    correct_cover_url: "/book-covers/9780008710262_when_the_moon_hatched.jpg"
  },
  {
    isbn: "9781668001236", 
    title: "Wildfire",
    correct_cover_url: "/book-covers/9781668001236_wildfire.jpg"
  }
]

export async function POST(request: NextRequest) {
  try {
    console.log('Fix cover extensions API called')
    
    const results = []
    
    for (const fix of coverFixes) {
      try {
        // Update the book with the correct cover URL
        const { data: book, error: updateError } = await supabaseAdmin
          .from('books')
          .update({
            cover_url: fix.correct_cover_url
          })
          .eq('isbn', fix.isbn)
          .select('isbn, title, cover_url')
          .single()

        if (updateError) {
          console.error(`Error updating cover for ${fix.isbn}:`, updateError)
          results.push({ 
            isbn: fix.isbn, 
            title: fix.title,
            success: false, 
            error: updateError.message 
          })
          continue
        }

        results.push({
          isbn: fix.isbn,
          title: fix.title,
          success: true,
          cover_url: fix.correct_cover_url,
          book: book
        })

        console.log(`✅ Fixed cover extension for: ${fix.title}`)

      } catch (error) {
        console.error(`Error processing cover for ${fix.isbn}:`, error)
        results.push({ 
          isbn: fix.isbn, 
          title: fix.title,
          success: false, 
          error: error instanceof Error ? error.message : 'Unknown error' 
        })
      }
    }

    const successCount = results.filter(r => r.success).length

    return NextResponse.json({
      success: true,
      message: `Successfully fixed ${successCount} cover extensions`,
      results: results,
      summary: {
        coversFixed: successCount,
        totalFixes: coverFixes.length
      }
    })

  } catch (error) {
    console.error('Fix cover extensions error:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// GET endpoint to check current cover status
export async function GET() {
  try {
    const { data: books, error } = await supabaseAdmin
      .from('books')
      .select('isbn, title, cover_url')
      .order('title')

    if (error) {
      return NextResponse.json({ 
        error: 'Failed to fetch books', 
        details: error.message 
      }, { status: 500 })
    }

    return NextResponse.json({
      message: 'Current book cover status',
      books: books,
      summary: {
        totalBooks: books.length,
        booksWithCovers: books.filter(b => b.cover_url).length,
        booksWithoutCovers: books.filter(b => !b.cover_url).length
      }
    })

  } catch (error) {
    console.error('Get book covers error:', error)
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 })
  }
}
