# Frontend Scan Debugging Guide

## Quick Debug Steps

1. **Open Browser Console** (F12 or Cmd+Option+I)
2. **Try scanning a book** (e.g., ISBN: `9781501110375`)
3. **Look for errors** - Check for red error messages

## Common Error Patterns

### Error: "No result received from scan"
- **Cause**: API completed but didn't return result in expected format
- **Check**: Look for `[Scan] No result received` in console
- **Fix**: Check API logs to see if scan actually completed

### Error: "Failed to scan ISBN"
- **Cause**: API returned error status
- **Check**: Network tab → `/api/scan` → Response
- **Fix**: Check server logs for actual error

### Error: JSON parse error
- **Cause**: Malformed response from API
- **Check**: Look for `Failed to parse stream data` in console
- **Fix**: Check API response format

### Error: Property access error (e.g., "Cannot read property 'book' of null")
- **Cause**: Result structure doesn't match expected format
- **Check**: Look for `[Scan] Result received` log in console
- **Fix**: Check if `result.book` exists

## Debug Logs Added

The following logs will appear in console:

- `[Scan] Received result:` - When result is parsed from stream
- `[Scan] Result received:` - Full result structure
- `[Scan] Transformed result:` - After transformation
- `[Scan] Error in stream:` - If error received in stream
- `[Scan] Error caught in performScan:` - If exception thrown

## What to Share

If the issue persists, share:
1. **Browser console errors** (copy/paste)
2. **Network tab** → `/api/scan` → Response (if available)
3. **Server logs** (if running locally)
4. **ISBN you tried to scan**

