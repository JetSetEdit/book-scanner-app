import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

export async function POST(request: NextRequest) {
  try {
    const { selectedCovers } = await request.json()
    
    if (!selectedCovers || typeof selectedCovers !== 'object') {
      return NextResponse.json({ 
        error: 'Invalid selectedCovers data' 
      }, { status: 400 })
    }

    console.log('Update selected covers API called')
    console.log('Selected covers:', selectedCovers)
    
    const results = []
    let updatedCount = 0
    
    for (const [isbn, filename] of Object.entries(selectedCovers)) {
      try {
        const coverUrl = `/book-covers/${filename}`
        
        // Update the book with the selected cover URL
        const { data: book, error: updateError } = await supabaseAdmin
          .from('books')
          .update({
            cover_url: coverUrl
          })
          .eq('isbn', isbn)
          .select('isbn, title, cover_url')
          .single()

        if (updateError) {
          console.error(`Error updating cover for ${isbn}:`, updateError)
          results.push({ 
            isbn, 
            filename,
            success: false, 
            error: updateError.message 
          })
          continue
        }

        results.push({
          isbn,
          filename,
          success: true,
          cover_url: coverUrl,
          book: book
        })

        updatedCount++
        console.log(`✅ Updated cover for ISBN ${isbn}: ${filename}`)

      } catch (error) {
        console.error(`Error processing cover for ${isbn}:`, error)
        results.push({ 
          isbn, 
          filename,
          success: false, 
          error: error instanceof Error ? error.message : 'Unknown error' 
        })
      }
    }

    return NextResponse.json({
      success: true,
      message: `Successfully updated ${updatedCount} book covers`,
      results: results,
      updatedCount: updatedCount,
      summary: {
        totalSelected: Object.keys(selectedCovers).length,
        successfullyUpdated: updatedCount,
        failed: results.filter(r => !r.success).length
      }
    })

  } catch (error) {
    console.error('Update selected covers error:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
