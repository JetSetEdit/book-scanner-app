import { NextRequest, NextResponse } from 'next/server'
import { executeAgentChain, findBookInfo, generateContentWarnings } from '@/lib/agent-chain'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { isbn, testMode, book_title, book_author, book_description, book_categories } = body
    
    if (!isbn) {
      return NextResponse.json({ error: 'ISBN is required' }, { status: 400 })
    }

    console.log('Testing Agent Chain with ISBN:', isbn, 'Mode:', testMode)

    let result: any = {}

    if (testMode === 'full-chain') {
      // Test the complete agent chain
      result = await executeAgentChain(isbn)
    } else if (testMode === 'book-info-only') {
      // Test only the Book Info Finder agent
      result = await findBookInfo(isbn)
    } else if (testMode === 'content-warnings-only') {
      // Test only the Content Warning Generator agent
      if (!book_title || !book_author) {
        return NextResponse.json({ 
          error: 'book_title and book_author are required for content-warnings-only mode' 
        }, { status: 400 })
      }
      result = await generateContentWarnings({
        book_title,
        book_author,
        book_description,
        book_categories,
        book_isbn: isbn
      })
    } else {
      // Default to full chain
      result = await executeAgentChain(isbn)
    }
    
    console.log('Agent Chain test result:', JSON.stringify(result, null, 2))
    
    return NextResponse.json({
      success: true,
      testMode: testMode || 'full-chain',
      result,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Agent Chain test error:', error)
    return NextResponse.json({
      error: 'Agent Chain test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
