# Project Cleanup Analysis

**Date:** 2026-01-01  
**Purpose:** Identify unnecessary files that can be removed or archived

## ✅ NECESSARY (Keep These)

### Core Application
- `app/` - Next.js app directory (all routes and pages)
- `components/` - React components
- `lib/` - Core libraries and utilities
- `hooks/` - React hooks
- `types/` - TypeScript type definitions
- `public/` - Static assets
- `styles/` - Global styles

### Configuration
- `package.json`, `package-lock.json`
- `tsconfig.json`, `next.config.mjs`, `postcss.config.mjs`
- `components.json`, `env.example`
- `middleware.ts`
- `supabase/config.toml`
- `supabase/migrations/` - Active database migrations

### Essential Scripts
- `scripts/backup-database.js` - Database backup utility
- `scripts/clear-database.js` - Database clearing utility
- `scripts/clear-data-keep-schema.js` - Schema preservation utility
- `scripts/restore-removed-columns.sql` - Restore utility
- `scripts/admin/` - Admin utilities
- `scripts/utils/` - Utility scripts (may need review)

### Active Documentation
- `README.md` - Main project readme
- `TAXONOMY_REFERENCE.md` - Active taxonomy reference
- `TAXONOMY_DESIGN_PRINCIPLES.md` - Design documentation
- `TAXONOMY_MANIFEST.md` - Taxonomy manifest
- `CLEANUP_SUMMARY.md` - Recent cleanup summary

## ⚠️ POTENTIALLY UNNECESSARY (Review/Archive)

### Old Backups (Can Archive)
- `backups/agents/` - Backups of removed agent code
- `backups/backup-2025-12-30T10-46-47-503Z/` - Old data backup
- `backups/workspace/` - Old workspace backups
- **Recommendation:** Keep `backups/schema/` (recent), archive or remove older backups

### One-Off Documentation Files (May be outdated)
- `SARAH_BROWSER_TEST_RESULTS.md` - Test results (one-off?)
- `SARAH_FEEDBACK_FIX.md` - One-off fix documentation
- `SARAH_FEEDBACK_IMPLEMENTATION.md` - Implementation notes
- `BOOKTOK_EDGE_CASES.md` - Edge case notes
- `CATEGORICAL_SHIELDING_TEST.md` - Test documentation
- `DARK_ROMANCE_TROPE_FIX.md` - Fix documentation
- `FRONTEND_NO_WARNINGS_CHECK.md` - Check documentation
- `BOOK_ANALYSIS_METHODS_REVIEW.md` - Review notes
- `ALL_BOOKS_ANALYSIS_METHODS.md` - Analysis notes
- `COMPLETE_BOOK_LIST.md` - Book list (outdated?)
- `USER_TEST_SCENARIO.md` - Test scenario
- **Recommendation:** Move to `docs/archive/` if not actively referenced

### Test/Debug Scripts (May be outdated)
- `scripts/hello.js` - Test script (264 lines, seems like environment check)
- `scripts/analyze-book-openai.ts` - Old analysis script?
- `scripts/interactive-scan.ts` - Interactive testing?
- `scripts/test-*.ts` - Various test scripts
- `scripts/tests/` - Test suite (8 files)
- **Recommendation:** Keep if actively used, archive if not

### Archived Documentation (Already archived)
- `docs/archive/` - 60+ archived docs (safe to keep or remove entirely)

### Other Files
- `scripts/generate-all-agents-report.py` - Python script (agents removed?)
- `scripts/test-github-actions-notification.ts` - Test script
- `scripts/wait-and-trigger-workflow.sh` - Workflow script
- `scripts/test-manual-handling-system.md` - Test documentation
- `scripts/test-corrupt-rescan.ts` - Test script
- `scripts/test-not-found-book.ts` - Test script
- `lib/isbn-validation.test.ts` - Unit test (keep if using test framework)

## 🗑️ RECOMMENDED FOR REMOVAL

### Definitely Safe to Remove
1. **Old backups** (except recent schema backup):
   - `backups/agents/` - Removed agent code backups
   - `backups/backup-2025-12-30T10-46-47-503Z/` - Old data backup
   - `backups/workspace/` - Old workspace backups

2. **One-off documentation** (move to archive or remove):
   - All `SARAH_*.md` files
   - `BOOKTOK_EDGE_CASES.md`
   - `CATEGORICAL_SHIELDING_TEST.md`
   - `DARK_ROMANCE_TROPE_FIX.md`
   - `FRONTEND_NO_WARNINGS_CHECK.md`
   - `COMPLETE_BOOK_LIST.md` (if outdated)

3. **Test scripts** (if not actively used):
   - `scripts/hello.js` - Environment test
   - `scripts/test-*.ts` files (if not part of test suite)

## 📋 ACTION PLAN

1. **Archive old backups** to external storage or remove
2. **Move one-off docs** to `docs/archive/` or remove
3. **Review test scripts** - keep active ones, archive others
4. **Keep core app** - all necessary
5. **Keep recent backups** - `backups/schema/20260101_*` and `backups/backup-2026-01-01T09-41-36-672Z/`

## 📊 SIZE ESTIMATE

- **Backups directory:** ~Several MB (can be archived)
- **docs/archive/:** ~Several MB (already archived, safe)
- **One-off markdown files:** ~Few hundred KB
- **Test scripts:** ~Few hundred KB

**Total potentially removable:** ~5-10 MB (mostly backups and archived docs)

