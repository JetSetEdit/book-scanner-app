# Feedback Data Retrieval Guide

This guide explains how to retrieve and view user feedback data from the Subtext database.

## Database Structure

Feedback is stored in the `manual_handling_scans` table with `reason = 'user_feedback'`.

### Key Columns

- **`id`** (UUID) - Unique feedback ID
- **`isbn`** (TEXT) - Book ISBN (or 'N/A' for general feedback)
- **`book_id`** (UUID) - Foreign key to books table
- **`book_title`** (TEXT) - Book title (denormalized)
- **`book_author`** (TEXT) - Book author (denormalized)
- **`status`** (TEXT) - Status: 'pending', 'in_progress', 'resolved', 'dismissed'
- **`user_agent`** (TEXT) - Browser user agent string
- **`app_version`** (TEXT) - App version when feedback was submitted
- **`context_data`** (JSONB) - Additional context:
  - `warnings_count` - Number of warnings on the book
  - `analysis_status` - Analysis status ('complete', 'unknown')
  - `metadata_issues` - Object with `missingCover`, `missingDescription`
  - `pathname` - Page path where feedback was submitted
- **`metadata`** (JSONB) - Core feedback data:
  - `feedback_type` - Type of feedback
  - `message` - User's message
  - `email` - User's email (optional)
  - `page_url` - Full page URL
  - `ip_address` - User's IP address
  - `submission_count` - Number of times this feedback was updated

## Methods to Retrieve Feedback

### 1. Using Supabase MCP (Recommended for Quick Queries)

```sql
-- Get all pending feedback
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
  context_data,
  created_at
FROM manual_handling_scans
WHERE reason = 'user_feedback'
  AND status = 'pending'
ORDER BY created_at DESC;

-- Get feedback for a specific book
SELECT *
FROM manual_handling_scans
WHERE reason = 'user_feedback'
  AND book_id = 'YOUR_BOOK_ID'
ORDER BY created_at DESC;

-- Get feedback by type
SELECT *
FROM manual_handling_scans
WHERE reason = 'user_feedback'
  AND metadata->>'feedback_type' = 'content_issue'
ORDER BY created_at DESC;

-- Get feedback with book context
SELECT 
  mhs.*,
  b.title as actual_book_title,
  b.author as actual_book_author
FROM manual_handling_scans mhs
LEFT JOIN books b ON mhs.book_id = b.id
WHERE mhs.reason = 'user_feedback'
ORDER BY mhs.created_at DESC;
```

### 2. Using the View Feedback Script

```bash
# View all feedback (last 50)
tsx scripts/view-feedback.ts

# View only pending feedback
tsx scripts/view-feedback.ts --status=pending

# View specific feedback type
tsx scripts/view-feedback.ts --type=content_issue

# View feedback for a specific book
tsx scripts/view-feedback.ts --book-id=YOUR_BOOK_ID

# Limit results
tsx scripts/view-feedback.ts --limit=10
```

### 3. Using the Check Queue Script

```bash
# View all feedback, analysis requests, and rate limit feedback
tsx scripts/check-queue.ts
```

This script shows:
- Analysis requests
- User feedback (with context)
- Rate limit feedback
- Summary statistics

### 4. Using Supabase Dashboard

1. Go to your Supabase project dashboard
2. Navigate to **Table Editor** → **manual_handling_scans**
3. Filter by `reason = 'user_feedback'`
4. View and edit feedback entries

### 5. Programmatic Access (TypeScript/JavaScript)

```typescript
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Get all feedback
const { data, error } = await supabase
  .from('manual_handling_scans')
  .select('*')
  .eq('reason', 'user_feedback')
  .order('created_at', { ascending: false })

// Get feedback with book details
const { data, error } = await supabase
  .from('manual_handling_scans')
  .select(`
    *,
    books:book_id (
      id,
      title,
      author,
      isbn
    )
  `)
  .eq('reason', 'user_feedback')
  .order('created_at', { ascending: false })
```

## Useful Queries

### Count Feedback by Type

```sql
SELECT 
  metadata->>'feedback_type' as feedback_type,
  COUNT(*) as count
FROM manual_handling_scans
WHERE reason = 'user_feedback'
GROUP BY metadata->>'feedback_type'
ORDER BY count DESC;
```

### Count Feedback by Status

```sql
SELECT 
  status,
  COUNT(*) as count
FROM manual_handling_scans
WHERE reason = 'user_feedback'
GROUP BY status
ORDER BY count DESC;
```

### Get Feedback with Most Context

```sql
SELECT 
  id,
  book_title,
  book_author,
  metadata->>'feedback_type' as feedback_type,
  metadata->>'message' as message,
  context_data->>'warnings_count' as warnings_count,
  context_data->>'analysis_status' as analysis_status,
  app_version,
  created_at
FROM manual_handling_scans
WHERE reason = 'user_feedback'
  AND book_id IS NOT NULL
ORDER BY created_at DESC;
```

### Get Recent Feedback (Last 24 Hours)

```sql
SELECT *
FROM manual_handling_scans
WHERE reason = 'user_feedback'
  AND created_at > NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC;
```

### Get Feedback for Books with Issues

```sql
SELECT 
  mhs.*,
  b.title,
  b.author
FROM manual_handling_scans mhs
JOIN books b ON mhs.book_id = b.id
WHERE mhs.reason = 'user_feedback'
  AND (
    mhs.metadata->>'feedback_type' IN ('content_issue', 'metadata_issue', 'warning_accuracy')
    OR mhs.context_data->>'metadata_issues' IS NOT NULL
  )
ORDER BY mhs.created_at DESC;
```

## Updating Feedback Status

```sql
-- Mark feedback as resolved
UPDATE manual_handling_scans
SET 
  status = 'resolved',
  resolved_by = 'admin',
  resolved_at = NOW(),
  resolution_notes = 'Fixed the issue'
WHERE id = 'FEEDBACK_ID';

-- Mark feedback as in progress
UPDATE manual_handling_scans
SET status = 'in_progress'
WHERE id = 'FEEDBACK_ID';

-- Dismiss feedback
UPDATE manual_handling_scans
SET status = 'dismissed'
WHERE id = 'FEEDBACK_ID';
```

## Exporting Feedback

### Export to CSV (using psql)

```bash
psql $DATABASE_URL -c "
COPY (
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
    created_at
  FROM manual_handling_scans
  WHERE reason = 'user_feedback'
  ORDER BY created_at DESC
) TO STDOUT WITH CSV HEADER
" > feedback_export.csv
```

## Best Practices

1. **Regular Monitoring**: Run `tsx scripts/view-feedback.ts` daily to check for new feedback
2. **Status Updates**: Update feedback status as you work on issues
3. **Context Review**: Check `context_data` and `book_title`/`book_author` for full context
4. **Email Follow-up**: Use the `email` field in metadata to follow up with users if needed
5. **Pattern Analysis**: Use aggregation queries to identify common issues

## Next Steps

- Consider creating an admin dashboard to view and manage feedback
- Set up email notifications for new feedback
- Create automated reports for weekly feedback summaries
