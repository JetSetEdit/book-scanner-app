# Complete ISBN Scan Flow Diagram

## High-Level Flow: User → Frontend → API → Service → AI → Database → Response

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          ISBN SCAN FLOW - COMPLETE                           │
└─────────────────────────────────────────────────────────────────────────────┘

┌──────────────┐
│   USER       │ Enters ISBN in /scan-test page
│  (Frontend)  │ Clicks "Scan Book" button
└──────┬───────┘
       │
       │ POST /api/scan-isbn
       │ { isbn: "9781234567890", stream: true }
       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  API ROUTE: app/api/scan-isbn/route.ts                                       │
│  ──────────────────────────────────────────────────────────────────────────  │
│  1. Validate ISBN format (10 or 13 digits)                                 │
│  2. If invalid → Return 400 Error                                           │
│  3. If stream=true → Create ReadableStream                                   │
│  4. Call processIsbnScan(isbn, sendUpdate, selectedCandidate, forceRefresh) │
└─────────────────────────────────────────────────────────────────────────────┘
       │
       │ Progress updates streamed back via sendUpdate()
       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  SCAN SERVICE: lib/services/scan-service.ts                                  │
│  ──────────────────────────────────────────────────────────────────────────  │
│  Function: processIsbnScan()                                                 │
│                                                                              │
│  STEP 1: Normalize & Validate                                               │
│  ├─ normalizeISBN(isbn) → Remove hyphens/spaces                            │
│  └─ Send: "Validating ISBN and checking local database..."                   │
│                                                                              │
│  STEP 2: Check Local Database                                               │
│  ├─ Query: SELECT * FROM books WHERE isbn = cleanIsbn                       │
│  ├─ If found AND NOT selectedCandidate:                                     │
│  │   └─→ Use existing book (skip to STEP 6)                                 │
│  └─ If NOT found OR selectedCandidate exists:                               │
│      └─→ Continue to STEP 3                                                 │
└─────────────────────────────────────────────────────────────────────────────┘
       │
       │ (Book not found locally)
       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  STEP 3: Fetch External Metadata                                            │
│  ──────────────────────────────────────────────────────────────────────────  │
│  Function: fetchCandidatesByISBN() from lib/book-api.ts                   │
│                                                                              │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │  PARALLEL API CALLS:                                                 │  │
│  │  ├─ Open Library API                                                 │  │
│  │  │   └─ GET https://openlibrary.org/api/books?bibkeys=ISBN:{isbn}   │  │
│  │  │                                                                   │  │
│  │  └─ Google Books API                                                │  │
│  │      └─ GET https://www.googleapis.com/books/v1/volumes?q=isbn:{isbn}│  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
│  Result Analysis:                                                            │
│  ├─ 0 Candidates Found                                                      │
│  │   └─→ Create minimal book record → Go to STEP 4 (Thin Metadata)         │
│  │                                                                          │
│  ├─ 1 Candidate Found                                                       │
│  │   └─→ Use this candidate → Go to STEP 4                                │
│  │                                                                          │
│  └─ 2+ Candidates Found (AMBIGUOUS)                                         │
│      ├─ Create ambiguous_scans entry                                         │
│      ├─ Return status: 'ambiguous' with candidates array                    │
│      └─→ FRONTEND: Show selection UI → User picks → Restart flow           │
└─────────────────────────────────────────────────────────────────────────────┘
       │
       │ (1 candidate found OR 0 candidates)
       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  STEP 4: Metadata Quality Check                                             │
│  ──────────────────────────────────────────────────────────────────────────  │
│  Check: isThinMetadata = !description || description.length < 150           │
│                                                                              │
│  ├─ THIN METADATA (< 150 chars OR missing cover)                            │
│  │   ├─ Create minimal book record in DB                                    │
│  │   ├─ Log audit: decision_type = 'metadata_thin'                         │
│  │   └─→ Go to STEP 5A: Deep AI Web Search                                 │
│  │                                                                          │
│  └─ GOOD METADATA                                                           │
│      ├─ Create full book record in DB                                       │
│      └─→ Go to STEP 6: Check for Content Warnings                           │
└─────────────────────────────────────────────────────────────────────────────┘
       │
       │ (Thin metadata path)
       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  STEP 5A: Deep AI Web Search (Thin Metadata)                                │
