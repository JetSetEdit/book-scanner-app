# Browser Testing Guide: Feedback Submission

This guide provides step-by-step instructions for testing the feedback submission functionality in a browser.

## Prerequisites

- Local development server running (`npm run dev`)
- Or access to production/staging environment
- Browser with developer tools (Chrome, Firefox, Safari, Edge)

## Test Cases

### Test 1: Submit Feedback from Book Page (Existing Book)

1. Navigate to a book page that exists in the database:
   - Example: `http://localhost:3000/book/9780061990762` (The Vampire Diaries)
   - Or production: `https://www.subtextscanner.com.au/book/9780061990762`

2. Scroll to the bottom of the page and click "Found an error? Report this book."

3. Fill out the feedback form:
   - Select a feedback type (e.g., "Content Issue")
   - Enter a test message
   - Optionally add your email
   - Click "Submit Feedback"

4. **Expected Results:**
   - ✅ Success toast appears: "Thank you! Your feedback has been submitted..."
   - ✅ Dialog closes
   - ✅ No errors in browser console
   - ✅ Network request to `/api/feedback` returns 200 OK
   - ✅ Feedback appears in database with correct ISBN, book title, and author

5. **Verify in Database:**
   ```bash
   npx tsx scripts/view-feedback.ts --limit=1
   ```
   - Check that the most recent feedback has:
     - Correct ISBN
     - Book title and author populated
     - All context data saved

### Test 2: Submit Feedback from Book Stub Page (Non-Existent Book)

1. Navigate to a book page that doesn't exist in the database:
   - Example: `http://localhost:3000/book/9781234567890` (fake ISBN)
   - This should show the stub page with external metadata

2. Click "Found an error? Report this book."

3. Fill out and submit the feedback form

4. **Expected Results:**
   - ✅ Success toast appears
   - ✅ No errors in browser console
   - ✅ ISBN is extracted from URL and saved (even though book doesn't exist)
   - ✅ Feedback saved with ISBN but no book_id

5. **Verify in Database:**
   ```bash
   npx tsx scripts/view-feedback.ts --limit=1
   ```
   - Check that ISBN is saved (not "N/A")
   - Book title/author may be from external metadata or null

### Test 3: Submit Feedback with Invalid URL

1. Open browser console (F12)
2. Manually trigger feedback submission with invalid URL:
   ```javascript
   fetch('/api/feedback', {
     method: 'POST',
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify({
       feedbackType: 'general_feedback',
       message: 'Test with invalid URL',
       pageUrl: 'invalid-url-format'
     })
   }).then(r => r.json()).then(console.log)
   ```

3. **Expected Results:**
   - ✅ Request succeeds (200 OK)
   - ✅ Feedback is saved
   - ✅ Pathname extraction falls back gracefully
   - ✅ No server errors in logs

### Test 4: Submit Feedback from Collection Page

1. Navigate to collection page: `http://localhost:3000/collection`
2. Open feedback dialog (if available) or use footer feedback link
3. Submit feedback

4. **Expected Results:**
   - ✅ Success toast appears
   - ✅ Feedback saved (ISBN may be "N/A" if no book context)
   - ✅ No errors

### Test 5: Error Handling

1. Test with missing required fields:
   - Try submitting without feedback type
   - Try submitting without message

2. **Expected Results:**
   - ✅ Validation error toast appears
   - ✅ Form doesn't submit
   - ✅ No network request sent

## Verification Checklist

After completing all tests, verify:

- [ ] All feedback submissions show success toasts
- [ ] No JavaScript errors in browser console
- [ ] All network requests return 200 OK
- [ ] ISBNs are correctly saved for book page submissions
- [ ] Invalid URLs don't cause crashes
- [ ] Feedback appears in database with correct metadata
- [ ] `view-feedback.ts` script shows all test submissions correctly

## Troubleshooting

### Feedback Not Submitting

1. Check browser console for JavaScript errors
2. Check Network tab for failed requests
3. Check server logs for API errors
4. Verify environment variables are set correctly

### ISBN Not Saved

1. Verify the URL contains `/book/[isbn]` pattern
2. Check that ISBN extraction regex matches the URL format
3. Verify the feedback API received the correct `pageUrl`

### URL Parsing Errors

1. Check that try-catch is working in the API
2. Verify fallback pathname extraction works
3. Test with various URL formats (absolute, relative, malformed)
