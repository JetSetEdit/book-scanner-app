# Change: Fix feedback submission bugs and verify with browser testing

## Why

User reported that feedback submissions after scanning books were not working. Investigation revealed:

1. **URL parsing bug** - The feedback API could crash on invalid URLs when extracting pathname, causing silent submission failures (already fixed in code but not tested)
2. **ISBN not saved** - Feedback entries show "N/A" for ISBN even when the URL contains a valid ISBN (4 existing feedback entries affected)
3. **No browser verification** - The feedback submission flow has not been tested end-to-end in a browser to ensure it works correctly

These bugs prevent users from successfully reporting issues with books, making it harder to improve the content warning system.

## What Changes

- **Verify URL parsing fix** - Confirm the try-catch around `new URL(pageUrl).pathname` prevents crashes and handles invalid URLs gracefully
- **Fix ISBN extraction** - Ensure ISBNs are always saved from URLs even when the book doesn't exist in the database yet
- **Browser testing** - Test the complete feedback submission flow:
  - Submit feedback from a book page after scanning
  - Submit feedback with invalid/malformed URLs
  - Submit feedback for books that don't exist yet
  - Verify ISBN is correctly saved in all cases
  - Verify success/error messages display correctly
- **Update existing feedback** - Backfill ISBNs for the 4 feedback entries that have missing ISBNs but valid ISBNs in their URLs

## Impact

- Affected specs: None (bug fixes, no spec changes)
- Affected code:
  - `app/api/feedback/route.ts` - Verify URL parsing fix, ensure ISBN saving logic works
  - `components/feedback-dialog.tsx` - Verify error handling and user feedback
  - Database: Update 4 existing feedback entries with missing ISBNs
  - Testing: Browser-based verification of feedback submission flow
