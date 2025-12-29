# ElevenLabs API Key Setup

## Getting Your API Key

Since you've connected ElevenLabs in Cursor settings, you can get your API key from:

1. **ElevenLabs Dashboard**: https://elevenlabs.io/app/settings/api-keys
2. **Or from Cursor MCP Settings**: The API key should be stored in Cursor's MCP configuration

## Adding to .env.local

Add the following to your `.env.local` file:

```bash
ELEVENLABS_API_KEY=your_api_key_here
```

## Testing the Integration

Once the API key is set, test the audio generation:

```bash
# Test via API
curl -X POST http://localhost:3000/api/audio/generate \
  -H "Content-Type: application/json" \
  -d '{"isbn": "9781405293181"}'
```

Or visit a book page that has content warnings - the audio player will appear automatically once audio is generated.

## How It Works

1. When you call `/api/audio/generate`, it:
   - Generates a content briefing from the book's warnings
   - Calls ElevenLabs TTS API to convert text to speech
   - Saves the MP3 file to `public/audio/subtext/{isbn}.mp3`
   - Updates the book record with audio URL and metadata

2. The audio player component automatically appears on book detail pages when `audio_url` exists

3. Audio is accessible, WCAG-compliant, and includes full transcript
