# Content Warning System: Main Building Blocks

## Overview
When a book gets scanned, content warnings are generated through a multi-stage AI-powered pipeline. Here are the **7 main building blocks**:

---

## 1. **Book Metadata Collection** 📚
**Purpose**: Gather basic book information (title, author, description, categories)

**Components**:
- **External APIs**: Google Books, Open Library, Apple Books
- **ISBN Lookup**: Normalize and validate ISBN format
- **Metadata Extraction**: Title, author, description, categories, cover URL

**Output**: Book metadata object with description and categories

**Key Files**:
- `lib/book-api.ts` - Fetches from external APIs
- `lib/services/scan-service.ts` - Orchestrates metadata collection

---

## 2. **Taxonomy System** 🏷️
**Purpose**: Define what warnings can exist (the "vocabulary" of warnings)

**Components**:
- **Hierarchical Structure**: Categories → Subcategories
- **Default Severities**: Each subcategory has a default (mild/moderate/severe)
- **Validation**: Ensures warnings map to valid taxonomy items

**Example Structure**:
```
violence (Category)
  ├── graphic_violence (Subcategory, default: severe)
  ├── physical_violence (Subcategory, default: moderate)
  └── threats_danger (Subcategory, default: mild)
```

**Key Files**:
- `lib/config/taxonomy-v2.ts` - Complete taxonomy definition
- Contains 100+ subcategories across 10+ categories

**Output**: Valid category/subcategory IDs that warnings must use

---

## 3. **Web Search & Information Gathering** 🔍
**Purpose**: Find additional context when description is thin or missing

**Components**:
- **Google Books API**: Book descriptions, categories
- **Apple Books API**: Ebook metadata
- **DuckDuckGo**: General web search for reviews/content warnings
- **Author Site Scraping**: Direct scraping of author websites (H.D. Carlton, etc.)

**When Triggered**:
- Description < 150 characters
- Book not found in external APIs
- Force refresh requested

**Key Files**:
- `lib/content-warning-agent.ts` - `performWebSearch()` function
- Searches in parallel for speed

**Output**: Enriched book information (description, reviews, author notes)

---

## 4. **AI Content Warning Agent** 🤖
**Purpose**: Analyze book content and generate warnings with scores

**Components**:
- **Model**: GPT-4o (primary) or Gemini (secondary)
- **Instructions**: Hybrid mode (evidence-based + genre-aware inference)
- **Output Schema**: Structured warnings with:
  - `category_id` + `subcategory_id` (from taxonomy)
  - `score` (0.0-1.0, confidence in warning)
  - `description` (human-readable warning text)
  - `presence` (on_page, off_page, flashback, referenced, implied)
  - `detail_level` (graphic, moderate, vague, clinical)
  - `reasoning` (source citation, e.g., "Book description states...")
  - `source_url` (author site, review page - NOT cover images)

**Key Process**:
1. Receives book metadata + web search results
2. Analyzes content using AI
3. Maps findings to taxonomy categories/subcategories
4. Assigns scores (0.0-1.0) based on evidence strength
5. Generates reasoning with source citations

**Key Files**:
- `lib/content-warning-agent.ts` - Main agent logic
- `getHybridInstructions()` - AI prompt instructions

**Output**: Array of warnings with scores (not yet classified by severity)

---

## 5. **Severity Classification Agent** ⚖️
**Purpose**: Convert numerical scores (0.0-1.0) into severity levels (mild/moderate/severe)

**Components**:
- **Context-Aware Analysis**: Considers multiple factors:
  - Score (0.0-1.0 from content agent)
  - Presence (on_page vs referenced)
  - Detail level (graphic vs vague)
  - Narrative centrality (central vs background)
  - Frequency (repeated vs single)
  - Genre context
  - Book description

**Why Not Just Use Score Thresholds?**
- Score of 0.6 could be "severe" if it's graphic and central to plot
- Score of 0.8 could be "moderate" if it's vague and brief
- Context matters more than raw numbers

**Key Files**:
- `lib/services/severity-classification-agent.ts`
- Uses GPT-4o with specialized classification prompt

**Output**: Severity level (mild/moderate/severe) for each warning

---

## 6. **Multi-Model Analysis** 🔄
**Purpose**: Run multiple AI models in parallel and combine results for better coverage

**Components**:
- **Parallel Execution**: GPT-4o and Gemini run simultaneously
- **Error Handling**: If one fails, other continues
- **Result Combination**:
  - **MAX Severity Logic**: Uses highest score when both models find same warning (safety-first)
  - **Unique Findings**: Includes warnings only one model found
  - **Confidence Logic**: Uses confidence of model(s) that found warnings
  - **Subcategory Validation**: Ensures all warnings map to valid taxonomy

**Why Multi-Model?**
- GPT-4o might find sexual content, Gemini might find violence
- Combining gives more comprehensive coverage
- Agreement/disagreement analysis shows reliability

