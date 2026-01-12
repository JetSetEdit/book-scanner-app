# Book Scan Steps & User-Facing Messages

This document lists all the steps during a book scan and the user-facing messages shown to users.

## Overview

The scan process is divided into **4 main stages** (as shown in the UI progress indicator):

1. **Stage 1: Finding book information...** (Search & Metadata)
2. **Stage 2: Analyzing content for warnings...** (AI Analysis)
3. **Stage 3: Verifying safety triggers...** (Verification - rarely shown)
4. **Stage 4: Saving results...** (Completion)

---

## Stage 1: Finding Book Information

### Initial Steps

1. **"Validating ISBN and checking local database..."**
   - Validates and normalizes the ISBN
   - Checks if book exists in local database

2. **"Checking local database for existing book"**
   - Database lookup in progress

3. **"Book found in local database."** (if cached)
   - Book exists in database
   - May skip to Stage 4 if already analyzed

4. **"✅ Book already exists - redirecting to book page"** (if fully analyzed)
   - Early return - book already has warnings

5. **"📖 Book found but not yet analyzed - running analysis..."** (if exists but no warnings)
   - Book exists but needs analysis

### External API Fetching (if book not found locally)

6. **"Fetching book metadata from external libraries (Google Books, Open Library)"**
   - Starting external API calls

7. **"Found X candidate(s) from external libraries"**
   - Multiple matches found

8. **"Found X possible matches. Selecting best candidate based on description and cover quality..."**
   - Auto-selecting best match

9. **"✅ Selected best candidate: '[Title]' ([Source])"**
   - Best candidate selected automatically

10. **"Found X possible matches. Please select the correct book."** (if auto-selection fails)
    - User needs to select manually (shows candidate selection UI)

11. **"Found metadata for '[Title]'. Saving to database..."**
    - Book metadata found, saving to database

### Cover Image Handling

12. **"🖼️ No cover found - trying alternative sources..."**
    - Primary source has no cover, trying alternatives

13. **"✅ Found cover from Open Library"**
    - Cover found from Open Library API

14. **"✅ Found cover from Google Books"**
    - Cover found from Google Books API

15. **"⚠️ No valid cover found from any source"**
    - No cover available from any source

### Description Fetching

16. **"📖 Step 6: Fetching book description for analysis..."**
    - Starting description fetch

17. **"📚 Book for analysis: '[Title]' by [Author]"**
    - Book identified for analysis

18. **"📝 Current description length: X characters"**
    - Current description status

19. **"🔄 Force refresh: fetching fresh description from external APIs..."** (if force refresh)
    - Force refreshing description

20. **"📥 Description missing or too short, fetching from external APIs..."**
    - Description needs to be fetched

21. **"🌐 Calling fetchBookByISBN..."**
    - Calling external API

22. **"✅ Fetched data from [Source]"**
    - Data fetched successfully

23. **"💾 Saving description (X chars) to database..."**
    - Saving description to database

24. **"✅ Fetched and saved fresh description from external APIs"**
    - Description saved successfully

25. **"✅ Updated description from external APIs (shorter but valid)"**
    - Description updated (shorter than ideal but valid)

26. **"❌ Error: Failed to save description: [error]"**
    - Error saving description

27. **"❌ Could not fetch book data from external APIs"**
    - API fetch failed

28. **"⚠️ Book found but no description available in external APIs"**
    - No description available

29. **"💡 This book may need manual description entry"**
    - Suggestion for manual entry

30. **"⚠️ Description too short (X chars < 50), skipping save"**
    - Description too short to save

31. **"⚠️ Could not fetch fresh description, using existing or minimal description"**
    - Using existing description

32. **"❌ Error fetching description: [error]"**
    - Error during fetch

### Description Quality Check

33. **"🔍 Checking if description is sufficient for analysis..."**
    - Evaluating description quality

34. **"📄 Description for analysis: X characters"**
    - Description length for analysis

35. **"⚠️ Description is minimal - performing web search to gather context..."**
    - Description too short, enriching with web search

36. **"🌐 Searching for book information from open sources: '[query]'"**
    - Web search in progress

37. **"✅ Web search found additional context"**
    - Web search successful

38. **"📄 Enhanced description: X characters"**
    - Description enhanced with web context

39. **"⚠️ Web search did not find additional context, proceeding with minimal description"**
    - Web search found nothing

40. **"⚠️ Web search failed, proceeding with minimal description"**
    - Web search error

41. **"⚡ Quick scan: metadata is thin — relying on community enrichment during analysis..."**
    - Quick scan mode with thin metadata

---

## Stage 2: Analyzing Content for Warnings

### Analysis Start

42. **"✓ Found: '[Title]' by [Author]"**
    - Book confirmed for analysis

43. **"⏳ Reading description and gathering information..."**
    - Preparing for analysis

44. **"⏳ Analyzing content for warnings (typically takes 15-20 seconds)"**
    - AI analysis in progress (main analysis step)

