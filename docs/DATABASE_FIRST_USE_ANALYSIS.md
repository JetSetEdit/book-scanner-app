# Database First Use Analysis

**Generated:** January 3, 2026

---

## Database Creation Timeline

### Schema Creation (Migrations)
- **April 22, 2025** (or May 22, 2025): First migration `20240522000000_create_audit_logs.sql`
  - Created `ai_audit_logs` table
  - This is the earliest migration file, suggesting database schema was initialized around this time

- **December 4, 2025**: `20251204_create_scans_table.sql`
  - Created `scans` table for tracking ISBN scans

### First Data Usage

**January 1, 2026 09:57:21 UTC** - **FIRST DATABASE USAGE**
- First record in `scans` table
- ISBN: `9780593356159` (The Maid)
- This is the earliest data record in the entire database

**January 2, 2026 03:42:17 UTC** - First book created
- First record in `books` table
- All 59 current books were created on Jan 2, 2026

**January 2, 2026 09:06:32 UTC** - First content warning created
- First record in `content_warnings` table
- All 133 current warnings were created on Jan 2, 2026

**January 2, 2026 12:58:52 UTC** - First audit log created
- First record in `ai_audit_logs` table
- All 59 current audit logs were created on Jan 2-3, 2026

---

## Key Findings

1. **Database Schema Created:** April/May 2025 (migration `20240522000000`)
2. **First Data Entry:** January 1, 2026 09:57:21 UTC (scans table)
3. **Database Reset:** Between schema creation and Jan 1, 2026
   - Schema existed for ~7-8 months before first data
   - All current data is from Jan 1-2, 2026
   - No historical data before Jan 1, 2026 exists

4. **Gap Period:** May 2025 - December 2025
   - Database schema was created
   - But no data was stored (or was cleared)
   - Suggests development/testing period or database reset

---

## Conclusion

**The database was first used on January 1, 2026 at 09:57:21 UTC** when the first ISBN scan was recorded.

The database schema was created much earlier (April/May 2025), but the first actual data usage was January 1, 2026.


