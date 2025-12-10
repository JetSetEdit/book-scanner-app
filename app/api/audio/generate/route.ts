/**
 * API Route: Generate Audio for Book
 * 
 * POST /api/audio/generate
 * 
 * Generates or regenerates audio content briefing for a book.
 * Can be called for a single book or triggered after warning updates.
 */

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { generateContentBriefing, validateBriefing } from '@/lib/utils/content-briefing'
import { generateTTSAudio, estimateAudioDuration, validateTTSText } from '@/lib/services/elevenlabs-tts'

export const maxDuration = 60 // Allow up to 60 seconds for TTS generation

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { isbn, regenerate = false } = body

    if (!isbn) {
      return NextResponse.json(
        { error: 'ISBN is required' },
        { status: 400 }
      )
    }

    // Fetch book and warnings
    const { data: book, error: bookError } = await supabaseAdmin
      .from('books')
      .select('*')
      .eq('isbn', isbn)
      .single()

    if (bookError || !book) {
      return NextResponse.json(
        { error: 'Book not found' },
        { status: 404 }
      )
    }

    // Check if audio already exists and regeneration not requested
    if (!regenerate && book.audio_url) {
      return NextResponse.json({
        success: true,
        message: 'Audio already exists',
        audioUrl: book.audio_url,
        duration: book.audio_duration,
        briefing: book.content_briefing
      })
    }

    // Fetch content warnings
    const { data: warnings, error: warningsError } = await supabaseAdmin
      .from('content_warnings')
      .select('*')
      .eq('book_id', book.id)

    if (warningsError) {
      return NextResponse.json(
        { error: 'Failed to fetch warnings' },
        { status: 500 }
      )
    }

    // Generate content briefing
    const briefing = generateContentBriefing(book, warnings || [])
    
    // Validate briefing
    const briefingValidation = validateBriefing(briefing)
    if (!briefingValidation.valid) {
      console.warn('Briefing validation issues:', briefingValidation.issues)
      // Continue anyway, but log the issues
    }

    // Validate TTS text
    const ttsValidation = validateTTSText(briefing)
    if (!ttsValidation.valid) {
      return NextResponse.json(
        { error: 'Text validation failed', issues: ttsValidation.issues },
        { status: 400 }
      )
    }

    // Generate audio (this will throw if MCP not integrated)
    let audioResult
    try {
      audioResult = await generateTTSAudio(briefing, isbn, {
        voiceId: book.audio_voice_id || undefined
      })
    } catch (error: any) {
      // If MCP not integrated, return briefing without audio
      if (error.message?.includes('ELEVENLABS_API_KEY')) {
        return NextResponse.json(
          { error: 'ElevenLabs API key not configured', details: error.message },
          { status: 500 }
        )
      }
      throw error
    }

    // Save audio URL and metadata to database
    const { error: updateError } = await supabaseAdmin
      .from('books')
      .update({
        content_briefing: briefing,
        audio_url: audioResult.audioUrl,
        audio_duration: audioResult.duration,
        audio_transcript: audioResult.transcript,
        audio_generated_at: new Date().toISOString(),
        audio_voice_id: audioResult.voiceId
      })
      .eq('isbn', isbn)

    if (updateError) {
      return NextResponse.json(
        { error: 'Failed to save audio metadata', details: updateError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Audio generated successfully',
      audioUrl: audioResult.audioUrl,
      duration: audioResult.duration,
      briefing,
      transcript: audioResult.transcript
    })

  } catch (error: any) {
    console.error('Audio generation error:', error)
    return NextResponse.json(
      { error: 'Failed to generate audio', details: error.message },
      { status: 500 }
    )
  }
}
