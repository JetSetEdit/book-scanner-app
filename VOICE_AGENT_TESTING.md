# Voice Agent Testing Guide

## Overview

The voice agent has been implemented but **not yet tested**. This document outlines how to test it.

## Prerequisites

1. **Development server running**
   ```bash
   npm run dev
   ```

2. **Database access**
   - Ensure Supabase is configured
   - Have at least one book scanned in the database

3. **Browser requirements**
   - Chrome or Edge (for Web Speech API support)
   - Microphone permissions granted

## Testing Methods

### 1. Automated API Testing

Run the test script:

```bash
# In one terminal, start the dev server
npm run dev

# In another terminal, run the test script
npx tsx scripts/test-voice-agent.ts
```

The test script will:
- Test various query types (warnings, summary, rating, etc.)
- Validate response structure
- Check for expected content in responses
- Provide a summary report

### 2. Manual Browser Testing

1. **Start the dev server:**
   ```bash
   npm run dev
   ```

2. **Navigate to a book detail page:**
   - Go to `http://localhost:3000/scan-test`
   - Scan a book (e.g., ISBN: `9781405293181`)
   - Or navigate directly to `/book/[isbn]`

3. **Test the voice agent:**
   - Scroll to the "Voice Assistant" section
   - Click the microphone button
   - Grant microphone permissions if prompted
   - Ask questions like:
     - "What are the content warnings?"
     - "Tell me about this book"
     - "What are the severe warnings?"
     - "What's the classification rating?"

4. **Verify:**
   - ✅ Speech recognition works (you see your question transcribed)
   - ✅ API responds correctly (you get a text response)
   - ✅ Text-to-speech works (you hear the response)
   - ✅ Suggested questions appear
   - ✅ Conversation history displays correctly

### 3. API Endpoint Testing (curl)

Test the API directly:

```bash
# Test without ISBN (should prompt for ISBN)
curl -X POST http://localhost:3000/api/voice/chat \
  -H "Content-Type: application/json" \
  -d '{"query": "What are the content warnings?"}'

# Test with ISBN
curl -X POST http://localhost:3000/api/voice/chat \
  -H "Content-Type: application/json" \
  -d '{
    "query": "What are the content warnings?",
    "isbn": "9781405293181"
  }'

# Test with bookId
curl -X POST http://localhost:3000/api/voice/chat \
  -H "Content-Type: application/json" \
  -d '{
    "query": "Tell me about this book",
    "bookId": "your-book-id-here"
  }'
```

Expected response:
```json
{
  "success": true,
  "text": "Book title by Author contains X content warnings...",
  "shouldContinue": true,
  "suggestedQuestions": [
    "What are the severe warnings?",
    "Tell me more about the content"
  ]
}
```

## Test Cases

### ✅ Basic Functionality
- [ ] Query without ISBN/bookId returns helpful message
- [ ] Query with ISBN fetches book data
- [ ] Query with bookId fetches book data
- [ ] Invalid ISBN returns error message

### ✅ Query Types
- [ ] Content warnings query returns warnings summary
- [ ] Severe warnings query filters to severe only
- [ ] Summary query returns book briefing
- [ ] Rating query returns classification rating
- [ ] Author query returns author name
- [ ] Category query returns genres/categories
- [ ] Default query returns helpful overview

### ✅ Response Quality
- [ ] Responses are natural and conversational
- [ ] Responses include relevant information
- [ ] Suggested questions are helpful
- [ ] Responses handle edge cases (no warnings, missing data)

### ✅ UI/UX
- [ ] Microphone button works
- [ ] Speech recognition activates
- [ ] Visual feedback during listening
- [ ] Visual feedback during speaking
- [ ] Conversation history displays
- [ ] Suggested questions are clickable
- [ ] Error messages are user-friendly

### ✅ Browser Compatibility
- [ ] Works in Chrome
- [ ] Works in Edge
- [ ] Graceful degradation in unsupported browsers
- [ ] Microphone permissions handled correctly

## Known Issues / TODO

1. **ElevenLabs Integration**
   - Currently uses browser TTS only
   - Could integrate ElevenLabs for better quality
   - Would need API route for TTS generation

2. **Conversation Context**
   - Basic conversation history implemented
   - Could be enhanced for better context awareness
   - Could use AI to understand follow-up questions better

3. **Error Handling**
   - Basic error handling in place
   - Could add more specific error messages
   - Could add retry logic for failed requests

4. **Accessibility**
   - Keyboard navigation works
   - Screen reader support could be enhanced
   - Visual indicators could be improved

## Troubleshooting

### Speech Recognition Not Working
- **Issue:** Microphone button doesn't activate
- **Solution:** 
  - Check browser compatibility (Chrome/Edge)
  - Grant microphone permissions
  - Check browser console for errors

### API Errors
- **Issue:** "Failed to process voice query"
- **Solution:**
  - Check server logs
  - Verify database connection
  - Ensure book exists in database

### No Audio Output
- **Issue:** Text-to-speech not working
- **Solution:**
  - Check browser console for errors
  - Verify browser supports Speech Synthesis API
  - Check system volume settings

### Book Not Found
- **Issue:** "I couldn't find that book"
- **Solution:**
  - Scan the book first using `/scan-test`
  - Verify ISBN is correct
  - Check database for book record

## Next Steps

1. **Run automated tests** once server is running
2. **Manual browser testing** with real books
3. **Gather user feedback** on response quality
4. **Iterate on conversation flow** based on testing
5. **Add more query types** as needed
6. **Enhance error handling** based on edge cases found
















