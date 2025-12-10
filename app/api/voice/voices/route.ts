/**
 * Voice Agent Voices API
 * 
 * GET /api/voice/voices
 * 
 * Lists available ElevenLabs voices for the user.
 */

import { NextRequest, NextResponse } from 'next/server'

export const maxDuration = 30

export async function GET(request: NextRequest) {
  try {
    // Get ElevenLabs API key from environment
    const apiKey = process.env.ELEVENLABS_API_KEY
    if (!apiKey) {
      return NextResponse.json(
        { error: 'ElevenLabs API key not configured' },
        { status: 500 }
      )
    }

    // Call ElevenLabs API to get voices
    const response = await fetch('https://api.elevenlabs.io/v1/voices', {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'xi-api-key': apiKey.trim(),
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('ElevenLabs voices API error:', response.status, errorText)
      return NextResponse.json(
        { error: `ElevenLabs API error (${response.status})` },
        { status: response.status }
      )
    }

    const data = await response.json()
    
    // Filter for Australian voices (including custom/cloned voices)
    // Also include voices that might be custom clones with Australian accent
    const australianVoices = data.voices?.filter((voice: any) => 
      voice.labels?.accent?.toLowerCase().includes('australian') ||
      voice.labels?.accent?.toLowerCase().includes('australia') ||
      voice.labels?.accent?.toLowerCase().includes('en-australian') ||
      voice.name?.toLowerCase().includes('australian') ||
      voice.name?.toLowerCase().includes('australia') ||
      voice.name?.toLowerCase().includes('jordan') // Include Jordan specifically
    ) || []

    return NextResponse.json({
      success: true,
      allVoices: data.voices || [],
      australianVoices,
      totalVoices: data.voices?.length || 0
    })

  } catch (error: any) {
    console.error('Voice voices API error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to fetch voices',
        details: error.message 
      },
      { status: 500 }
    )
  }
}

