# Agent README - Quick Start Guide for AI Assistants

**Welcome!** This document helps you quickly understand the project and start contributing effectively.

## 🎯 Project Overview

**Subtext** is a book content warning platform that helps users discover content warnings for books by scanning ISBNs or barcodes. The system uses AI to analyze book metadata and generate content warnings aligned with Australian Classification Board standards.

**Production URL:** https://subtext-books.vercel.app

## 🏗️ Architecture at a Glance

```
User scans ISBN → API Route → Scan Service → AI Agent → Database
                                    ↓
                            External APIs (Google Books, Open Library)
```

### Key Components

1. **Frontend**: Next.js 15 + React 19 (App Router)
2. **Backend**: Next.js API Routes + Supabase (PostgreSQL)
3. **AI**: OpenAI GPT-4o agents for content analysis
4. **External APIs**: Google Books, Open Library (metadata), DuckDuckGo (web search)

## 📁 Critical Files to Know

### Core Business Logic
- **`lib/services/scan-service.ts`** - Main scan orchestration (DB lookup → metadata fetch → AI generation → save)
- **`lib/content-warning-agent.ts`** - AI agent for generating content warnings (supports 3 instruction modes: old/new/hybrid)
- **`lib/book-api.ts`** - External API integration (Google Books, Open Library)
- **`lib/config/taxonomy-v2.ts`** - Content warning taxonomy (hierarchical parent-child structure)

### API Routes
- **`app/api/scan-isbn/route.ts`** - Main scan endpoint (SSE streaming)
- **`app/api/scan/route.ts`** - Alternative scan endpoint
- **`app/api/dev/scan-with-agent/route.ts`** - Dev-only agent comparison tool

### Database
- **`lib/supabase/admin.ts`** - Admin client (service role, use in scripts)
- **`lib/supabase/client.ts`** - Client-side Supabase client
- **`lib/supabase/server.ts`** - Server-side Supabase client
- **`supabase/migrations/`** - Database migration scripts

### UI Components
- **`app/page.tsx`** - Homepage (scanner interface)
- **`app/collection/page.tsx`** - Bookshelf/collection view
- **`app/book/[isbn]/page.tsx`** - Book detail page
- **`components/book-details.tsx`** - Book display component
- **`components/navbar.tsx`** - Navigation with dev settings

### Dev Tools
- **`app/dev/agent-comparison/page.tsx`** - Compare old/new/hybrid AI agents side-by-side
- **`scripts/`** - Various utility scripts (check-book.ts, add-author-warnings.ts, etc.)

## 🚀 Quick Start Workflow

### 1. Understanding the Scan Flow

```typescript
// Typical scan flow:
1. User enters ISBN → POST /api/scan-isbn
2. processIsbnScan() checks DB for existing book
3. If not found → fetchBookByISBN() (Google Books → Open Library fallback)
4. If no warnings → findBookAndGenerateWarnings() (AI agent)
5. Save book + warnings to database
6. Stream progress via SSE to frontend
```

### 2. AI Agent Instruction Modes

The system supports **three instruction modes**:

- **`'old'`** - Assumption-based (makes inferences from genre/author)
- **`'new'`** - Evidence-based (strict, no assumptions)
- **`'hybrid'`** - **DEFAULT** - Evidence-first, then conservative inference

**Key Function:** `lib/content-warning-agent.ts`
- `getHybridInstructions()` - Current production default
- `getOldInstructions()` - Original assumption-based
- `getNewInstructions()` - Strict evidence-based

**To test all three:** Use `/dev/agent-comparison` (dev mode only)

### 3. Database Schema Highlights

**`books` table:**
- `id`, `isbn`, `title`, `author`, `description`, `cover_url`, etc.
- `has_author_warnings` - Boolean flag for author-provided warnings
- `author_warning_url` - URL to author's content warning page

**`content_warnings` table:**
- `id`, `book_id`, `category_id`, `subcategory_id` (hierarchical taxonomy)
- `severity_score` (0.0-1.0), `confidence_score` (0.5-1.0)
- `presence` (on_page, off_page, flashback, referenced, implied)
- `detail_level` (graphic, moderate, vague, clinical)
- `is_spoiler`, `is_author_verified`, `source_url`
- `requires_mediation`, `has_indigenous_deceased` (Australian compliance)

**`scans` table:**
- Tracks all ISBN scan activity
- Links to books via `book_id`