│  ──────────────────────────────────────────────────────────────────────────  │
│  Function: findBookAndGenerateWarnings(isbn)                                │
│  From: lib/content-warning-agent.ts                                         │
│                                                                              │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │  AI AGENT WORKFLOW:                                                   │  │
│  │  ────────────────────────────────────────────────────────────────────  │  │
│  │  1. Agent receives: "Find book with ISBN: {isbn}"                    │  │
│  │                                                                      │  │
│  │  2. Agent uses webSearchTool:                                        │  │
│  │     ├─ Google Books API (ISBN search)                                │  │
│  │     ├─ Apple Books API (fallback)                                    │  │
│  │     ├─ DuckDuckGo API (general search)                               │  │
│  │     └─ Author site scraping (if known author)                        │  │
│  │                                                                      │  │
│  │  3. Agent analyzes search results:                                   │  │
│  │     ├─ Extracts: title, author, description, cover_url               │  │
│  │     ├─ Generates content warnings                                    │  │
│  │     └─ Assigns classification rating (G/PG/M/MA15+/R18+)            │  │
│  │                                                                      │  │
│  │  4. Returns:                                                         │  │
│  │     {                                                                │  │
│  │       book_found: true,                                             │  │
│  │       book_title: "...",                                             │  │
│  │       book_description: "...",                                       │  │
│  │       content_warnings: [...],                                        │  │
│  │       classification_rating: "M",                                    │  │
│  │       confidence: "high"                                             │  │
│  │     }                                                                │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
│  Actions:                                                                    │
│  ├─ Update book record with AI-found metadata                               │
│  ├─ Log audit: decision_type = 'search_performed'                          │
│  ├─ If warnings found:                                                      │
│  │   ├─ Insert warnings into content_warnings table                         │
│  │   └─ Log audit: decision_type = 'warnings_generated'                    │
│  └─ If no warnings:                                                         │
│      └─ Log audit: decision_type = 'no_warnings'                           │
│                                                                              │
│  └─→ Return result to frontend                                              │
└─────────────────────────────────────────────────────────────────────────────┘
       │
       │ (Good metadata path OR existing book)
       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  STEP 6: Check for Existing Content Warnings                                │
│  ──────────────────────────────────────────────────────────────────────────  │
│  Query: SELECT id FROM content_warnings WHERE book_id = bookId              │
│                                                                              │
│  ├─ Warnings Exist                                                          │
│  │   ├─ Check if stale (old model_version or taxonomy_version)              │
│  │   ├─ If stale → Delete old warnings → Continue to STEP 7               │
│  │   └─ If fresh → Return existing book with warnings                       │
│  │                                                                          │
│  └─ No Warnings OR Stale OR forceRefresh                                    │
│      └─→ Go to STEP 7: Generate Content Warnings                           │
└─────────────────────────────────────────────────────────────────────────────┘
       │
       │ (Need to generate warnings)
       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  STEP 7: Generate Content Warnings                                          │
│  ──────────────────────────────────────────────────────────────────────────  │
│  Strategy Decision:                                                         │
│                                                                              │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │  IF: isExistingBook OR isThinMetadata OR forceRefresh                │  │
│  │  THEN: Use Deep Web Search (findBookAndGenerateWarnings)             │  │
│  │  ────────────────────────────────────────────────────────────────────  │  │
│  │  • More thorough, finds official author content notes                │  │
│  │  • Uses cached result if available from STEP 5A                       │  │
│  │  • Searches: Google Books, DuckDuckGo, Author sites                  │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │  ELSE: Use Metadata-Based Analysis (generateContentWarnings)         │  │
│  │  ────────────────────────────────────────────────────────────────────  │  │
│  │  • Faster, analyzes provided description/categories                   │  │
│  │  • If no warnings found → DOUBLE CHECK with web search               │  │
│  │  • Prevents false negatives                                           │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
│  AI Agent Analysis:                                                          │
│  ├─ Analyzes: title, author, description, categories                       │
│  ├─ Uses training examples from lib/training-examples.ts                   │
│  ├─ Applies taxonomy from lib/config/taxonomy.ts                           │
│  ├─ Generates warnings with:                                               │
│  │   ├─ category_id (violence, sexual_content, etc.)                      │
│  │   ├─ description (user-facing text)                                     │
│  │   ├─ score (0.0-1.0) → maps to severity (mild/moderate/severe)        │
│  │   ├─ reasoning (technical explanation)                                  │
│  │   └─ is_author_verified (if from official source)                       │
│  └─ Assigns classification_rating (G/PG/M/MA15+/R18+)                    │
│                                                                              │
│  Actions:                                                                    │
│  ├─ Insert warnings into content_warnings table                             │
│  ├─ Log audit: decision_type = 'warnings_generated' or 'no_warnings'      │
│  └─ Update book record if cover_url found                                  │
└─────────────────────────────────────────────────────────────────────────────┘
       │
       │
       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  STEP 8: Create Scan Record                                                 │
