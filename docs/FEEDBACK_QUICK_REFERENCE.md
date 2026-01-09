# Feedback Data - Quick Reference

## 🚀 Quick Start

### View All Feedback
```bash
npx tsx scripts/view-feedback.ts
```

### View Pending Feedback Only
```bash
npx tsx scripts/view-feedback.ts --status=pending
```

### View Feedback by Type
```bash
npx tsx scripts/view-feedback.ts --type=content_issue
```

### View Feedback for Specific Book
```bash
npx tsx scripts/view-feedback.ts --book-id=YOUR_BOOK_ID
```

## 📊 Using Supabase MCP

### Quick Query
```sql
SELECT 
  id,
  book_title,
  book_author,
  metadata->>'feedback_type' as type,
  metadata->>'message' as message,
  status,
  created_at
FROM manual_handling_scans
WHERE reason = 'user_feedback'
ORDER BY created_at DESC
LIMIT 10;
```

### With Full Context
```sql
SELECT 
  id,
  book_title,
  book_author,
  isbn,
  status,
  metadata->>'feedback_type' as feedback_type,
  metadata->>'message' as message,
  metadata->>'email' as email,
  app_version,
  context_data->>'warnings_count' as warnings_count,
  context_data->>'analysis_status' as analysis_status,
  created_at
FROM manual_handling_scans
WHERE reason = 'user_feedback'
  AND status = 'pending'
ORDER BY created_at DESC;
```

## 🔍 Common Queries

### Count by Type
```sql
SELECT 
  metadata->>'feedback_type' as type,
  COUNT(*) as count
FROM manual_handling_scans
WHERE reason = 'user_feedback'
GROUP BY metadata->>'feedback_type';
```

### Recent Feedback (Last 24h)
```sql
SELECT *
FROM manual_handling_scans
WHERE reason = 'user_feedback'
  AND created_at > NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC;
```

### Feedback with Book Context
```sql
SELECT *
FROM manual_handling_scans
WHERE reason = 'user_feedback'
  AND book_id IS NOT NULL
ORDER BY created_at DESC;
```

## 📝 Update Status

```sql
-- Mark as resolved
UPDATE manual_handling_scans
SET status = 'resolved', resolved_at = NOW()
WHERE id = 'FEEDBACK_ID';

-- Mark as in progress
UPDATE manual_handling_scans
SET status = 'in_progress'
WHERE id = 'FEEDBACK_ID';
```

## 📚 Full Documentation

See `docs/FEEDBACK_DATA_RETRIEVAL.md` for complete guide.
