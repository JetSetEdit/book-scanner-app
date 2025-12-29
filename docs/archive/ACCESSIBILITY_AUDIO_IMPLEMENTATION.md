# Accessibility Audio Implementation

## Overview

This document outlines the implementation of accessibility-focused audio features for Subtext using ElevenLabs TTS via MCP. The implementation follows WCAG 2.1 Level AA guidelines and provides screen-reader-friendly content briefings.

## Implementation Status

### ✅ Completed

1. **Database Schema** (`supabase/migrations/20251211_add_audio_accessibility_fields.sql`)
   - Added `content_briefing` (TEXT) - Screen-reader-friendly text summary
   - Added `audio_url` (TEXT) - URL to generated MP3 file
   - Added `audio_duration` (INTEGER) - Duration in seconds
   - Added `audio_transcript` (TEXT) - Full transcript for accessibility
   - Added `audio_generated_at` (TIMESTAMP) - Generation timestamp
   - Added `audio_voice_id` (TEXT) - ElevenLabs voice ID used

2. **Content Briefing Generator** (`lib/utils/content-briefing.ts`)
   - Pure function to generate 20-60 word summaries
   - Neutral, non-judgmental language
   - Avoids spoilers
   - Groups warnings by severity and category
   - Includes audience hints when available
   - Validation function included

3. **ElevenLabs TTS Service** (`lib/services/elevenlabs-tts.ts`)
   - Interface for TTS generation
   - File structure for audio storage (`public/audio/subtext/{isbn}.mp3`)
   - Duration estimation helper
   - Text validation for TTS
   - **Note:** MCP integration pending (see below)

4. **API Routes**
   - `POST /api/audio/generate` - Generate audio for single book
   - `POST /api/audio/batch` - Batch generate audio for multiple books
   - Both routes handle MCP integration gracefully (returns briefing if MCP not available)

5. **Accessible Audio Player** (`components/accessible-audio-player.tsx`)
   - WCAG 2.1 Level AA compliant
   - Keyboard operable (no mouse required)
   - Screen reader friendly (ARIA labels)
   - No autoplay (user must press play)
   - Shows transcript alongside audio
   - Progress bar with time indicators
   - Error handling

6. **UI Integration**
   - Audio player added to `components/book-details.tsx`
   - Conditionally renders when `audio_url` and `content_briefing` exist
   - Positioned between synopsis and content warnings

### ⚠️ Pending

1. **ElevenLabs MCP Integration**
   - The `generateTTSAudio` function needs to be wired to ElevenLabs MCP tools
   - Current implementation throws error indicating MCP integration needed
   - Once MCP tools are available, update `lib/services/elevenlabs-tts.ts`

2. **TypeScript Types Update**
   - Update `types/supabase.ts` to include new audio fields
   - Run Supabase type generation after migration is applied

3. **Scanner/Quick Result Integration**
   - Add audio controls to `app/scan-test/page.tsx`
   - Show "generating audio" state if audio not ready

## Next Steps

### 1. Apply Database Migration

```bash
# Apply the migration via Supabase dashboard or CLI
supabase migration up
```

### 2. Update TypeScript Types

After migration is applied, regenerate types:

```bash
npx supabase gen types typescript --project-id YOUR_PROJECT_ID > types/supabase.ts
```

Or manually add to `types/supabase.ts`:

```typescript
books: {
  Row: {
    // ... existing fields
    content_briefing: string | null
    audio_url: string | null
    audio_duration: number | null
    audio_transcript: string | null
    audio_generated_at: string | null
    audio_voice_id: string | null
  }
  // ... Insert and Update types
}
```

### 3. Wire Up ElevenLabs MCP

Once ElevenLabs MCP tools are available, update `lib/services/elevenlabs-tts.ts`:

```typescript
// Replace the TODO section with actual MCP call
const audioBuffer = await mcpElevenLabs.textToSpeech({
  text,
  voiceId,
  model,
  stability,
  similarityBoost
})

await writeFile(filePath, audioBuffer)
const audioUrl = `/audio/subtext/${filename}`
const duration = estimateAudioDuration(text)

return {
  audioUrl,
  duration,
  transcript: text,
  voiceId
}
```

### 4. Test Audio Generation

```bash
# Generate audio for a single book
curl -X POST http://localhost:3000/api/audio/generate \
  -H "Content-Type: application/json" \
  -d '{"isbn": "9781405293181"}'

# Batch generate for multiple books
curl -X POST http://localhost:3000/api/audio/batch \
  -H "Content-Type: application/json" \
  -d '{"isbns": ["9781405293181", "9781546171461"], "limit": 10}'
```

### 5. Add to Scanner Results

Update `app/scan-test/page.tsx` to show audio player when available:

```typescript
{result?.book?.audio_url && (
  <AccessibleAudioPlayer
    audioUrl={result.book.audio_url}
    duration={result.book.audio_duration}
    transcript={result.book.audio_transcript || result.book.content_briefing}
    briefing={result.book.content_briefing}
  />
)}
```

## Accessibility Compliance

### WCAG 2.1 Level AA Requirements Met

- ✅ **1.1.1 Non-text Content**: Transcript always available alongside audio
- ✅ **2.1.1 Keyboard**: All controls keyboard operable
- ✅ **2.4.4 Link Purpose**: Clear labels for all interactive elements
- ✅ **4.1.2 Name, Role, Value**: Proper ARIA labels and roles
- ✅ **No Autoplay**: User must explicitly press play
- ✅ **Error Handling**: Clear error messages for failed audio loads

### Testing Checklist

See `ACCESSIBILITY_TEST_PLAN.md` for detailed testing procedures.

## File Structure

```
lib/
  utils/
    content-briefing.ts          # Briefing text generation
  services/
    elevenlabs-tts.ts          # TTS service (MCP integration pending)

components/
  accessible-audio-player.tsx  # WCAG-compliant audio player

app/
  api/
    audio/
      generate/
        route.ts               # Single book audio generation
      batch/
        route.ts               # Batch audio generation

supabase/
  migrations/
    20251211_add_audio_accessibility_fields.sql  # Database schema
```

## Usage Examples

### Generate Briefing Only (No Audio)

The system will generate and save the briefing text even if MCP is not integrated:

```typescript
const response = await fetch('/api/audio/generate', {
  method: 'POST',
  body: JSON.stringify({ isbn: '9781405293181' })
})

// Returns:
// {
//   success: true,
//   briefing: "...",
//   estimatedDuration: 45,
//   requiresMCPIntegration: true
// }
```

### Generate Audio (After MCP Integration)

Once MCP is wired up, audio will be generated automatically:

```typescript
// Same API call, but now returns audioUrl
// {
//   success: true,
//   audioUrl: "/audio/subtext/9781405293181.mp3",
//   duration: 45,
//   briefing: "...",
//   transcript: "..."
// }
```

## Future Enhancements

1. **Voice Navigation** (Optional, Step 6)
   - Voice-activated queries ("What are the main warnings?")
   - ElevenLabs agent integration for conversational interface
   - Must remain additive (text always available)

2. **Audio Regeneration**
   - Auto-regenerate when warnings are updated
   - Background job to process updates

3. **Multiple Voices**
   - User preference for voice selection
   - Different voices for different content types

4. **Audio Quality Settings**
   - High-quality for download
   - Compressed for streaming
