import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

export async function GET() {
  try {
    const coversDir = path.join(process.cwd(), 'public', 'book-covers')
    
    if (!fs.existsSync(coversDir)) {
      return NextResponse.json({ coverOptions: {} })
    }

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

      // Determine source from filename
      let source = 'unknown'
      if (filename.includes('google')) {
        source = 'Google Books'
      } else if (filename.includes('better')) {
        source = 'Open Library'
      } else if (filename.includes('openlibrary')) {
        source = 'Open Library'
      } else {
        source = 'Original'
      }

      coverOptions[isbn].push({
        filename,
        url: `/book-covers/${filename}`,
        size_kb: sizeKB,
        source
      })
    })

    // Sort options by file size (largest first)
    Object.keys(coverOptions).forEach(isbn => {
      coverOptions[isbn].sort((a, b) => b.size_kb - a.size_kb)
    })

    return NextResponse.json({
      success: true,
      coverOptions
    })

  } catch (error) {
    console.error('Get cover options error:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
