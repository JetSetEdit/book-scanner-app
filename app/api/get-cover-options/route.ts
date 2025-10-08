import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import fs from 'fs'
import path from 'path'

export async function GET() {
  try {
    const coversDir = path.join(process.cwd(), 'public', 'book-covers')
    
    if (!fs.existsSync(coversDir)) {
      return NextResponse.json({ coverOptions: {} })
    }

    // Get current book covers from database
    const { data: books, error } = await supabaseAdmin
      .from('books')
      .select('isbn, title, cover_url')
      .order('title')

    if (error) {
      console.error('Error fetching books:', error)
    }

    const currentCovers: Record<string, string> = {}
    books?.forEach(book => {
      if (book.cover_url) {
        const filename = book.cover_url.split('/').pop()
        if (filename) {
          currentCovers[book.isbn] = filename
        }
      }
    })

    const files = fs.readdirSync(coversDir)
    const coverOptions: Record<string, any[]> = {}

    // Group files by ISBN
    files.forEach(filename => {
      // Extract ISBN from filename (first 13 characters)
      const isbn = filename.substring(0, 13)
      
      if (!coverOptions[isbn]) {
        coverOptions[isbn] = []
      }

      // Get file stats
      const filePath = path.join(coversDir, filename)
      const stats = fs.statSync(filePath)
      const sizeKB = Math.round(stats.size / 1024)

      // Determine source and variant from filename
      let source = 'Unknown'
      let variant = 'Original'
      
      if (filename.includes('google')) {
        source = 'Google Books'
        variant = 'Google Books API'
      } else if (filename.includes('better')) {
        source = 'Open Library'
        variant = 'Open Library (Better)'
      } else if (filename.includes('openlibrary')) {
        source = 'Open Library'
        variant = 'Open Library API'
      } else if (filename.includes('storygraph')) {
        source = 'StoryGraph'
        variant = 'StoryGraph API'
      } else if (filename.includes('amazon')) {
        source = 'Amazon'
        variant = 'Amazon API'
      } else if (filename.includes('goodreads')) {
        source = 'Goodreads'
        variant = 'Goodreads API'
      } else {
        source = 'Local'
        variant = 'Manual Upload'
      }

      // Check if this is the current cover
      const isCurrent = currentCovers[isbn] === filename

      coverOptions[isbn].push({
        filename,
        url: `/book-covers/${filename}`,
        size_kb: sizeKB,
        source,
        variant,
        is_current: isCurrent
      })
    })

    // Sort options by file size (largest first), then by source preference
    Object.keys(coverOptions).forEach(isbn => {
      coverOptions[isbn].sort((a, b) => {
        // First sort by file size (largest first)
        if (b.size_kb !== a.size_kb) {
          return b.size_kb - a.size_kb
        }
        
        // Then sort by source preference
        const sourceOrder = ['Open Library', 'Google Books', 'StoryGraph', 'Amazon', 'Goodreads', 'Local', 'Unknown']
        const aIndex = sourceOrder.indexOf(a.source)
        const bIndex = sourceOrder.indexOf(b.source)
        
        if (aIndex !== bIndex) {
          return aIndex - bIndex
        }
        
        // Finally sort by filename
        return a.filename.localeCompare(b.filename)
      })
    })

    return NextResponse.json({
      success: true,
      coverOptions,
      books: books || []
    })

  } catch (error) {
    console.error('Get cover options error:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