**Key Files**:
- `lib/services/multi-model-service.ts`
- `runMultiModelAnalysis()` - Orchestrates parallel execution
- `combineWarnings()` - Merges results with MAX logic

**Output**: Combined warnings with model agreement analysis

---

## 7. **Database Storage & Validation** 💾
**Purpose**: Save warnings to database with data integrity checks

**Components**:
- **Subcategory Validation**: Ensures warning maps to valid taxonomy item
- **Cover URL Filtering**: Removes cover image URLs from source_url (only content pages allowed)
- **Severity Mapping**: Stores final severity (mild/moderate/severe)
- **Audit Logging**: Records model version, taxonomy version, generation timestamp

**Database Schema**:
```sql
content_warnings (
  book_id,
  category_id,
  subcategory_id,  -- Validated against taxonomy
  severity,        -- mild/moderate/severe (from classification agent)
  confidence_score, -- 0.0-1.0 (from content agent)
  description,
  reasoning,       -- Source citations
  source_url,      -- Filtered (no cover images)
  presence,
  detail_level,
  is_author_verified,
  ...
)
```

**Key Files**:
- `lib/services/scan-service.ts` - Database insertion logic
- `app/api/scan-multi-model/route.ts` - Multi-model API endpoint
- `validateSubcategory()` - Ensures taxonomy compliance

**Output**: Warnings saved to database, ready for display

---

## Complete Flow Diagram

```
User Enters ISBN
    ↓
1. Book Metadata Collection
    ├─→ External APIs (Google Books, Open Library)
    └─→ Extract: title, author, description, categories
    ↓
2. Taxonomy System (Reference)
    └─→ Valid category/subcategory IDs available
    ↓
3. Web Search (if needed)
    ├─→ Description < 150 chars? → Trigger web search
    ├─→ Google Books, Apple Books, DuckDuckGo
    └─→ Author site scraping
    ↓
4. AI Content Warning Agent
    ├─→ GPT-4o: Analyze content → Generate warnings with scores
    └─→ Gemini: Analyze content → Generate warnings with scores
    ↓
5. Severity Classification Agent
    └─→ Convert scores → Severity levels (mild/moderate/severe)
    ↓
6. Multi-Model Analysis
    ├─→ Combine warnings (MAX severity logic)
    ├─→ Include unique findings
    └─→ Analyze model agreement
    ↓
7. Database Storage & Validation
    ├─→ Validate subcategories
    ├─→ Filter cover URLs from source_url
    └─→ Save to database
    ↓
Display Warnings to User
```

---

## Key Design Principles

### 1. **Safety-First**
- MAX severity logic: If one model finds severe content, warn about it
- Better to over-warn than under-warn

### 2. **Evidence-Based**
- Reasoning must cite sources ("Book description states...")
- No generalizations from author reputation
- Transparent when information is missing

### 3. **Taxonomy as Source of Truth**
- All warnings must map to valid taxonomy items
- Subcategory validation ensures data integrity
- Display names come from taxonomy, not AI

### 4. **Multi-Model Redundancy**
- Parallel execution for speed
- Error handling: one failure doesn't break everything
- Agreement analysis shows confidence

### 5. **Context-Aware Classification**
- Severity based on multiple factors, not just score
- Graphic + central = severe, even with lower score
- Vague + brief = mild, even with higher score

---

## Example: How "Does It Hurt?" Gets Warnings

1. **Metadata**: ISBN 9781957635026 → Title: "Does It Hurt?", Author: "H. D. Carlton", Description: null
2. **Web Search**: Description missing → Search Google Books, Apple Books → Find description
3. **AI Agent (GPT-4o)**: Analyzes description → Finds "sexual violence" (score: 0.9), "graphic violence" (score: 0.85)
4. **AI Agent (Gemini)**: Analyzes description → Finds "psychological distress" (score: 0.85)
5. **Classification Agent**: 
   - sexual violence (0.9) + graphic + on_page → **severe**
   - graphic violence (0.85) + graphic + on_page → **severe**
   - psychological distress (0.85) + moderate + on_page → **severe**
6. **Multi-Model**: Combine → Use MAX scores, include all unique findings
7. **Database**: Save with validated subcategories, filtered source URLs
8. **Display**: Show warnings with severity chips, reasoning, and source citations

---

## Files Reference

| Component | Key Files |
|-----------|-----------|
| Metadata Collection | `lib/book-api.ts`, `lib/services/scan-service.ts` |
| Taxonomy | `lib/config/taxonomy-v2.ts` |
| Web Search | `lib/content-warning-agent.ts` (performWebSearch) |
| Content Agent | `lib/content-warning-agent.ts` (findBookAndGenerateWarnings) |
| Classification Agent | `lib/services/severity-classification-agent.ts` |
| Multi-Model | `lib/services/multi-model-service.ts` |
| Database | `lib/services/scan-service.ts`, `app/api/scan-multi-model/route.ts` |

