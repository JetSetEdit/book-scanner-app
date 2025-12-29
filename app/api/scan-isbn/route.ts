import { NextRequest, NextResponse } from 'next/server'
import { validateISBN } from '@/lib/isbn-validation'
import { processIsbnScan } from '@/lib/services/scan-service'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    console.log('Scan ISBN API called')

    const { isbn, stream, selectedCandidate, forceRefresh, model } = await request.json()
    console.log('Processing ISBN:', isbn)

    if (!isbn) {
      return NextResponse.json({ error: 'ISBN is required' }, { status: 400 })
    }

    // Validate ISBN format
    if (!validateISBN(isbn)) {
      console.log('Invalid ISBN format:', isbn)
      return NextResponse.json({
        error: 'Invalid ISBN format. Please enter a valid 10 or 13 digit ISBN.'
      }, { status: 400 })
    }

    if (stream) {
      // Return a streaming response
      const encoder = new TextEncoder()

      const customStream = new ReadableStream({
        async start(controller) {
          const sendUpdate = (message: string | any) => {
            // Handle both string messages and detailed status updates
            if (typeof message === 'string') {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ status: message })}\n\n`))
            } else {
              // Detailed status update with action, AI response, result
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ statusUpdate: message })}\n\n`))
            }
          }

          try {
            const result = await processIsbnScan(isbn, sendUpdate, selectedCandidate, forceRefresh, model || "gpt-4o")
            
            // Award sparks for scan (non-blocking)
            if (result.success && result.book) {
              // Get user from session
              const supabase = await import('@/lib/supabase/server').then(m => m.createClient())
              const { data: { user } } = await supabase.auth.getUser()
              
            }
            
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ result })}\n\n`))
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : (error as any)?.message || 'Unknown error';
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: errorMessage })}\n\n`))
          } finally {
            controller.close()
          }
        }
      })

      return new NextResponse(customStream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      })
    } else {
      // Standard JSON response
      const result = await processIsbnScan(isbn, undefined, selectedCandidate, false, model || "gpt-4o")
      
      
      return NextResponse.json(result)
    }

  } catch (error) {
    console.error('Scan ISBN error:', JSON.stringify(error, null, 2))
    const errorMessage = error instanceof Error ? error.message : (error as any)?.message || 'Unknown error';
    return NextResponse.json({
      error: 'Failed to process ISBN scan',
      details: errorMessage,
      debug: process.env.NODE_ENV === 'development' ? error : undefined
    }, { status: 500 })
  }
}
