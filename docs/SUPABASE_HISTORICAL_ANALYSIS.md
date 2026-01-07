# Supabase Historical Analysis

**Generated:** January 3, 2026  
**Source:** Direct Supabase database queries

---

## Key Findings from Supabase

### Database Structure
- **No soft-delete mechanism** - Books are permanently deleted (no `deleted_at` column)
- **No orphaned records** - When books are deleted, related warnings and logs are also deleted (CASCADE)
- **Scans table preserves history** - Contains all ISBNs ever scanned, even if books were deleted

### Current Database State
- **Books:** 59 (all created Jan 2, 2026)
- **Content Warnings:** 133 (all created Jan 2, 2026)
- **Audit Logs:** 59 (all created Jan 2-3, 2026)
  - 37 with `warnings_generated`
  - 22 with `no_warnings`

### Historical Data in Scans Table
The `scans` table contains **50+ unique ISBNs** that were ever scanned, including:
- Books that currently exist (59)
- Books that were deleted (unknown count)
- First scan: Jan 1, 2026 09:57:21
- Most scanned book: `9780307588371` (Gone Girl) - 18 scans

### Missing Original Collection
**None of the original 5 books exist:**
- ❌ 9780008710262 - When the Moon Hatched
- ❌ 9781668001234 - Holiday Ever After
- ❌ 9781668001235 - Daydream
- ❌ 9781668001236 - Wildfire
- ❌ 9781668001237 - Icebreaker

**None of the classic books exist:**
- ❌ 9780316769174 - The Catcher in the Rye
- ❌ 9780061120084 - To Kill a Mockingbird
- ❌ 9780141439518 - 1984
- ❌ 9780743273565 - The Great Gatsby

### Database Timeline
- **Before Jan 1, 2026:** Database was cleared/reset
- **Jan 1, 2026:** First scans recorded in `scans` table
- **Jan 2, 2026:** All current books created (oldest: 03:42:17)
- **Jan 2-3, 2026:** All audit logs created

---

## Recommendations

1. **Use Scans Table for Recovery:**
   - The `scans` table has all ISBNs that were ever scanned
   - Can be used to identify deleted books
   - Can be used to re-scan missing books

2. **Implement Soft-Delete:**
   - Add `deleted_at` column to `books` table
   - Preserve historical data for analysis
   - Allow recovery of accidentally deleted books

3. **Archive Deleted Books:**
   - Create an `archived_books` table
   - Move deleted books there instead of permanent deletion
   - Preserve warning counts and metadata

---

**Conclusion:** The database was completely reset before Jan 1, 2026. All historical data before that date is lost, but the `scans` table preserves a record of all ISBNs that were scanned after the reset.


