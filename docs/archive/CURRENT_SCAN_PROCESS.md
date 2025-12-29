# Current ISBN Scan Process

## Overview
Complete step-by-step flow from user scanning an ISBN to receiving results.

---

## 1. User Initiates Scan

**Location:** `app/scan/page.tsx`

- User enters ISBN manually OR scans barcode with camera
- Frontend sends POST to `/api/scan-isbn` with:
  ```json
  {
    "isbn": "9781234567890",
    "stream": true
  }
  ```

---

## 2. API Route Validation

**Location:** `app/api/scan-isbn/route.ts`

1. **Validate ISBN format** (10 or 13 digits)
   - If invalid → Return 400 Error
   
2. **Create streaming response** (if `stream: true`)
   - Sets up Server-Sent Events (SSE) for progress updates
   
3. **Call scan service:**
   ```typescript
   processIsbnScan(isbn, sendUpdate, selectedCandidate, forceRefresh, model)
   ```

---

## 3. Scan Service: Initial Setup

**Location:** `lib/services/scan-service.ts` → `processIsbnScan()`

### Step 3.1: Normalize ISBN
- Remove hyphens, spaces
- Convert to clean format
- **Progress:** "Validating ISBN and checking local database..."

### Step 3.2: Check Local Database
- Query: `SELECT * FROM books WHERE isbn = cleanIsbn`
- **If book found:**
  - Check if stale (>30 days old)
  - If stale → Refresh metadata in background (non-blocking)
  - Use existing book → **Skip to Step 6**
- **If book NOT found:**
  - Continue to Step 4

**Progress Update:**
```typescript
{
  action: 'Database lookup completed',
  result: 'Found existing book' or 'No existing book found',
  metadata: { found: boolean, bookId: string }
}
```

---

## 4. Fetch External Metadata

**Location:** `lib/book-api.ts` → `fetchCandidatesByISBN()`

### Step 4.1: Parallel API Calls
- **Open Library API:** `https://openlibrary.org/api/books?bibkeys=ISBN:{isbn}`
- **Google Books API:** `https://www.googleapis.com/books/v1/volumes?q=isbn:{isbn}`
- Both run in parallel for speed

### Step 4.2: Process Results

**0 Candidates Found:**
- Create minimal book record
- Go to Step 5 (Thin Metadata Path)

**1 Candidate Found:**
- Use this candidate
- Go to Step 5 (Metadata Quality Check)

**2+ Candidates Found (AMBIGUOUS):**
- Create `ambiguous_scans` entry in database
- Return `status: 'ambiguous'` with candidates array
- **Frontend:** Shows selection UI
- **User selects** → Restart flow with `selectedCandidate`

**Progress Update:**
```typescript
{
  action: 'External API fetch completed',
  result: `Found ${candidates.length} candidate(s)`,
  metadata: { candidateCount, candidates: [...] }
}
```

---

## 5. Metadata Quality Check

**Location:** `lib/services/scan-service.ts`

### Step 5.1: Check if Metadata is "Thin"
```typescript
isThinMetadata = !description || description.length < 150 || !cover_url
```

### Step 5.2: Branch Based on Quality

**THIN METADATA (< 150 chars OR missing cover):**
1. Create minimal book record in database
2. Log audit: `decision_type = 'metadata_thin'`
3. **Go to Step 5A: Deep AI Web Search**

**GOOD METADATA:**
1. Create full book record in database
2. **Go to Step 6: Check for Content Warnings**

---

## 5A. Deep AI Web Search (Thin Metadata Path)

**Location:** `lib/content-warning-agent.ts` → `findBookAndGenerateWarnings()`

### Step 5A.1: AI Agent Web Search
- **Agent searches:** Google Books, Apple Books, Goodreads, DuckDuckGo
- **Finds:** Title, author, description, cover URL, categories
- **Generates:** Content warnings (if found)

### Step 5A.2: Update Book Record
- Update database with AI-found metadata:
  - Title, author, description
  - Cover URL (if found)
  - Categories
  - Content warnings (if generated)

**Progress Update:**
```typescript
{
  action: 'AI agent completed web search and analysis',
  aiResponse: {
    book_found: boolean,
    book_title: string,
    confidence: 'low'|'medium'|'high',
    warnings_count: number,
    reasoning: string
  },
  result: 'AI found book with X warnings',
  metadata: { duration, warnings: [...] }
}
```

### Step 5A.3: Continue to Step 6
- If warnings were generated → Done
- If no warnings → Continue to Step 6 (may generate more)

