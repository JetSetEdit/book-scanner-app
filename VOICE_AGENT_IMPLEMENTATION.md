# Voice Agent Implementation

## Overview

Interactive voice agent that allows users to ask questions about books and content warnings using natural language. The agent uses browser-based speech-to-text and text-to-speech APIs for a conversational interface.

## Features

### ✅ Completed

1. **Voice Agent Service** (`lib/services/voice-agent.ts`)
   - Processes conversational queries about books
   - Handles various question types:
     - Content warnings queries
     - Severe warnings queries
     - Book summary queries
     - Classification rating queries
     - Author and category queries
   - Returns natural language responses with suggested follow-up questions

2. **API Route** (`app/api/voice/chat/route.ts`)
   - `POST /api/voice/chat` - Handles voice/text queries
   - Accepts query, ISBN, bookId, and conversation history
   - Returns text response suitable for TTS

3. **Voice Agent Component** (`components/voice-agent.tsx`)
   - React component with full voice interface
   - Speech-to-text using Web Speech API
   - Text-to-speech using browser Speech Synthesis API
   - Conversation history display
   - Suggested questions for follow-up
   - Visual feedback for listening/speaking states

4. **Integration**
   - Integrated into book details page
   - Automatically uses ISBN and bookId from current book
   - Accessible and keyboard-friendly

## Usage

### For Users

1. Navigate to any book detail page
2. Scroll to the "Voice Assistant" section
3. Click the microphone button to start listening
4. Ask questions like:
   - "What are the content warnings?"
   - "Tell me about this book"
   - "What are the severe warnings?"
   - "What's the classification rating?"
5. The agent will respond with audio and text
6. Use suggested questions for quick follow-ups

### Supported Queries

- **Content Warnings**: "What are the content warnings?", "Tell me about the warnings"
- **Severe Warnings**: "What are the severe warnings?", "Are there serious warnings?"
- **Book Summary**: "Tell me about this book", "What's this book about?"
- **Rating**: "What's the classification rating?", "What rating does this have?"
- **Author**: "Who wrote this book?", "What's the author?"
- **Categories**: "What genre is this?", "What categories?"

## Technical Details

### Browser Compatibility

- **Speech Recognition**: Chrome, Edge, Safari (WebKit)
- **Speech Synthesis**: All modern browsers
- Falls back gracefully if not supported

### Architecture

```
User Voice Input
    ↓
Web Speech API (STT)
    ↓
Voice Agent Service
    ↓
Book Data + Content Warnings
    ↓
Natural Language Response
    ↓
Browser Speech Synthesis (TTS)
    ↓
Audio Output
```

### API Endpoint

```typescript
POST /api/voice/chat
Body: {
  query: string
  isbn?: string
  bookId?: string
  conversationHistory?: Array<{role: 'user' | 'assistant', content: string}>
}

Response: {
  success: boolean
  text: string
  shouldContinue: boolean
  suggestedQuestions?: string[]
}
```

## Future Enhancements

1. **ElevenLabs Integration**
   - Use ElevenLabs TTS for higher quality audio
   - Custom voice selection
   - Better pronunciation

2. **Conversation Context**
   - Better context awareness across multiple turns
   - Reference previous answers
   - More natural follow-up handling

3. **Advanced Queries**
   - Specific warning details ("Tell me about violence warnings")
   - Comparison queries ("Compare warnings with another book")
   - Recommendation queries ("Is this suitable for teenagers?")

4. **Accessibility Improvements**
   - Better screen reader support
   - Keyboard shortcuts
   - Visual indicators for audio state

5. **Multi-language Support**
   - Support for multiple languages
   - Language detection
   - Translation of responses

## Files Created/Modified

- `lib/services/voice-agent.ts` - Voice agent service logic
- `app/api/voice/chat/route.ts` - API endpoint
- `components/voice-agent.tsx` - React component
- `components/book-details.tsx` - Integration point

## Testing

To test the voice agent:

1. Start the development server: `npm run dev`
2. Navigate to a book detail page (scan a book first)
3. Scroll to the Voice Assistant section
4. Click the microphone button
5. Ask a question about the book
6. Verify the response is both spoken and displayed

## Notes

- The voice agent requires microphone permissions
- Works best in Chrome/Edge browsers
- Conversation history is maintained in component state
- All responses are generated server-side for consistency

