# Test Book

**ISBN:** `9780593356159`  
**Title:** "The Maid"  
**Author:** Nita Prose  
**Published:** January 4, 2022

## Purpose

This book is designated as our primary test case. It can be scanned multiple times for testing purposes without restrictions.

## Usage

- Use this ISBN for testing scan functionality
- Re-scanning is allowed and encouraged for testing
- **Current setup:** `forceRefresh: true` is hardcoded in the scan page, so every scan will:
  - Force refresh metadata from external APIs
  - Delete existing AI-generated warnings
  - Regenerate content warnings with fresh analysis
  - Create a new scan record
- This book should have good metadata available from external APIs

## Testing Workflow

1. Go to `/scan` page
2. Enter ISBN: `9780593356159`
3. Click "Scan ISBN" or press Enter
4. Watch the scan process complete
5. Check results on book page
6. Re-scan as many times as needed for testing

## Notes

- Mystery/Thriller genre
- 304 pages
- Published by Ballantine Books
- Good test case for content warning generation
- Will appear in "Recently Scanned" section on homepage after scanning

