# Manual Handling Notifications Setup

This system automatically creates GitHub Issues when book scans require manual developer intervention.

## What Gets Tracked

The system logs scans that need manual handling for these reasons:

1. **`not_found`** - Book not found in any external API (Open Library, Google Books)
2. **`ambiguous`** - Multiple book candidates found for the same ISBN
3. **`analysis_failed`** - AI content warning analysis failed
4. **`description_too_minimal`** - Book description too short to generate accurate warnings

## Setup Instructions

### 1. Run Database Migration

Apply the migration to create the `manual_handling_scans` table:

```bash
# Using Supabase CLI
supabase migration up

# Or apply directly via Supabase dashboard
# Copy contents of: supabase/migrations/20250101_create_manual_handling_scans.sql
```

### 2. Configure GitHub Secrets

Add these secrets to your GitHub repository (Settings → Secrets and variables → Actions):

- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` - Your Supabase service role key (for admin access)

### 3. Enable GitHub Actions

The workflow (`.github/workflows/manual-handling-notifications.yml`) will:
- Run automatically every 6 hours
- Check for pending manual handling scans
- Create GitHub Issues for each pending scan
- Avoid creating duplicate issues for the same ISBN

### 4. Manual Trigger

You can also trigger the workflow manually:
- Go to Actions → Manual Handling Notifications
- Click "Run workflow"

## How It Works

1. **Scan Service** logs manual handling cases to `manual_handling_scans` table
2. **GitHub Actions** workflow runs every 6 hours
3. **Workflow** fetches pending scans from database
4. **Workflow** creates GitHub Issues with:
   - Clear title and description
   - Actionable checklist
   - Labels: `manual-handling`, `reason-{reason}`
5. **Workflow** updates scan record with issue number

## Issue Format

Each issue includes:
- ISBN and reason for manual handling
- Relevant context (error messages, candidates, etc.)
- Actionable checklist items
- Link back to scan record

## Resolving Issues

When you resolve a manual handling case:

1. Complete the action items in the GitHub Issue
2. Update the scan status in the database (via API or directly)
3. Close the GitHub Issue

The scan record will be updated with:
- `status: 'resolved'`
- `resolved_by: {your_github_username}`
- `resolved_at: {timestamp}`

## API Endpoints

### Get Pending Scans
```bash
GET /api/admin/manual-handling-scans?status=pending&limit=10
```

### Update Scan Status
```bash
PATCH /api/admin/manual-handling-scans
{
  "id": "scan-uuid",
  "status": "resolved",
  "resolved_by": "github-username",
  "resolution_notes": "Manually added book metadata"
}
```

## Monitoring

Check the GitHub Actions logs to see:
- How many pending scans were found
- Which issues were created
- Any errors during the process

## Customization

You can adjust:
- **Schedule frequency** - Edit cron in `.github/workflows/manual-handling-notifications.yml`
- **Issue labels** - Modify labels in the workflow
- **Issue template** - Customize the issue body format
- **Notification channels** - Add Slack/Discord/Email notifications