---

## 6. Check for Content Warnings

**Location:** `lib/services/scan-service.ts`

### Step 6.1: Check Existing Warnings
- Query: `SELECT id FROM content_warnings WHERE book_id = bookId`
- **If warnings exist:**
  - Check if stale (old model/taxonomy version)
  - If stale → Delete old warnings → Generate new ones
  - If fresh → **Skip to Step 7**

### Step 6.2: Generate Content Warnings

**Strategy Decision:**

**For Existing Books OR Thin Metadata OR Force Refresh:**
- Use web search (more thorough, finds official content notes)
- Calls `findBookAndGenerateWarnings()` again (if not cached)

**For New Books with Good Metadata:**
- Use metadata-based analysis first (faster)
- Calls `generateContentWarnings()` with book metadata
- **Double-check:** If no warnings found, verify with web search

**Progress Update:**
```typescript
{
  action: 'Starting AI content warning analysis',
  metadata: { bookTitle, bookAuthor, hasDescription, descriptionLength }
}
```

### Step 6.3: AI Analysis Results

**If Warnings Generated:**
- Insert warnings into `content_warnings` table
- Log audit: `decision_type = 'warnings_generated'`
- Set `contentWarningsGenerated = true`

**If No Warnings:**
- Log audit: `decision_type = 'no_warnings'`
- May include reasoning about why it's safe

**Progress Update:**
```typescript
{
  action: 'AI metadata analysis completed',
  aiResponse: {
    confidence: string,
    reasoning: string,
    warnings_count: number,
    classification_rating: string
  },
  result: 'AI found X content warnings',
  metadata: { duration, warnings: [...] }
}
```

---

## 7. Author Context Investigation

**Location:** `lib/services/scan-service.ts`

- Check if author context exists in `author_context` table
- If missing → Investigate with AI agent (currently disabled)
- Set `authorContextInvestigated = true`

---

## 8. Record Scan & Return Result

**Location:** `lib/services/scan-service.ts`

### Step 8.1: Record Scan
- Insert into `scans` table:
  ```sql
  INSERT INTO scans (isbn, book_id) VALUES (cleanIsbn, bookId)
  ```

### Step 8.2: Calculate Timings
- Total duration
- Breakdown by stage:
  - `dbLookup`
  - `externalMetadataFetch`
  - `webSearch`
  - `aiContentWarningGeneration`
  - `dbWrites`

### Step 8.3: Return Result
```typescript
{
  success: true,
  book: Book object,
  scan: Scan object,
  isNewBook: boolean,
  contentWarningsGenerated: boolean,
  authorContextInvestigated: boolean,
  timings: { ... },
  flags: {
    usedWebSearch: boolean,
    isThinMetadata: boolean,
    pipelinePath: string
  }
}
```

### Step 8.4: Stream to Frontend
- Final result sent via SSE: `data: {result: {...}}\n\n`
- Frontend receives and displays:
  - Book details
  - Content warnings (if any)
  - Timing information
  - Success/error status

---

## 9. Frontend Display

**Location:** `app/scan/page.tsx`

- Shows book card with cover
- Displays content warnings
- Shows "View Book Page" button
- Saves to scan history
- Updates last scanned ISBN

---

## Key Decision Points

### When is AI Agent Called?

1. **Thin Metadata** (< 150 chars description OR missing cover)
2. **Book Not Found** in external APIs
3. **Existing Book** generating warnings (uses web search)
4. **Force Refresh** requested by user
5. **Double-Check** when metadata analysis finds no warnings

### Cover Finding Process

**During Initial Fetch:**
- Google Books API (validates > 5KB, not 15,567 bytes)
- Open Library API (validates response OK)
- Amazon (may fail due to CORS)
- ISBN DB

**During AI Web Search:**
- AI agent searches multiple sources
- Returns `book_cover_url` if found
- Updates database if cover was missing

**Current Limitation:**
- No dedicated AI agent fallback if all 4 direct sources fail
- AI agent only called for thin metadata or content warnings

---

## Performance Considerations

- **Parallel API calls** for speed (Open Library + Google Books)
- **Caching** of web search results to avoid duplicate AI calls
- **Background refresh** for stale data (non-blocking)
- **Streaming updates** so user sees progress in real-time

---

## Error Handling

- Invalid ISBN → 400 Error
- API failures → Continue to next source
- AI failures → Log error, continue without warnings
- Database errors → Log, don't break scan