### Analysis Progress (from multi-model-analysis)

45. **"AI is reading the book..."**
    - Analysis started

46. **"Starting AI analysis..."**
    - Analysis initialization

47. **"Analyzing content for warnings..."**
    - Active analysis

### Analysis Results

48. **"✓ Found X warning(s) - finalizing results..."**
    - Warnings found

49. **"⏳ Saving results..."**
    - Saving warnings to database

50. **"Deleting existing AI-generated warnings for fresh scan..."** (if force refresh)
    - Cleaning up old warnings

51. **"✅ Deleted existing AI-generated warnings"**
    - Old warnings deleted

52. **"⚠️ Warning: Failed to delete existing warnings: [error]"**
    - Error deleting old warnings

53. **"✅ Saved X content warnings"**
    - Warnings saved successfully

54. **"⚠️ Warning: Failed to save content warnings: [error]"**
    - Error saving warnings

55. **"ℹ️ No content warnings identified by AI analysis"**
    - No warnings found (triggers verification)

---

## Stage 3: Verification (When 0 Warnings Found)

### Web Search Verification

56. **"🔍 Performing web search verification (0 warnings found)..."**
    - Starting verification

57. **"🌐 Searching for content warnings: '[query]'"**
    - Web search for warnings

58. **"⚠️ Web search response contained retailer content - rejected for TOS compliance"**
    - Retailer content detected and rejected

59. **"⚠️ Web search found potential warnings - re-analyzing with web context..."**
    - Potential warnings found, re-analyzing

60. **"✅ Re-analysis with web context found X warning(s)"**
    - Re-analysis found warnings

61. **"✅ Saved X warnings from web search verification"**
    - Warnings saved from verification

62. **"✅ Web search verification confirmed: no warnings found"**
    - Verification confirmed no warnings

63. **"✅ Web search confirmed: no warnings mentioned online"**
    - No warnings found online

64. **"⚠️ Web search unavailable, skipping verification"**
    - Web search failed

65. **"⚠️ Web search verification failed, continuing without verification"**
    - Verification error

---

## Stage 4: Saving Results

### Completion Messages

66. **"✅ Scan completed successfully."**
    - Scan finished successfully

67. **"⚠️ Scan completed but analysis failed: [error]"**
    - Scan finished but analysis failed

68. **"⚠️ Scan completed but analysis did not run."**
    - Scan finished but no analysis

---

## Error Messages

### Book Not Found

69. **"❌ Book not found in any external library (Open Library, Google Books)"**
    - Book doesn't exist in external APIs

70. **"Book with ISBN [isbn] not found in any external library. Please check the ISBN and try again."**
    - Final error message for not found

### Analysis Errors

71. **"❌ Error: No book data available for analysis"**
    - Missing book data

72. **"⚠️ Rate limit exceeded - analysis could not complete. Book will be marked as 'Unknown' until analysis can be retried."**
    - Rate limit hit

73. **"❌ AI analysis error: [error]"**
    - Analysis error

74. **"❌ Content analysis failed: [error]"**
    - Analysis failure

75. **"⚠️ Skipping analysis: Book title missing"**
    - Missing title

---

## Message Formatting

All messages are processed through `formatStatusMessage()` in `app/scan/page.tsx` which:
- Removes emojis
- Converts technical messages to user-friendly ones
- Capitalizes first letter

Examples of transformations:
- "Validating ISBN and checking local database..." → "Searching our library..."
- "Checking local database for existing book" → "Looking for this book..."
- "Found metadata for '[Title]'" → "Found book: [Title]"
- "AI is reading the book..." → "AI is reading the book..." (unchanged)

---

## Stage Mapping

Messages are mapped to stages via `lib/utils/scan-progress-mapper.ts`:

- **Stage 1**: Messages about validation, database lookup, metadata fetching, saving
- **Stage 2**: Messages about analysis, AI reading, web search, description checking
- **Stage 3**: Messages about verification, double-checking (rarely shown)
- **Stage 4**: Messages about saving, completion, finalizing

The UI shows a progress bar that fills based on the current stage (1/4, 2/4, 3/4, 4/4).

---

## Special Cases

### Ambiguous Results
When multiple candidates are found and auto-selection fails, the scan returns early with status `'ambiguous'` and shows a candidate selection UI instead of progress messages.

### Existing Book (Quick Scan)
If a book exists and has been analyzed, the scan returns early with status `'complete'` and shows "✅ Book already exists - redirecting to book page".

### Deep Scan Mode
Deep scans always run analysis even if the book exists, so they may show more messages than quick scans.

---

## Notes

- Most messages are shown in real-time via Server-Sent Events (SSE)
- Messages are filtered and formatted for user-friendliness
- Technical details are hidden from users
- Error messages are simplified to avoid exposing internal details
- Progress is shown with a visual progress bar (1-4 stages)
