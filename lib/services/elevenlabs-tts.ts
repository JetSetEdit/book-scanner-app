/**
 * ElevenLabs Text-to-Speech Service
 * 
 * Integrates with ElevenLabs API for generating accessible audio content.
 * Generates MP3 files from content briefings for screen reader support.
 * 
 * Uses ElevenLabs API key from environment variables (set via Cursor MCP integration).
 */

import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'

export interface TTSOptions {
  /** Voice ID from ElevenLabs (default: clear, neutral voice) */
  voiceId?: string
  /** Model to use (default: 'eleven_multilingual_v2') */
  model?: string
  /** Stability setting (0.0-1.0, default: 0.5) */
  stability?: number
  /** Similarity boost (0.0-1.0, default: 0.75) */
  similarityBoost?: number
}

export interface TTSResult {
  /** URL to the generated audio file */
  audioUrl: string
  /** Duration in seconds */
  duration: number
  /** Full transcript (same as input for TTS) */
  transcript: string
  /** Voice ID used */
  voiceId: string
}

/**
 * Generates audio from text using ElevenLabs TTS API
 * 
 * @param text - Content briefing text to convert to speech
 * @param isbn - Book ISBN for file naming
 * @param options - TTS generation options
 * @returns TTS result with audio URL and metadata
 */
export async function generateTTSAudio(
  text: string,
  isbn: string,
  options: TTSOptions = {}
): Promise<TTSResult> {
  const {
    voiceId = '21m00Tcm4TlvDq8ikWAM', // ElevenLabs default clear voice
    model = 'eleven_multilingual_v2',
    stability = 0.5,
    similarityBoost = 0.75
  } = options

  // Ensure audio directory exists
  const audioDir = join(process.cwd(), 'public', 'audio', 'subtext')
  if (!existsSync(audioDir)) {
    await mkdir(audioDir, { recursive: true })
  }

  // Generate filename
  const filename = `${isbn}.mp3`
  const filePath = join(audioDir, filename)

  // Get ElevenLabs API key from environment
  const apiKey = process.env.ELEVENLABS_API_KEY
  if (!apiKey) {
    throw new Error(
      'ELEVENLABS_API_KEY environment variable is not set. ' +
      'Please ensure ElevenLabs is connected in Cursor settings or set ELEVENLABS_API_KEY in .env.local'
    )
  }

  // Call ElevenLabs TTS API
  try {
    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
      {
        method: 'POST',
        headers: {
          'Accept': 'audio/mpeg',
          'Content-Type': 'application/json',
          'xi-api-key': apiKey,
        },
        body: JSON.stringify({
          text,
          model_id: model,
          voice_settings: {
            stability,
            similarity_boost: similarityBoost,
          },
        }),
      }
    )

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(
        `ElevenLabs API error (${response.status}): ${errorText}`
      )
    }

    // Get audio buffer
    const audioBuffer = await response.arrayBuffer()
    const buffer = Buffer.from(audioBuffer)

    // Save to file
    await writeFile(filePath, buffer)

    // Generate URL (relative to public folder)
    const audioUrl = `/audio/subtext/${filename}`

    // Estimate duration (rough: ~150 words per minute)
    const wordCount = text.split(/\s+/).length
    const duration = Math.ceil((wordCount / 150) * 60)

    return {
      audioUrl,
      duration,
      transcript: text,
      voiceId,
    }
  } catch (error: any) {
    // Re-throw with more context
    if (error.message?.includes('ElevenLabs API error')) {
      throw error
    }
    throw new Error(
      `Failed to generate TTS audio: ${error.message}`
    )
  }
}

/**
 * Estimates audio duration from text
 * Uses average speaking rate of 150 words per minute
 */
export function estimateAudioDuration(text: string): number {
  const wordCount = text.split(/\s+/).length
  const wordsPerMinute = 150
  return Math.ceil((wordCount / wordsPerMinute) * 60)
}

/**
 * Validates text is suitable for TTS
 */
export function validateTTSText(text: string): {
  valid: boolean
  issues: string[]
} {
  const issues: string[] = []
  
  if (text.length === 0) {
    issues.push('Text cannot be empty')
  }
  
  if (text.length > 5000) {
    issues.push(`Text too long (${text.length} chars, max 5000)`)
  }
  
  // Check for problematic characters that might break TTS
  if (text.match(/[^\w\s.,!?;:'"()-]/)) {
    issues.push('Text contains special characters that may not render well in TTS')
  }
  
  return {
    valid: issues.length === 0,
    issues
  }
}
