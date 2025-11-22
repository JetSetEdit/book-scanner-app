# Development Scripts

This directory contains utility scripts for local development.

## Create Dummy Book

Creates a test book with sample content warnings for local development.

### Usage

```bash
# Using npm script (recommended)
npm run create-dummy-book

# Or run directly
node scripts/create-dummy-book.js
```

### What it creates

- **Book**: "The Adventures of Test Book" by Jane Developer
- **ISBN**: 9781234567890
- **Content Warnings**: 3 sample warnings (violence, mental_health, other)
- **Cover**: Placeholder image

### Requirements

Make sure you have these environment variables in your `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### Testing

After running the script, you can test:

1. **ISBN Scanning**: Enter `9781234567890` in the scanner
2. **Direct URL**: Visit `/book/9781234567890`
3. **Content Warnings**: See the 3 sample warnings with different sources
4. **User Feedback**: Test the thumbs up/down functionality

### Sample Data

The script creates:
- 1 AI-generated warning (violence, mild)
- 1 AI-generated warning (mental_health, moderate) 
- 1 Author-approved warning (other, mild)

Each warning has realistic helpful/not helpful counts for testing the UI.





