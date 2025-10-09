import { NextResponse } from 'next/server'
import { findBookAndGenerateWarnings } from '@/lib/content-warning-agent'

export async function POST(request: Request) {
  try {
    const { isbn } = await request.json()
    
    if (!isbn) {
      return NextResponse.json({ error: 'ISBN is required' }, { status: 400 })
    }

    console.log('Testing AI agent with ISBN:', isbn)
    const result = await findBookAndGenerateWarnings(isbn)
    
    console.log('AI agent result:', JSON.stringify(result, null, 2))
    
    return NextResponse.json({
      success: true,
      result
    })
  } catch (error) {
    console.error('AI agent test error:', error)
    return NextResponse.json({
      error: 'AI agent test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

