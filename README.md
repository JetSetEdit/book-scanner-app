# Book Scanner App

A comprehensive book scanning application that helps users discover content warnings and book information by scanning ISBNs or barcodes.

## Features

- **ISBN/Barcode Scanning**: Scan any book to get instant information
- **Content Warnings**: Author-approved content warnings with severity levels
- **Book Database**: Comprehensive database of books with metadata
- **Admin Dashboard**: Review and manage scanned books
- **Automated Workflow**: Daily metadata fetching for new books

## Architecture

### API Strategy

The app uses a **TOS-friendly API hierarchy** for book metadata fetching:

1. **Primary Source: Open Library API** 
   - Free, open-source, no API keys required
   - Reliable and cacheable results
   - URL: `https://openlibrary.org/api/books?bibkeys=ISBN:{isbn}&format=json&jscmd=data`

2. **Fallback Source: Google Books API**
   - High-quality metadata and covers
   - Requires API key (optional)
   - URL: `https://www.googleapis.com/books/v1/volumes?q=isbn:{isbn}`

This ensures reliable book data fetching while maintaining compliance with terms of service.

### Database Schema

#### Books Table
- Core book information (title, author, ISBN, etc.)
- Review workflow fields (review_status, in_db, scan_source)
- Metadata storage (JSONB field for external API responses)
- Author warning tracking (has_author_warnings, author_warning_url)

#### Scans Table
- Tracks all ISBN scanning activity
- Links to books table via book_id
- Records scan timestamps and user activity

### API Endpoints

#### Core Scanning
- `POST /api/scan-isbn` - Record new ISBN scans and create book records
- `GET /api/fetch-metadata` - Fetch metadata for pending books (automated)

#### Admin Management
- `GET /api/admin/pending-books` - List all books for review
- `POST /api/admin/complete-review` - Mark book reviews as complete
- `GET /api/admin/scan-statistics` - Get scanning statistics and analytics

#### Database Management
- `POST /api/apply-workflow-migrations` - Apply database schema updates

### Review Workflow

1. **Scan**: User scans ISBN → Creates pending book record
2. **Metadata Fetch**: Daily job fetches book metadata from external APIs
3. **Review**: Admin reviews book information and content warnings
4. **Complete**: Book marked as complete and available to users

## Development Setup

### Prerequisites
- Node.js 18+
- Supabase account and project
- Vercel account (for deployment)

### Environment Variables

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

### Installation

1. Clone the repository
2. Install dependencies: `npm install`
3. Set up environment variables
4. Run database migrations: `POST /api/apply-workflow-migrations`
5. Start development server: `npm run dev`

### Database Setup

The application uses several SQL scripts for database setup:

- `001_create_books_table.sql` - Initial books table
- `002_add_storygraph_rating.sql` - StoryGraph integration
- `003_add_classification_rating.sql` - Age classification
- `004_create_content_warnings_table.sql` - Content warnings
- `005_create_update_triggers.sql` - Database triggers
- `006_create_validation_count_triggers.sql` - Validation triggers
- `007_update_rls_policies_anonymous.sql` - Row Level Security
- `009_enhanced_books_workflow.sql` - Review workflow fields
- `010_create_scans_table.sql` - Scan tracking table

## Deployment

### Vercel Deployment

1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Environment Variables for Production

Ensure these are set in your Vercel project:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

## Automation

### Daily Metadata Fetch

A GitHub Action runs daily to fetch metadata for pending books:

- **Schedule**: Daily at 2 AM UTC
- **Manual Trigger**: Available via GitHub Actions UI
- **Process**: Calls `/api/fetch-metadata` endpoint

### Admin Dashboard

Access the admin dashboard at `/admin` to:
- View pending books for review
- Mark books as complete
- View scanning statistics
- Trigger manual metadata fetches

## API Usage

### Scan a Book

```bash
curl -X POST /api/scan-isbn \
  -H "Content-Type: application/json" \
  -d '{"isbn": "9781234567890"}'
```

### Fetch Metadata (Admin)

```bash
curl -X GET /api/fetch-metadata
```

### Get Pending Books (Admin)

```bash
curl -X GET /api/admin/pending-books
```

### Mark Review Complete (Admin)

```bash
curl -X POST /api/admin/complete-review \
  -H "Content-Type: application/json" \
  -d '{"bookId": "book-uuid-here"}'
```

## User Feedback & Data Retrieval

The application includes a comprehensive feedback system that captures user feedback with full context.

### Viewing Feedback Data

#### Quick View (Recommended)
```bash
# View all feedback (last 50)
npx tsx scripts/view-feedback.ts

# View only pending feedback
npx tsx scripts/view-feedback.ts --status=pending

# View specific feedback type
npx tsx scripts/view-feedback.ts --type=content_issue

# View feedback for a specific book
npx tsx scripts/view-feedback.ts --book-id=YOUR_BOOK_ID

# Limit results
npx tsx scripts/view-feedback.ts --limit=10
```

#### Using Supabase MCP
```sql
-- Get all feedback with context
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
ORDER BY created_at DESC;
```

#### Check Queue Script
```bash
# View all feedback, analysis requests, and rate limit feedback
npx tsx scripts/check-queue.ts
```

### Feedback Data Structure

Feedback is stored in `manual_handling_scans` table with `reason = 'user_feedback'`. Each entry includes:

- **Book Context**: `book_id`, `book_title`, `book_author`, `isbn`
- **Feedback Details**: `feedback_type`, `message`, `email` (stored in `metadata` JSONB)
- **Context Data**: `warnings_count`, `analysis_status`, `metadata_issues`, `pathname` (stored in `context_data` JSONB)
- **Technical Info**: `app_version`, `user_agent`, `page_url`
- **Status**: `status` (pending/in_progress/resolved/dismissed)

### Documentation

- **Full Guide**: See `docs/FEEDBACK_DATA_RETRIEVAL.md` for complete documentation
- **Quick Reference**: See `docs/FEEDBACK_QUICK_REFERENCE.md` for common queries

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.

