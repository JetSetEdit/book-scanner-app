# Google Books API TOS Compliance - Hybrid Cache Strategy

## Summary

This document outlines the **Hybrid Cache Strategy** implemented to comply with Google APIs Terms of Service Section 5.e.1, which prohibits permanent storage of Google Books API content.

**Solution:** Treat the database as a **temporary cache** that expires every 30 days, with automatic background refresh of stale data. This satisfies the legal requirement (not creating a permanent archive) while maintaining app performance.

## The Hybrid Strategy

### Key Principle
> "Keep your database, but treat it as a temporary cache that expires every 30 days, and add proper credit."

This approach:
1. ✅ **Stores data** in the database (performance)
2. ✅ **Tracks staleness** with `last_synced_at` timestamp
3. ✅ **Auto-refreshes** stale data (>30 days) in background
4. ✅ **Proves compliance** - data is refreshed, not permanent
5. ✅ **Displays attribution** - Google Books credit on frontend

## Implementation

### 1. Database Schema

**Migration:** `supabase/migrations/20251212_add_last_synced_at.sql`

Added `last_synced_at` column to `books` table:
- Tracks when metadata was last synced from external APIs
- Used to determine cache staleness
- Indexed for efficient staleness queries

### 2. Cache Logic (`lib/book-cache.ts`)

**Staleness Check:**
```typescript
function isStale(lastSyncedAt: string | null): boolean {
  if (!lastSyncedAt) return true;
  const threshold = Date.now() - (30 * 24 * 60 * 60 * 1000); // 30 days
  return new Date(lastSyncedAt).getTime() < threshold;
}
```

**Background Refresh:**
- When stale data is detected, refresh happens in background (fire-and-forget)
- Doesn't block user requests
- Updates `last_synced_at` to reset the timer

### 3. Service Updates

#### `lib/book-service.ts`
- Checks DB cache first
- If stale (>30 days), triggers background refresh
- Stores `last_synced_at` on insert/update

#### `lib/services/scan-service.ts`
- Same staleness checking logic
- All book inserts/updates include `last_synced_at`
- Background refresh for stale records

### 4. Frontend Attribution

**Component:** `components/google-books-attribution.tsx`

Displays proper Google Books attribution on book detail pages:
- Link to Google Books
- Note about 30-day cache expiration
- Satisfies TOS attribution requirement

**Usage:**
```tsx
<GoogleBooksAttribution isbn={book.isbn} />
```

## How It Works

### Flow Diagram

```
User Request → Check DB Cache
                ↓
         Found in DB?
         ├─ Yes → Check if stale (>30 days)
         │        ├─ Stale → Return cached data + Refresh in background
         │        └─ Fresh → Return cached data
         │
         └─ No → Fetch from APIs → Store with last_synced_at → Return
```

### Compliance Proof

1. **Not Permanent:** Data older than 30 days is considered stale and refreshed
2. **Automatic Refresh:** Stale data triggers background update from Google Books API
3. **Timestamp Tracking:** `last_synced_at` proves when data was last updated
4. **Attribution:** Frontend displays Google Books credit

## Migration Steps

1. **Run migration:**
   ```bash
   # Apply the last_synced_at column migration
   npx supabase migration up
   ```

2. **Deploy code changes:**
   - `lib/book-cache.ts` (new)
   - `lib/book-service.ts` (updated)
   - `lib/services/scan-service.ts` (updated)
   - `components/google-books-attribution.tsx` (new)
   - `components/book-details.tsx` (updated)

3. **Backfill existing records (optional):**
   ```sql
   -- Set last_synced_at for existing books (use created_at as fallback)
   UPDATE books 
   SET last_synced_at = COALESCE(updated_at, created_at)
   WHERE last_synced_at IS NULL;
   ```

4. **Verify:**
   - Check that new books get `last_synced_at` set
   - Verify stale books trigger background refresh
   - Confirm attribution appears on book pages

## Testing Checklist

- [ ] New book scan sets `last_synced_at` timestamp
- [ ] Stale book (>30 days) triggers background refresh
- [ ] Background refresh updates `last_synced_at`
- [ ] Google attribution component displays on book pages
- [ ] Attribution link works correctly
- [ ] No performance degradation (background refresh doesn't block)

## Configuration

**Cache Duration:** 30 days (configurable in `lib/book-cache.ts`)

```typescript
const CACHE_DURATION_DAYS = 30; // Adjust as needed
```

**Note:** 30 days is a reasonable balance between:
- TOS compliance (proves data is refreshed)
- Performance (minimizes API calls)
- User experience (fast responses)

## Benefits

1. **Performance:** Database cache provides fast responses
2. **Compliance:** Staleness checking proves it's a cache, not permanent archive
3. **Automatic:** Background refresh happens transparently
4. **User Experience:** No visible impact - data is always fresh or refreshing
5. **Legal Safety:** Meets TOS requirements while maintaining functionality

## Comparison: Before vs After

### Before (Violation)
- ❌ Stored Google Books data permanently
- ❌ No expiration or refresh mechanism
- ❌ Violated TOS Section 5.e.1

### After (Compliant)
- ✅ Stores data as temporary cache (30-day expiration)
- ✅ Auto-refreshes stale data in background
- ✅ Tracks sync timestamps for compliance proof
- ✅ Displays proper attribution
- ✅ Maintains performance benefits

## References

- Google APIs Terms of Service: https://developers.google.com/terms/api-services-user-policy
- Section 5.e.1: Prohibits permanent storage of API content
- Hybrid Cache Strategy: Temporary cache with expiration satisfies requirements













