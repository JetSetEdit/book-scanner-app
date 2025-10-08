import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import fs from 'fs'
import path from 'path'

// Read the correct cover results
const resultsPath = path.join(process.cwd(), 'correct-covers-results.json')
const coverResults = JSON.parse(fs.readFileSync(resultsPath, 'utf8'))

export async function POST(request: NextRequest) {
  try {
    console.log('Update correct book covers API called')
    
    const results = []
    
    for (const coverData of coverResults) {
      try {
        // Update the book with the correct local cover URL
        const { data: book, error: updateError } = await supabaseAdmin
          .from('books')
          .update({
            cover_url: coverData.local_cover_url
          })
          .eq('isbn', coverData.isbn)
          .select('isbn, title, cover_url')
          .single()

        if (updateError) {
          console.error(`Error updating cover for ${coverData.isbn}:`, updateError)
          results.push({ 
            isbn: coverData.isbn, 
            title: coverData.title,
            success: false, 
            error: updateError.message 
          })
          continue
        }

        results.push({
          isbn: coverData.isbn,
          title: coverData.title,
          success: true,
          cover_url: coverData.local_cover_url,
          found_title: coverData.found_title,
          found_author: coverData.found_author,
          book: book
        })

        console.log(`✅ Updated correct cover for: ${coverData.title}`)

      } catch (error) {
        console.error(`Error processing cover for ${coverData.isbn}:`, error)
        results.push({ 
          isbn: coverData.isbn, 
          title: coverData.title,
          success: false, 
          error: error instanceof Error ? error.message : 'Unknown error' 
        })
      }
    }

    const successCount = results.filter(r => r.success).length

    return NextResponse.json({
      success: true,
      message: `Successfully updated ${successCount} correct book covers`,
      results: results,
      summary: {
        coversUpdated: successCount,
        totalBooks: coverResults.length
      }
    })

  } catch (error) {
    console.error('Update correct book covers error:', error)
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
