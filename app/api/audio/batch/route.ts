/**
 * API Route: Batch Generate Audio
 * 
 * POST /api/audio/batch
 * 
 * Generates audio for multiple books. Useful for initial setup or regeneration.
 * Processes books in batches to avoid timeouts.
 */

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

export const maxDuration = 300 // 5 minutes for batch processing

interface BatchResult {
  isbn: string
  success: boolean
  audioUrl?: string | null
  error?: string
  briefing?: string
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { isbns, limit = 10, regenerate = false } = body

    if (!isbns || !Array.isArray(isbns) || isbns.length === 0) {
      return NextResponse.json(
        { error: 'isbns array is required' },
        { status: 400 }
      )
    }

    // Limit batch size
    const isbnsToProcess = isbns.slice(0, limit)
    const results: BatchResult[] = []

    // Process each ISBN
    for (const isbn of isbnsToProcess) {
      try {
        // Call the generate endpoint for each book
        const generateUrl = new URL('/api/audio/generate', request.url)
        const response = await fetch(generateUrl.toString(), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ isbn, regenerate })
        })

        const data = await response.json()

        if (response.ok && data.success) {
          results.push({
            isbn,
            success: true,
            audioUrl: data.audioUrl,
            briefing: data.briefing
          })
        } else {
          results.push({
            isbn,
            success: false,
            error: data.error || 'Unknown error'
          })
        }
      } catch (error: any) {
        results.push({
          isbn,
          success: false,
          error: error.message || 'Failed to generate audio'
        })
      }
    }

    const successCount = results.filter(r => r.success).length
    const failureCount = results.filter(r => !r.success).length

    return NextResponse.json({
      success: true,
      message: `Processed ${isbnsToProcess.length} books`,
      results,
      summary: {
        total: isbnsToProcess.length,
        successful: successCount,
        failed: failureCount
      }
    })

  } catch (error: any) {
    console.error('Batch audio generation error:', error)
    return NextResponse.json(
      { error: 'Failed to process batch', details: error.message },
      { status: 500 }
    )
  }
}
