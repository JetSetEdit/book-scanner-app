# Book Scanner App - Developer Handover Documentation

**Last Updated:** January 1, 2026  
**Current Branch:** `feature/clean-codebase`  
**Status:** Active Development

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Architecture](#architecture)
3. [Technology Stack](#technology-stack)
4. [Project Structure](#project-structure)
5. [Core Workflows](#core-workflows)
6. [Database Schema](#database-schema)
7. [API Endpoints](#api-endpoints)
8. [Key Components](#key-components)
9. [AI Analysis System](#ai-analysis-system)
10. [Recent Changes & Features](#recent-changes--features)
11. [Known Issues](#known-issues)
12. [Development Setup](#development-setup)
13. [Testing](#testing)
14. [Deployment](#deployment)
15. [Important Notes](#important-notes)

---

## Project Overview

**Subtext** is a book scanning application that helps users discover content warnings, age ratings, and thematic depth for books by scanning ISBNs or barcodes. The app uses AI (OpenAI GPT-4o and Google Gemini) to analyze book descriptions and generate comprehensive content warnings using a structured taxonomy.

### Key Features

- **ISBN/Barcode Scanning**: Scan books via camera or manual ISBN entry
- **Multi-Model AI Analysis**: Uses both OpenAI and Gemini for content warning generation
- **Content Warning Taxonomy**: Structured v2.5 taxonomy with categories, subcategories, and severity levels
- **Unique Warning Verification**: POC feature that verifies warnings found by only one AI model
- **Book Database**: Comprehensive database with metadata from Open Library and Google Books
- **PWA Support**: Progressive Web App with offline capabilities
- **Accessibility**: Audio descriptions, screen reader support, keyboard navigation

---

## Architecture

### High-Level Flow

```
User Scans ISBN
    ↓
ISBN Validation & Normalization
    ↓
Check Local Database (Supabase)
    ↓
[If Not Found] Fetch from External APIs (Open Library, Google Books)
    ↓
Save/Update Book Record
    ↓
Fetch/Update Description (if needed)
    ↓
AI Analysis (OpenAI + Gemini in parallel)
    ↓
Combine & Verify Results (unique warnings only)
    ↓
Save Content Warnings
    ↓
Return Results to User
```

### API Strategy

The app uses a **TOS-friendly API hierarchy**:

1. **Primary Source: Open Library API**
   - Free, open-source, no API keys required
   - **ISSUE**: Currently returns `excerpts` (quotes) not `descriptions`
   - URL: `https://openlibrary.org/api/books?bibkeys=ISBN:{isbn}&format=json&jscmd=data`

2. **Fallback Source: Google Books API**
   - High-quality metadata and covers
   - Provides actual book descriptions
   - URL: `https://www.googleapis.com/books/v1/volumes?q=isbn:{isbn}`

**Current Problem**: Open Library's `jscmd=data` endpoint returns `excerpts[0].text` (book quotes) instead of actual descriptions. This causes books like "Gone Girl" to have only 52-character opening lines instead of full descriptions.

---

## Technology Stack

### Frontend
- **Framework**: Next.js 16.0.7 (App Router)
- **UI Library**: React 19.2.1
- **Styling**: Tailwind CSS 4.1.9
- **Components**: Radix UI primitives
- **Icons**: Lucide React
- **State Management**: React hooks + Local Storage
- **Barcode Scanning**: html5-qrcode, @zxing/library

### Backend
- **Runtime**: Node.js (Next.js API routes)
- **Database**: Supabase (PostgreSQL)
- **ORM**: Supabase JS client
- **AI Services**: 
  - OpenAI (GPT-4o)
  - Google Gemini (gemini-pro, gemini-1.5-flash fallback)

### Infrastructure
- **Hosting**: Vercel
- **Database**: Supabase
- **Environment**: TypeScript 5

---

## Project Structure

```
book-scanner-app/
├── app/                          # Next.js App Router pages
│   ├── api/                      # API routes
│   │   ├── scan/                 # Main scanning endpoint
│   │   ├── recent-scans/         # Recently scanned books
│   │   ├── report-book/          # Report missing books
│   │   ├── admin/                # Admin endpoints
│   │   └── ...
│   ├── scan/                     # Scan page
│   ├── book/[isbn]/               # Book detail page
│   ├── collection/                # Bookshelf/collection page
│   └── page.tsx                   # Homepage
│
├── components/                    # React components
│   ├── ui/                        # shadcn/ui components
│   ├── barcode-scanner.tsx       # Camera barcode scanner
│   ├── book-details.tsx           # Book display component
│   ├── content-warnings-list.tsx  # Warning display
│   ├── recent-scans.tsx           # Recent scans component
│   └── ...
│
├── lib/                           # Core libraries
│   ├── services/
│   │   ├── scan-service.ts        # Main scan orchestration
│   │   ├── multi-model-analysis.ts # AI analysis (OpenAI + Gemini)
│   │   └── book-service.ts        # Book operations
│   ├── book-api.ts                # External API fetching
│   ├── book-cache.ts              # Caching logic
│   ├── config/
│   │   ├── taxonomy-v2.ts         # Taxonomy definitions
│   │   └── taxonomy-context.ts     # Taxonomy types
│   ├── utils/                     # Utility functions
│   └── supabase/                  # Supabase clients
│
├── hooks/                         # React hooks
│   ├── use-scan-history.ts        # Scan history management
│   ├── use-user-preferences.ts    # User settings
│   └── ...
│
├── types/                         # TypeScript types
│   └── supabase.ts                # Generated Supabase types
│
├── scripts/                       # Utility scripts
│   ├── admin/                     # Admin scripts
│   ├── migrations/                # Database migrations
│   └── ...
│
└── supabase/
    └── migrations/                # Supabase migrations
```

---

## Core Workflows

### 1. Book Scanning Workflow

**File**: `lib/services/scan-service.ts` → `processIsbnScan()`

**Steps**:
1. **ISBN Validation** (line 182)
   - Normalize ISBN (remove hyphens/spaces)
   - Validate format

2. **Database Lookup** (lines 198-202)
   - Check if book exists in Supabase
   - If found and not stale (<30 days), use cached data

3. **External API Fetch** (if not found, lines 249-318)
   - Fetch from Open Library and Google Books in parallel
   - **CRITICAL**: Validate ISBN match (recently added)
   - Handle ambiguous results (multiple candidates)
   - Handle not found (log to `manual_handling_scans`)

4. **Book Record Creation/Update** (lines 373-402)
   - Save book metadata to database
   - Validate cover URLs (reject placeholders)
   - Always use scanned ISBN (not API-returned)

5. **Description Check** (lines 432-488)
   - If description missing or <100 chars, fetch fresh
   - Update database with new description
   - **Issue**: Open Library returns excerpts, not descriptions

6. **AI Analysis** (lines 493-700)
   - Check if description is sufficient (>50 chars)
   - Skip if too minimal (log to `manual_handling_scans`)
   - Run multi-model analysis (OpenAI + Gemini)
   - Verify unique warnings (POC feature)
   - Save content warnings to database

### 2. AI Analysis Workflow

**File**: `lib/services/multi-model-analysis.ts`

**Process**:
1. **Parallel Analysis** (lines 421-432)
   - Run OpenAI and Gemini analyses simultaneously
   - Each returns array of warnings

2. **Result Combination** (lines 526-601)
   - Merge warnings by `subcategory_id`
   - If both models find same warning: use more severe
   - Track unique warnings (found by only one model)

3. **Unique Warning Verification** (POC, lines 644-692)
   - Verify warnings found by only one model
   - Uses OpenAI to verify (single-pass, no debate)
   - Returns: keep/drop/adjust actions
   - Tracks metrics: kept, dropped, adjusted, latency

4. **Warning Processing** (lines 275-335)
   - Compute severity from signals
   - Validate sexual violence classifications
   - Preserve `other_note` and `description` fields

### 3. Content Warning Generation

**Taxonomy**: `lib/config/taxonomy-v2.ts`

**Structure**:
- **Categories**: violence, sexual_content, mental_health, etc.
- **Subcategories**: category.subcategory (e.g., `violence.graphic_violence`)
- **Severity**: mild, moderate, severe (computed from signals)
- **Special**: `other_*` subcategories require `other_note` field

**AI Prompts**:
- **Description Style**: Content-type focused, not plot-specific
  - ✅ GOOD: "Depictions of explicit gun violence"
  - ❌ BAD: "Alicia shoots her husband five times"
- **Evidence-Based**: Only include warnings with clear evidence
- **Spoiler Detection**: Mark warnings that reveal major plot points

---

## Database Schema

### Core Tables

#### `books`
```sql
- id (uuid, primary key)
- isbn (text, unique, indexed)
- title (text)
- author (text, nullable)
- description (text, nullable)
- cover_url (text, nullable)
- publisher (text, nullable)
- published_date (text, nullable)
- page_count (integer, nullable)
- categories (text[], nullable)
- source (text) -- 'openlibrary' | 'googlebooks'
- last_synced_at (timestamptz)
- created_at (timestamptz)
- updated_at (timestamptz)
```

#### `content_warnings`
```sql
- id (uuid, primary key)
- book_id (uuid, foreign key → books.id)
- category_id (text) -- Legacy field
- subcategory_id (text) -- Format: "category.subcategory"
- description (text)
- severity (text) -- 'mild' | 'moderate' | 'severe'
- confidence_score (float)
- context_modifiers (jsonb)
- evidence (jsonb) -- Array of evidence spans
- severity_signals (jsonb)
- taxonomy_version (text)
- presence (text) -- 'on_page' | 'off_page' | etc.
- detail_level (text) -- 'graphic' | 'moderate' | etc.
- is_spoiler (boolean)
- other_note (text) -- Required if subcategory_id starts with 'other_'
- source (text) -- 'ai_generated'
- created_at (timestamptz)
```

**Constraint**: `other_note` is required when `subcategory_id` starts with `'other_'`

#### `scans`
```sql
- id (uuid, primary key)
- isbn (text)
- book_id (uuid, foreign key → books.id)
- created_at (timestamptz)
```

#### `manual_handling_scans`
```sql
- id (uuid, primary key)
- isbn (text)
- reason (text) -- 'not_found' | 'ambiguous' | 'description_too_minimal' | 'analysis_failed'
- status (text) -- 'pending' | 'resolved'
- error_message (text, nullable)
- metadata (jsonb)
- created_at (timestamptz)
```

### Indexes
- `books.isbn` (unique index)
- `content_warnings.book_id` (indexed)
- `scans.isbn` (indexed)

---

## API Endpoints

### Core Endpoints

#### `POST /api/scan`
**Purpose**: Main book scanning endpoint  
**File**: `app/api/scan/route.ts`

**Request**:
```json
{
  "isbn": "9780307588371",
  "forceRefresh": false,
  "selectedCandidate": null
}
```

**Response**: Server-Sent Events (SSE) stream
- Progress updates
- Final result with book data and warnings

**Flow**: Calls `processIsbnScan()` from `scan-service.ts`

#### `GET /api/recent-scans`
**Purpose**: Fetch recently scanned books for homepage  
**File**: `app/api/recent-scans/route.ts`

**Returns**: Array of recent scans with book data

#### `POST /api/report-book`
**Purpose**: Report missing books  
**File**: `app/api/report-book/route.ts`

**Request**:
```json
{
  "isbn": "9780307588371",
  "title": "Optional title",
  "author": "Optional author",
  "additionalInfo": "Optional info"
}
```

### Admin Endpoints

- `GET /api/admin/pending-books` - List books needing review
- `POST /api/admin/complete-review` - Mark review complete
- `GET /api/admin/manual-handling-scans` - List manual handling cases

---

## Key Components

### Frontend Components

#### `app/scan/page.tsx`
**Purpose**: Main scanning interface  
**Features**:
- ISBN input
- Barcode scanner integration
- Progress display (SSE)
- Error handling
- Report form for missing books
- Scan history

#### `components/book-details.tsx`
**Purpose**: Display book information and warnings  
**Features**:
- Book metadata display
- Content warnings list
- Severity badges
- User preferences (trope mode, show mild)

#### `components/content-warnings-list.tsx`
**Purpose**: Render content warnings with filtering  
**Features**:
- Filter by severity
- Filter by trope mode
- Group by category
- Display evidence excerpts

#### `components/recent-scans.tsx`
**Purpose**: Display recently scanned books on homepage  
**Features**:
- Horizontal scrollable list
- Book covers
- Relative timestamps
- Auto-refresh every 30s

### Backend Services

#### `lib/services/scan-service.ts`
**Purpose**: Orchestrate entire scan process  
**Key Functions**:
- `processIsbnScan()` - Main entry point
- `logAuditDecision()` - Audit logging

#### `lib/services/multi-model-analysis.ts`
**Purpose**: AI analysis orchestration  
**Key Functions**:
- `analyzeBookWithMultiModel()` - Run both models
- `verifyUniqueWarnings()` - Verify unique warnings (POC)
- `combineResults()` - Merge model results

#### `lib/book-api.ts`
**Purpose**: Fetch from external APIs  
**Key Functions**:
- `fetchCandidatesByISBN()` - Get candidates
- `fetchBookByISBN()` - Get single book
- `fetchFromOpenLibrary()` - Open Library API
- `fetchFromGoogleBooks()` - Google Books API
- `isbnMatches()` - Validate ISBN match
- `extractISBNsFromGoogleBooks()` - Extract ISBNs from response

---

## AI Analysis System

### Multi-Model Architecture

**Models Used**:
1. **OpenAI GPT-4o** (primary)
   - Model: `gpt-4o`
   - Temperature: 0.3
   - JSON mode enabled

2. **Google Gemini** (secondary)
   - Models: `gemini-pro` → `gemini-1.5-flash` (fallback)
   - Temperature: 0.3

### Analysis Process

1. **Parallel Execution**: Both models analyze simultaneously
2. **Result Merging**: 
   - Same warning: Use more severe
   - Unique warnings: Include both
3. **Verification** (POC): Verify unique warnings with opposite model
4. **Severity Computation**: Based on presence, detail_level, frequency, centrality

### Verification POC

**Status**: Proof of Concept (active)

**Process**:
- Only verifies warnings found by ONE model
- Single-pass verification (no debate loop)
- Actions: keep, drop, adjust
- Metrics tracked: kept, dropped, adjusted, latency, drop_reasons

**Gating**: Only runs when unique warnings exist

**Next Steps**: Expand to `other_*` subcategories if successful

### Prompt Engineering

**Key Instructions**:
- Evidence-based only (no genre assumptions)
- Content-type descriptions (not plot summaries)
- Trauma-aware language
- Spoiler detection
- `other_note` required for `other_*` subcategories

---

## Recent Changes & Features

### Recent Commits (feature/clean-codebase branch)

1. **ISBN Validation Fix** (cb218ca)
   - Added ISBN validation from Google Books responses
   - Hard-fail if returned book doesn't match scanned ISBN
   - Always use scanned ISBN when saving

2. **Content Warning Description Improvements** (f50f5b8)
   - Updated prompts to use content-type descriptions
   - Added trauma-aware language guidance
   - Examples: GOOD vs BAD descriptions

3. **Unique Warning Verification POC** (db4744d, 2ed1543)
   - Added verification for unique warnings
   - Metrics tracking
   - `other_note` normalization after verification
   - Drop reason categorization

4. **Viewport Metadata Fix** (80619fa)
   - Moved viewport/themeColor to separate export
   - Fixed Next.js warnings

5. **Recent Scans Feature** (741be8e)
   - Added `/api/recent-scans` endpoint
   - Added `RecentScans` component
   - Homepage integration

6. **RLHF Removal**
   - Removed RLHF system (backed up)
   - Cleaned up developer menu
   - Removed unused endpoints

### Current Work

**Open Issue**: Open Library API returns excerpts, not descriptions
- **Problem**: Books like "Gone Girl" have only opening lines (52 chars)
- **Location**: `lib/book-api.ts` line 237
- **Fix Needed**: Don't use `excerpts[0].text` as description, prefer Google Books

---

## Known Issues

### Critical

1. **Open Library Excerpts Issue** ⚠️
   - **Location**: `lib/book-api.ts:237`
   - **Problem**: Using `excerpts[0].text` (book quotes) instead of descriptions
   - **Impact**: Books get minimal descriptions (opening lines only)
   - **Fix**: Prefer Google Books descriptions, don't use Open Library excerpts

2. **Description Validation**
   - **Location**: `lib/services/scan-service.ts:506-515`
   - **Problem**: Only checks length (>50 chars), not quality
   - **Impact**: Opening lines pass validation but aren't real descriptions
   - **Fix**: Add quality checks (word count, pattern detection)

### Medium Priority

3. **Gemini Model Compatibility**
   - **Location**: `lib/services/multi-model-analysis.ts:235-270`
   - **Status**: Fixed with fallback (gemini-pro → gemini-1.5-flash)
   - **Note**: May need updates if Google changes API

4. **Verification POC**
   - **Status**: Active POC, needs testing
   - **Next**: Expand to `other_*` subcategories if successful

### Low Priority

5. **Manual Handling Logs**
   - Some scans don't log to `manual_handling_scans` when they should
   - Need to audit logging coverage

---

## Development Setup

### Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account and project
- OpenAI API key
- Google Gemini API key (optional, has fallback)

### Environment Variables

Create `.env.local`:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# AI Services
OPENAI_API_KEY=your_openai_key
GEMINI_API_KEY=your_gemini_key

# Optional
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Installation

```bash
# Clone repository
git clone <repo-url>
cd book-scanner-app

# Install dependencies
npm install

# Set up environment variables
cp env.example .env.local
# Edit .env.local with your keys

# Run database migrations (if needed)
# See supabase/migrations/

# Start development server
npm run dev
```

### Database Setup

1. **Supabase Project**: Create project at supabase.com
2. **Run Migrations**: Apply migrations in `supabase/migrations/`
3. **RLS Policies**: Ensure Row Level Security is configured
4. **Indexes**: Verify indexes are created

### Development Commands

```bash
npm run dev          # Start dev server (localhost:3000)
npm run build        # Build for production
npm run lint         # Run linter
npm test             # Run tests (if any)
```

---

## Testing

### Manual Testing

**Test ISBNs**:
- `9780593356159` - "The Maid" (test book, can rescan)
- `9780307588371` - "Gone Girl" (has description issue)

**Test Scenarios**:
1. New book scan (not in database)
2. Existing book scan (cached)
3. Ambiguous results (multiple candidates)
4. Book not found
5. Minimal description (should skip analysis)
6. Full description (should run analysis)

### Debug Tools

**Scan Debug Sidebar**: Available in dev mode on scan page
- Shows detailed progress
- Timing information
- Error details

**Check Book Script**: `scripts/check-book.ts`
```bash
npm run check-book 9780307588371
```

---

## Deployment

### Vercel Deployment

1. **Connect Repository**: Link GitHub repo to Vercel
2. **Environment Variables**: Set all required env vars
3. **Build Settings**: 
   - Framework: Next.js
   - Build Command: `npm run build`
   - Output Directory: `.next`
4. **Deploy**: Automatic on push to main

### Environment Variables (Production)

Ensure all variables from `.env.local` are set in Vercel dashboard.

### Database Migrations

Run migrations via Supabase dashboard or CLI:
```bash
supabase migration up
```

---

## Important Notes

### Code Quality

- **TypeScript**: Strict mode enabled
- **Linting**: ESLint configured
- **Formatting**: Prettier (if configured)

### Security

- **API Keys**: Never commit to git
- **Service Role Key**: Only used server-side
- **RLS Policies**: Enforced on all tables
- **ISBN Validation**: Validates API responses match scanned ISBN

### Performance

- **Caching**: 30-day cache for book metadata
- **Parallel API Calls**: Open Library and Google Books fetched simultaneously
- **SSE Streaming**: Progress updates streamed to client
- **Image Validation**: Cover URLs validated before saving

### Accessibility

- **ARIA Labels**: All interactive elements labeled
- **Keyboard Navigation**: Full keyboard support
- **Screen Readers**: Semantic HTML, proper headings
- **Audio Descriptions**: Available for content warnings

### Future Work

1. **Fix Open Library Excerpts Issue** (priority)
2. **Improve Description Validation** (quality checks)
3. **Expand Verification POC** (to `other_*` subcategories)
4. **Add More Test Coverage**
5. **Performance Optimization** (if needed)

---

## Contact & Resources

### Documentation Files

- `README.md` - Basic project overview
- `TAXONOMY_REFERENCE.md` - Content warning taxonomy
- `TEST_BOOK.md` - Test book information
- `DEV_MENU_ANALYSIS.md` - Developer menu documentation

### Key Files to Review

1. `lib/services/scan-service.ts` - Main scan logic
2. `lib/services/multi-model-analysis.ts` - AI analysis
3. `lib/book-api.ts` - External API fetching
4. `app/api/scan/route.ts` - Scan API endpoint
5. `app/scan/page.tsx` - Scan UI

### Git Branches

- `main` - Production branch
- `feature/clean-codebase` - Current development branch

---

**End of Handover Documentation**

For questions or clarifications, review the codebase and test with the provided test ISBNs.

