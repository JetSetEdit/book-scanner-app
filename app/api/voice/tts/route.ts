/**
 * Voice Agent TTS API
 * 
 * POST /api/voice/tts
 * 
 * Generates ElevenLabs TTS audio on-the-fly for voice agent responses.
 * Returns audio stream directly (not saved to disk).
 */

import { NextRequest, NextResponse } from 'next/server'

export const maxDuration = 30

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { text, voiceId, voiceSettings } = body

    if (!text || typeof text !== 'string') {
      return NextResponse.json(
        { error: 'Text is required and must be a string' },
        { status: 400 }
      )
    }

    // Get ElevenLabs API key from environment
    let apiKey = process.env.ELEVENLABS_API_KEY
    if (!apiKey) {
      console.error('ELEVENLABS_API_KEY not found in environment')
      // Return a more descriptive error that won't crash the client
      return NextResponse.json(
        { 
          error: 'ElevenLabs API key not configured',
          message: 'Please configure ELEVENLABS_API_KEY in Vercel environment variables'
        },
        { status: 503 } // Service Unavailable instead of 500
      )
    }
    
    // Trim any whitespace
    apiKey = apiKey.trim()
    
    console.log('Using ElevenLabs API key (length):', apiKey.length)
    console.log('API key starts with:', apiKey.substring(0, 10))

    // Default to Australian voice (Charlie) if no voice specified
    // Available Australian voices:
    // - Charlie: IKne3meq5aSn9XLyUdCD
    // - Jordan: GEPKqFxwgbIPS2QuXVwJ
    // - Sophia: LtPsVjX1k0Kl4StEMZPK
    // - James: cmudN4ihcI42n48urXgc
    const defaultVoiceId = 'IKne3meq5aSn9XLyUdCD' // Charlie - Australian
    const selectedVoiceId = voiceId || defaultVoiceId
    
    console.log('🎤 TTS Request - voiceId param:', voiceId)
    console.log('🎤 TTS Request - selectedVoiceId:', selectedVoiceId)
    console.log('🎤 TTS Request - isClonedVoice check:', selectedVoiceId === 'GEPKqFxwgbIPS2QuXVwJ')

    // For cloned/fine-tuned voices, use optimized settings
    // Jordan (GEPKqFxwgbIPS2QuXVwJ) is a fine-tuned voice - use maximum similarity_boost
    // Allow custom voice settings to be passed, otherwise use optimized defaults
    const isClonedVoice = selectedVoiceId === 'GEPKqFxwgbIPS2QuXVwJ' // Jordan
    
    const defaultSettings = isClonedVoice 
      ? {
          stability: 0.35, // Lower stability for more natural variation in cloned voice
          similarity_boost: 1.0, // Maximum similarity to match original voice exactly
        }
      : {
          stability: 0.5,
          similarity_boost: 0.75,
        }

    // Call ElevenLabs TTS API
    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${selectedVoiceId}`,
      {
        method: 'POST',
        headers: {
          'Accept': 'audio/mpeg',
          'Content-Type': 'application/json',
          'xi-api-key': apiKey,
        },
        body: JSON.stringify({
          text,
          // Use turbo model for Jordan (faster and better for cloned voices)
          // Fall back to multilingual_v2 for other voices
          model_id: isClonedVoice ? 'eleven_turbo_v2_5' : 'eleven_multilingual_v2',
          voice_settings: voiceSettings || defaultSettings,
        }),
      }
    )

    if (!response.ok) {
      const errorText = await response.text()
      console.error('ElevenLabs API error:', response.status, errorText)
      console.error('API Key used (first 10 chars):', apiKey.substring(0, 10))
      return NextResponse.json(
        { 
          error: `ElevenLabs API error (${response.status})`,
          details: errorText.substring(0, 200) // Include error details for debugging
        },
        { status: response.status }
      )
    }

    // Get audio buffer
    const audioBuffer = await response.arrayBuffer()

    // Return audio stream directly
    return new NextResponse(audioBuffer, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Length': audioBuffer.byteLength.toString(),
        'Cache-Control': 'no-cache',
      },
    })

  } catch (error: any) {
    console.error('Voice TTS API error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to generate TTS audio',
        details: error.message 
      },
      { status: 500 }
    )
  }
}