**`ai_audit_logs` table:**
- Dev-only audit trail of AI decisions
- Accessible via `?showAudit=true` query param in dev mode

### 4. Environment Variables

```bash
# Required
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...  # For admin operations

# Optional
OPENAI_API_KEY=...  # Required for AI features
GOOGLE_BOOKS_API_KEY=...  # Optional, improves metadata quality
```

## 🔧 Common Tasks & How-To

### Add a New Content Warning Category

1. Edit `lib/config/taxonomy-v2.ts`
2. Add to `TAXONOMY` object with parent category
3. Add subcategories if needed
4. Run migration if schema changes needed: `supabase/migrations/`

### Test AI Agent Changes

1. Use dev comparison tool: `/dev/agent-comparison`
2. Enter ISBN (e.g., `9780349433883`)
3. Check "Include Hybrid mode" (default)
4. Use "Run Sequentially" to avoid rate limits
5. Compare old/new/hybrid outputs side-by-side

### Debug a Book Scan

```bash
# Check if book exists
npm run check-book -- 9780349433883

# Check scan results
npm run check-scan -- 9780349433883

# Check database stats
npm run check-db-stats
```

### Add Author-Provided Warnings

```bash
# Use the script
npm run add-author-warnings
# Follow prompts to enter ISBN, warnings, etc.
```

### Run Database Migration

```typescript
// Via Supabase MCP (preferred)
mcp_supabase_apply_migration({
  project_id: "prj_lgJWu7BTgNcr0NgPac0lD2WeIE0x",
  name: "migration_name",
  query: "SQL here"
})

// Or via script
npm run run-migration -- scripts/your-migration.sql
```

## ⚠️ Important Gotchas

### 1. **Dev Mode Detection**
- Dev-only features check: `localhost`, `127.0.0.1`, or `NODE_ENV === 'development'`
- Use `isDevMode()` helper function (see `components/navbar.tsx`)

### 2. **Rate Limits**
- OpenAI GPT-4o: 30,000 tokens/minute
- Use sequential execution with delays when testing multiple agents
- Error handling: Check for `429` status codes

### 3. **Hydration Mismatches**
- Don't access `localStorage`/`window` during SSR
- Use `useState` + `useEffect` pattern for client-only code
- See `components/severity-score-badge.tsx` for example

### 4. **Database Clients**
- **Admin operations** (scripts): Use `supabaseAdmin` from `lib/supabase/admin.ts`
- **Server components**: Use `createServerClient` from `lib/supabase/server.ts`
- **Client components**: Use `createBrowserClient` from `lib/supabase/client.ts`

### 5. **ISBN Normalization**
- Always use `normalizeISBN()` before database queries
- Handles ISBN-10/ISBN-13 conversion
- See `lib/isbn-validation.ts`

### 6. **Placeholder Titles**
- External APIs sometimes return "Untitled TBC 202325" or similar
- Use `isPlaceholderTitle()` to detect and filter
- Triggers deeper AI search if placeholder detected

### 7. **Web Scraping**
- Currently only confirms book existence on author sites
- Does NOT extract actual warning text
- Consider removing or improving (see `lib/content-warning-agent.ts` lines 234-278)

## 🧪 Testing Workflows

### Test Scan Flow
```bash
# Start dev server
npm run dev

# In another terminal, test scan
curl -X POST http://localhost:3000/api/scan-isbn \
  -H "Content-Type: application/json" \
  -d '{"isbn": "9780349433883"}'
```

### Test Agent Comparison
1. Navigate to `http://localhost:3000/dev/agent-comparison`
2. Enter ISBN
3. Check "Run Sequentially" (prevents rate limits)
4. Click "Run Comparison"
5. Review side-by-side results

### Test Database Queries
```typescript
// In a script
import { supabaseAdmin } from '@/lib/supabase/admin'

const { data, error } = await supabaseAdmin
  .from('books')
  .select('*, content_warnings(*)')
  .eq('isbn', '9780349433883')
  .single()
```

## 📚 Key Concepts

### Content Warning Taxonomy
- **Hierarchical**: Parent categories (e.g., `violence`) → Subcategories (e.g., `gun_violence`)
- **Severity**: 0.0-1.0 score mapped to Mild/Moderate/Severe
- **Confidence**: 0.5-1.0 (AI self-assessment)
- **Presence**: How content appears (on_page, off_page, flashback, etc.)
- **Detail Level**: How graphic/explicit (graphic, moderate, vague, clinical)

