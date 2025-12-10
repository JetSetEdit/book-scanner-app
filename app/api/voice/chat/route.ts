/**
 * Voice Agent Chat API
 * 
 * POST /api/voice/chat
 * 
 * Handles conversational queries about books and content warnings.
 * Accepts text queries and returns text responses suitable for TTS.
 */

import { NextRequest, NextResponse } from 'next/server'
import { processVoiceQuery, VoiceAgentContext } from '@/lib/services/voice-agent'

export const maxDuration = 30

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { query, isbn, bookId, conversationHistory } = body

    if (!query || typeof query !== 'string') {
      return NextResponse.json(
        { error: 'Query is required and must be a string' },
        { status: 400 }
      )
    }

    const context: VoiceAgentContext = {
      isbn,
      bookId,
      conversationHistory
    }

    console.log('🎤 [Voice Chat API] Processing query:', query.substring(0, 50))
    console.log('🎤 [Voice Chat API] Context:', { isbn, bookId, historyLength: conversationHistory?.length || 0 })

    const response = await processVoiceQuery(query, context)

    console.log('✅ [Voice Chat API] Response generated:', response.text.substring(0, 100))
    console.log('✅ [Voice Chat API] Response length:', response.text.length)

    return NextResponse.json({
      success: true,
      ...response
    })

  } catch (error: any) {
    console.error('Voice chat API error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to process voice query',
        details: error.message 
      },
      { status: 500 }
    )
  }
}

