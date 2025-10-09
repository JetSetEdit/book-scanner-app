# Current ISBN Lookup Flow

## Current Architecture Flowchart

```mermaid
flowchart TD
    A[User Scans ISBN] --> B[Validate ISBN Format]
    B --> C{Valid ISBN?}
    C -->|No| D[Return Error: Invalid ISBN]
    C -->|Yes| E[Clean ISBN - Remove hyphens/spaces]
    
    E --> F[Check Database by Exact ISBN]
    F --> G{Book exists in DB?}
    
    G -->|Yes| H[Use Existing Book ID]
    G -->|No| I[Try External APIs]
    
    I --> J[Open Library API]
    J --> K{Found in Open Library?}
    K -->|Yes| L[Create Book Record with Open Library Data]
    K -->|No| M[Try Google Books API]
    
    M --> N{Found in Google Books?}
    N -->|Yes| O[Create Book Record with Google Books Data]
    N -->|No| P[Create Minimal Book Record]
    
    P --> Q[AI Agent Web Search]
    Q --> R{AI Found Book Info?}
    R -->|Yes| S[Update Book Record with AI Data]
    R -->|No| T[Keep Minimal Record]
    
    L --> U[Check for Content Warnings]
    O --> U
    S --> U
    T --> U
    H --> U
    
    U --> V{Has Content Warnings?}
    V -->|Yes| W[Return Success - No AI Needed]
    V -->|No| X[AI Agent Generate Warnings]
    
    X --> Y[Insert Generated Warnings]
    Y --> W
    W --> Z[Return Book + Scan Data]
    
    style D fill:#ffcccc
    style P fill:#fff2cc
    style T fill:#fff2cc
    style Q fill:#e1f5fe
    style X fill:#e1f5fe
```

## Key Issues with Current Flow

### ❌ **Single ISBN Limitation**
- Only checks exact ISBN match in database
- No support for multiple ISBNs per book
- No cross-reference between different editions

### ❌ **No Deduplication**
- Same book with different ISBNs creates separate records
- No fuzzy matching by title/author
- Duplicate content warnings possible

### ❌ **External API Dependency**
- If external APIs don't have the ISBN, we create minimal records
- No fallback to search by title/author
- AI agent only runs when external APIs fail

### ❌ **No ISBN Relationship Tracking**
- Can't link related ISBNs (hardcover vs paperback)
- No way to find alternative ISBNs for same book
- No ISBN history or versioning

## Example Problem Scenarios

### Scenario 1: Same Book, Different Editions
```
ISBN 978-0-06-112008-4 → To Kill a Mockingbird (Paperback)
ISBN 978-0-06-112008-5 → To Kill a Mockingbird (Hardcover)
Result: Two separate book records in database
```

### Scenario 2: ISBN Not in External APIs
```
ISBN 978-1234567890 → Not found in Open Library/Google Books
Result: Minimal record created, AI agent tries to find info
```

### Scenario 3: User Scans Different ISBN for Same Book
```
Database has: ISBN 978-0-06-112008-4 (To Kill a Mockingbird)
User scans: ISBN 978-0-06-112008-5 (Same book, different edition)
Result: New book record created instead of linking to existing
```

## Current Database Schema
```sql
books table:
- id (UUID, Primary Key)
- isbn (VARCHAR(13), UNIQUE) ← Only one ISBN per book
- title, author, cover_url, etc.
- No support for multiple ISBNs
- No ISBN relationships
```