### AI Agent Reasoning
- **Evidence Type**: "verified" (from reliable source) vs "inferred" (conservative guess)
- **Source Hierarchy**: Author/Publisher > Professional Reviews > User Consensus
- **False Positive Checks**: Death ≠ Grief, Action ≠ Violence
- **Genre Rules**: Romance (no sex inference unless "Steamy"), Thriller (no gore unless "Horror")

### Australian Compliance
- **ACB Alignment**: Severity ranges aligned with Australian Classification Board
- **Requires Mediation**: Flag for books needing parent/teacher review
- **Indigenous Deceased**: Special flag for Australian cultural protocols

## 🔍 Debugging Tips

### Check Recent Session Summaries
- `SESSION_SUMMARY.md` - Previous session notes
- `SESSION_SUMMARY_20251208.md` - Most recent session (hybrid agent implementation)

### Common Issues

**"Book not found" but ISBN is valid:**
- Check if placeholder title was filtered
- Verify external APIs are responding
- Check `isThinMetadata` flag in scan result

**"429 Rate limit reached":**
- Use sequential execution
- Add delays between requests
- Check token usage in OpenAI dashboard

**"Hydration failed":**
- Look for `localStorage`/`window` access in server components
- Use `useEffect` for client-only code
- Check for conditional rendering based on client state

**"Cannot find module":**
- Check if file exists in correct location
- Verify imports use `@/` alias (configured in `tsconfig.json`)
- Run `npm install` if new dependencies added

## 🚢 Deployment

### Vercel Deployment
```bash
# Deploy via CLI
vercel --prod

# Or push to main branch (auto-deploys)
git push origin main
```

### Environment Variables
- Set in Vercel dashboard: Project Settings → Environment Variables
- Required: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- Optional: `OPENAI_API_KEY`, `GOOGLE_BOOKS_API_KEY`

### Custom Domain
- Production domain: `subtext-books.vercel.app`
- Configured in Vercel dashboard
- Deployment protection: Currently disabled (public access)

## 📝 Code Style & Patterns

### TypeScript
- Strict mode enabled
- Use types from `types/supabase.ts` for database types
- Prefer interfaces for component props

### React Patterns
- Server Components by default (App Router)
- Use `"use client"` only when needed (interactivity, hooks)
- Prefer Server Actions over API routes when possible

### File Organization
- `app/` - Next.js App Router pages and API routes
- `components/` - Reusable React components
- `lib/` - Business logic, utilities, services
- `scripts/` - Standalone utility scripts
- `supabase/migrations/` - Database migrations

## 🆘 Getting Help

### Check These First
1. **Session Summaries**: `SESSION_SUMMARY*.md` files
2. **Architecture Docs**: `CURRENT-ARCHITECTURE.md`
3. **Flow Diagrams**: `FLOWCHART.md`, `SCAN_FLOW.md`
4. **Git History**: `git log --oneline` for recent changes

### Useful Commands
```bash
# Check git status
git status

# View recent commits
git log --oneline -10

# Check for linting errors
npm run lint

# Check TypeScript errors
npx tsc --noEmit

# Run tests (if any)
npm test
```

### MCP Tools Available
- **Supabase MCP**: Database queries, migrations, project management
- **Vercel MCP**: Deployment management, project info, domain assignment

## ✅ Before Starting Work

1. **Check git status** - Are there uncommitted changes?
2. **Read recent session summary** - What was last worked on?
3. **Understand the task** - Ask clarifying questions if needed
4. **Check dev mode** - Ensure you're testing in dev environment
5. **Test existing functionality** - Verify nothing is broken before making changes

## 🎯 Current State (as of Dec 8, 2025)

- ✅ **Hybrid AI agent** is default production mode
- ✅ **Agent comparison tool** available at `/dev/agent-comparison`
- ✅ **Hierarchical taxonomy** implemented (parent-child categories)
- ✅ **Barcode scanning** implemented (camera-based)
- ✅ **Search functionality** with severity filters
- ✅ **Sorting options** on bookshelf (A-Z, Severity, etc.)
- ✅ **Dev settings** system for toggling dev-only features

**Production URL:** https://subtext-books.vercel.app

---

**Last Updated:** December 8, 2025  
**Next Agent:** Read this README, check `SESSION_SUMMARY_20251208.md` for recent work, then proceed with your task!





















