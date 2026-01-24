# Design: Fix feedback submission bugs

## Context

The feedback submission system allows users to report issues with books, content warnings, metadata, etc. The API endpoint `/api/feedback` processes submissions and stores them in the `manual_handling_scans` table.

Recent investigation found:
- URL parsing could crash on invalid URLs (fixed in code but not tested)
- ISBNs not being saved for 4 existing feedback entries despite valid ISBNs in URLs
- No browser-based end-to-end testing of the submission flow

## Goals

1. Ensure feedback submissions work reliably for all URL formats
2. Always save ISBN when available, even if book doesn't exist in database
3. Verify the complete submission flow works in a browser
4. Backfill missing ISBNs for existing feedback entries

## Non-Goals

- Changing the feedback API structure or response format
- Adding new feedback types or capabilities
- Modifying the feedback UI/UX (only testing existing functionality)

## Decisions

### Decision: Keep ISBN extraction from URL even when book doesn't exist

**What**: Extract ISBN from `pageUrl` and save it to the feedback entry, even if the book lookup fails.

**Why**: 
- Users may report issues about books that haven't been scanned yet
- ISBN is valuable metadata for understanding feedback context
- The code already has this logic, but we need to verify it works

**Alternatives considered**:
- Only save ISBN if book exists: Rejected - loses valuable context
- **Chosen**: Save ISBN whenever it can be extracted from URL or context

### Decision: Graceful URL parsing with fallback

**What**: Wrap `new URL(pageUrl).pathname` in try-catch and fall back to simple string splitting if URL parsing fails.

**Why**:
- Invalid or relative URLs could crash the API
- Pathname is still useful even if full URL parsing fails
- Already implemented, but needs verification

**Alternatives considered**:
- Reject invalid URLs: Rejected - too strict, loses valid feedback
- **Chosen**: Try URL parsing, fall back to string splitting

### Decision: Browser testing before backfilling

**What**: Test the complete submission flow in a browser first, then backfill missing ISBNs.

**Why**:
- Ensures the fix works before updating historical data
- Verifies the user experience is correct
- Confirms error handling works as expected

**Alternatives considered**:
- Backfill first: Rejected - should verify fix works first
- **Chosen**: Test → Fix → Backfill

## Risks / Trade-offs

- **Risk**: Browser testing might reveal additional issues
  - **Mitigation**: Fix issues as they're discovered, document any new bugs

- **Risk**: Backfilling might update incorrect data
  - **Mitigation**: Verify ISBN extraction logic is correct before running backfill script

- **Trade-off**: Testing takes time but ensures reliability
  - **Acceptable**: Better to test thoroughly than ship broken fixes

## Open Questions

- None - this is a straightforward bug fix and verification task