│  ──────────────────────────────────────────────────────────────────────────  │
│  Insert into scans table:                                                   │
│  {                                                                          │
│    isbn: cleanIsbn,                                                         │
│    book_id: bookId                                                          │
│  }                                                                          │
└─────────────────────────────────────────────────────────────────────────────┘
       │
       │
       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  STEP 9: Return Result                                                      │
│  ──────────────────────────────────────────────────────────────────────────  │
│  ScanResult:                                                                │
│  {                                                                          │
│    success: true,                                                           │
│    status: 'success' | 'ambiguous' | 'error',                              │
│    book: Book object,                                                       │
│    scan: Scan object,                                                       │
│    isNewBook: boolean,                                                      │
│    contentWarningsGenerated: boolean,                                       │
│    authorContextInvestigated: boolean                                       │
│  }                                                                          │
│                                                                              │
│  Streamed back to frontend via:                                            │
│  - Progress updates: "data: {status: 'message'}\n\n"                      │
│  - Final result: "data: {result: {...}}\n\n"                                │
└─────────────────────────────────────────────────────────────────────────────┘
       │
       │
       ▼
┌──────────────┐
│   FRONTEND   │ Receives streaming updates
│  /scan-test  │ Displays progress messages
│              │ Shows book details + warnings
│              │ OR shows candidate selection UI (if ambiguous)
└──────────────┘
```

## Key Decision Points

### 1. **Ambiguous Results**
```
Multiple candidates found
    ↓
Create ambiguous_scans entry
    ↓
Return status: 'ambiguous'
    ↓
Frontend shows selection UI
    ↓
User selects candidate
    ↓
Restart flow with selectedCandidate
```

### 2. **Thin Metadata Detection**
```
Description < 150 chars OR missing cover
    ↓
Log: metadata_thin
    ↓
Force Deep AI Web Search
    ↓
Update book with AI-found metadata
```

### 3. **Content Warning Generation Strategy**
```
┌─────────────────────────────────────────┐
│ Existing Book OR Thin Metadata?         │
├─────────────────────────────────────────┤
│ YES → Deep Web Search (thorough)       │
│ NO  → Metadata Analysis (fast)         │
│      └─ If no warnings → Double check   │
│         with web search                 │
└─────────────────────────────────────────┘
```

### 4. **Stale Warning Detection**
```
Existing warnings found
    ↓
Check audit log for model_version/taxonomy_version
    ↓
If version mismatch → Delete old warnings
    ↓
Regenerate with current model/taxonomy
```

## Database Tables Involved

1. **books** - Core book metadata
2. **scans** - Tracks all ISBN scans
3. **content_warnings** - Generated warnings
4. **ai_audit_logs** - AI decision tracking
5. **ambiguous_scans** - Multiple candidate results

## External APIs Called

1. **Open Library API** - Free book metadata
2. **Google Books API** - High-quality metadata & covers
3. **DuckDuckGo API** - Web search fallback
4. **Apple Books API** - Additional metadata source
5. **Author Sites** - Direct scraping (Hannah Grace, H.D. Carlton, etc.)

## AI Agent Tools

1. **webSearchTool** - Performs multi-source web search
2. **submit_findings** - Returns book + warnings (findBookAndGenerateWarnings)
3. **submit_warnings** - Returns warnings only (generateContentWarnings)

## Progress Messages (Streamed)

- "Validating ISBN and checking local database..."
- "Book not found locally. Fetching metadata from external libraries..."
- "Found {N} possible matches. Please select the correct book."
- "Metadata found is insufficient. Initiating deep AI web search..."
- "AI found book: '{title}'. Analyzing content..."
- "Analyzing book content with AI..."
- "Generated {N} content warnings via AI."
- "Saving {N} warnings to database..."

## Error Handling

- Invalid ISBN → 400 Error
- Database errors → Logged, thrown
- API failures → Fallback to next source
- AI failures → Logged, return empty warnings with low confidence
- Network timeouts → 10s timeout on web searches








