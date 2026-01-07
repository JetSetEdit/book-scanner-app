# Technical Overview: Subtext Book Scanner Application

**For Senior Code Review**  
**Version:** 1.01.57  
**Date:** 2026-01-07

---

## Executive Summary

**Subtext** is a Next.js-based web application that analyzes books to generate content warnings and age ratings using multi-model AI analysis. Users scan book ISBNs/barcodes to receive detailed content warnings, age-appropriate ratings (aligned with Australian Classification Board standards), and thematic analysis.

**Core Value Proposition:** Help readers make informed choices about books by revealing potentially triggering or age-inappropriate content before reading.

---

## Architecture Overview

### Tech Stack

- **Framework:** Next.js 16.0.7 (App Router, React Server Components)
- **Language:** TypeScript 5
- **Database:** Supabase (PostgreSQL) with Row Level Security
- **AI Models:**
  - Primary: OpenAI GPT-5.2 (`gpt-5.2-2025-12-11`)
  - Cross-validation: Google Gemini (`gemini-2.5-flash`, `gemini-3-flash`, `gemini-2.0-flash`)
- **Deployment:** Vercel (serverless functions)
- **UI:** Tailwind CSS 4, Radix UI components, shadcn/ui
- **State Management:** React hooks, local storage for preferences
- **PWA:** Service worker, offline support, installable

### Application Structure

```
app/
├── api/              # API routes (Next.js route handlers)
├── book/[isbn]/      # Dynamic book detail pages
├── scan/             # ISBN/barcode scanning interface
├── collection/       # User's scanned books collection
└── page.tsx          # Landing page

lib/
├── services/         # Core business logic
│   ├── scan-service.ts           # Main scan orchestration
│   ├── multi-model-analysis.ts   # AI analysis coordination
│   ├── adversarial-validation.ts # Model cross-critique
│   └── web-search-enrichment.ts  # Community source enrichment
├── config/           # Configuration & taxonomies
│   ├── taxonomy-v2.ts            # Content warning taxonomy (v2.5.0)
│   ├── age-escalation-weights.ts # Age rating weights
│   └── taxonomy-context.ts       # Type definitions
└── utils/            # Utility functions
    ├── age-rating.ts            # Australian Classification Board logic
    ├── severity-computation.ts  # Severity signal computation
    └── rate-limiter.ts          # In-memory rate limiting

components/           # React components
supabase/             # Database migrations
scripts/              # Utility scripts (142 files)
```

---

## Core Features

### 1. Book Scanning & Analysis

**User Flow:**
1. User scans ISBN/barcode or enters ISBN manually
2. System checks database for existing book
3. If new: Fetches metadata from Google Books API / Open Library
4. Runs multi-model AI analysis (OpenAI + Gemini in parallel)
5. Generates content warnings with severity levels
6. Calculates age rating (G, PG, M, MA15+, R18+, RC)
7. Displays results with reasoning

**Key Components:**
- `lib/services/scan-service.ts` - Orchestrates entire scan pipeline
- `lib/services/multi-model-analysis.ts` - Coordinates AI analysis
- `app/api/scan/route.ts` - API endpoint with rate limiting

### 2. Multi-Model AI Analysis

**Architecture:**
- **Parallel Execution:** OpenAI and Gemini analyze simultaneously
- **Cross-Validation:** Models verify each other's unique warnings
- **Adversarial Validation:** Models critique each other's warnings (too restrictive/lenient)
- **Agreement Scoring:** Measures consensus between models

**Process:**
```
1. OpenAI Analysis → Warnings A
2. Gemini Analysis → Warnings B (parallel)
3. Combine Results → Merge overlapping, track unique
4. Adversarial Debate → Models critique each other
5. Verification → Unique warnings verified by opposite model
6. Final Warnings → Refined based on critiques
```

**Key Innovation:** Adversarial validation where models debate each other's assessments improves accuracy by catching:
- Over-warnings (too restrictive)
- Missed warnings (too lenient)
- Severity disagreements

### 3. Content Warning Taxonomy (v2.5.0)

**Hierarchical Structure:**
- **8 Parent Categories:** Mental Health, Sexual Content, Violence, Abuse, Substance Use, Death/Grief, Discrimination, Other
- **50+ Subcategories:** Specific warning types (e.g., `sexual_content.explicit_sexual_content`)
- **Contextual Metadata:**
  - Presence: `on_page`, `off_page`, `flashback`, `referenced`, `implied`
  - Detail Level: `graphic`, `moderate`, `vague`, `clinical`
  - Context Modifiers: `historical_context`, `condemned_by_narrative`, `educational_or_analytical`, etc.

**Severity Computation:**
- **Signal-Based:** Computes severity from signals (frequency, explicitness, proximity, centrality, intensity_markers)
- **Not Static:** Severity is computed, not hardcoded
- **Formula:** `baseScore = (frequency × 0.3) + (explicitness × 0.4)` with multipliers for proximity, centrality, and intensity markers

### 4. Age Rating System

**Australian Classification Board Alignment:**
- Ratings: G, PG, M, MA15+, R18+, RC
- Based on official guidelines (F2008C00129, F2013C00006)

**Impact Score Calculation:**
```
Impact = Raw Severity Score × Escalation Weight × Presentation Multiplier
```

**Components:**
1. **Raw Severity Score (0-1):** Recovered from `severity_signals` (preserves gradient lost in mild/moderate/severe bucketing)
2. **Escalation Weight (0-1):** Category-specific weight (e.g., sexual violence = 0.9, mental health = 0.4)
3. **Presentation Multiplier (0.7-1.3):** Based on detail level and presence (graphic + on-page = higher multiplier)

**Rating Logic:**
- **RC:** Extreme content types OR 3+ severe warnings with explicitness ≥ 0.9 AND impact ≥ 0.8
- **R18+:** Explicit sexual content flag OR sexual violence OR impact ≥ 0.7
- **MA15+:** Impact ≥ 0.3 (fallback for moderate+ warnings)
- **M:** Impact ≥ 0.1
- **PG:** Impact < 0.1
- **G:** No warnings

**Explicit Content Detection:**
- Internal semantic flag: `isExplicitOnPageSexualContent`
- Criteria: `proximity ≥ 0.9` AND `explicitness ≥ 0.6` AND `frequency ≥ 0.35`
- Upgrades `intense_romance` to `explicit_sexual_content` if signals indicate on-page explicit content

### 5. Rate Limiting

**Implementation:**
- In-memory rate limiting (5 scans per IP per day)
- Resets at midnight in user's timezone
- Client sends timezone, server calculates reset time
- Graceful degradation: Rate limit errors don't crash analysis

**User Feedback:**
- Rate limit feedback dialog
- General feedback system
- Analysis request queue for books without warnings

### 6. Web Search Enrichment

**Purpose:** Enhance thin metadata with community-sourced content warnings

**TOS Compliance:**
- Explicitly avoids retailer content (Amazon, QBD, etc.)
- Uses safe sources: Open Library, library catalogs, community sites (The StoryGraph, Romance.io)
- Prioritizes content warnings from community sources

**Trigger Conditions:**
- Description < 200 characters OR
- Narrative excerpt detected (opening lines, not plot summary) OR
- ≤ 2 warnings found (may indicate sanitized description)

### 7. Dev Mode Features

**Localhost-Only Indicators:**
- Model source badges (GPT/GEM/BOTH) showing which AI model generated each warning
- AI reasoning display when no warnings are found
- Audit trail visibility
- Debug information

---

## Data Model

### Core Tables

**`books`**
- ISBN (primary key), title, author, description
- Cover URL, metadata (JSONB)
- Age rating, categories
- Review workflow fields

**`content_warnings`**
- Hierarchical taxonomy: `category_id`, `subcategory_id`
- Severity: `mild`, `moderate`, `severe`
- Context: `presence`, `detail_level`, `context_modifiers` (JSONB)
- Signals: `severity_signals` (JSONB) - frequency, explicitness, proximity, centrality, intensity_markers
- Evidence: `evidence` (JSONB) - source, location, excerpt, confidence
- Source: `ai_generated`, `user_submitted`, `author_approved`
- Model tracking: `model_source` in evidence JSONB (dev mode)

**`ai_audit_logs`**
- Decision tracking: `warnings_generated`, `no_warnings`, `search_performed`, `metadata_thin`
- AI reasoning, confidence levels
- Model version, taxonomy version tracking
- Pipeline path tracking

**`scans`**
- Scan history tracking
- Links to books and users

**`manual_handling_scans`**
- Analysis requests
- User feedback
- Rate limit feedback

### Relationships

```
books (1) ──< (many) content_warnings
books (1) ──< (many) ai_audit_logs
books (1) ──< (many) scans
```

---

## AI/ML Implementation

### Multi-Model Analysis Pipeline

**1. Parallel Analysis**
```typescript
const [openaiResult, geminiResult] = await Promise.allSettled([
  analyzeWithOpenAI(metadata, onProgress, model),
  analyzeWithGemini(metadata, onProgress)
])
```

**2. Result Combination**
- Merges overlapping warnings (same subcategory)
- Tracks unique warnings (found by only one model)
- Calculates agreement score

**3. Adversarial Validation**
- OpenAI critiques Gemini's warnings
- Gemini critiques OpenAI's warnings
- Each provides: critique type, reasoning, suggested action, confidence
- High-confidence critiques (≥ 0.7) remove warnings
- Medium-confidence critiques (≥ 0.6) adjust severity

**4. Verification**
- Unique warnings verified by opposite model
- 10-second timeout per verification
- Metrics tracked: kept, dropped, adjusted

**5. Web Search Enrichment (Conditional)**
- Triggers if ≤ 2 warnings found
- Searches community sources for content warnings
- Re-analyzes with enriched description

### Prompt Engineering

**Taxonomy Context:**
- Full taxonomy structure included in prompts
- Subcategory descriptions and default severity hints
- Decision rubrics for ambiguous cases (e.g., explicit_sexual_content vs intense_romance)

**TOS Compliance:**
- Explicit instructions to avoid retailer content
- Lists safe sources
- Prioritizes content warnings from community sites

**Output Format:**
- Structured JSON with evidence spans
- Confidence scores
- Reasoning for each warning

### Error Handling

**Graceful Degradation:**
- Gemini failures are non-fatal (continue with OpenAI only)
- Rate limit errors propagate (don't treat as "no warnings")
- Verification timeouts fall back to original warnings
- Invalid signals use default values

**Safety Checks:**
- Validates signals object before use
- Rebuilds signals if malformed
- Comprehensive null/undefined checks

---

## Quality Assurance

### Testing Strategy

**1. Diagnostic Scripts:**
- `scripts/diagnostic-age-rating.ts` - Shows top 5 impacts per book
- `scripts/test-age-escalation.ts` - Tests age rating logic
- `scripts/check-book-warnings.ts` - Validates warning structure

**2. Model Testing:**
- `scripts/test-all-gpt5-models.ts` - Tests all GPT-5 variants
- `scripts/generate-gpt5-test-report.ts` - Generates comparison reports

**3. Persona Testing:**
- Test cases for specific user personas (e.g., "Sarah Chen" - trauma survivor)
- Validates accuracy for sensitive use cases

### Monitoring

**Audit Logs:**
- Every analysis decision logged
- Tracks model version, taxonomy version, pipeline path
- Confidence levels and reasoning stored

**Metrics:**
- Agreement scores between models
- Verification metrics (kept/dropped/adjusted)
- Adversarial validation critiques
- Timing breakdowns (DB lookup, AI analysis, etc.)

---

## Security & Privacy

### Row Level Security (RLS)
- Anonymous read access to books and warnings
- User-specific data (scans, validations) scoped to user
- Admin-only endpoints for management

### Rate Limiting
- 5 scans per IP per day
- Prevents abuse and cost overruns
- User feedback mechanism for legitimate use cases

### API Key Management
- Environment variables for API keys
- Service role key only on server-side
- No keys exposed to client

### TOS Compliance
- Explicit avoidance of retailer content
- Safe source whitelist
- Community data treated as public (The StoryGraph, Romance.io)

---

## Performance Considerations

### Caching Strategy
- Database lookup first (existing books)
- Early return if book analyzed (unless `forceRefresh`)
- Stale data refresh in background (>30 days)

### Parallel Processing
- OpenAI and Gemini run in parallel
- Adversarial validation runs in parallel
- Web search enrichment async

### Timeouts
- Verification: 10 seconds
- Web search: 30 seconds
- Overall scan: ~60-70 seconds typical

### Database Optimization
- Indexes on ISBN, book_id, subcategory_id
- JSONB indexes on evidence, severity_signals
- Efficient queries with proper joins

---

## Known Issues & Technical Debt

### Current Issues

1. **Verification Timeout:**
   - 10-second timeout sometimes too short
   - Falls back to original warnings (non-fatal)
   - **Impact:** Some unique warnings not verified

2. **TypeError in updateReasoningForSeverity:**
   - Fixed with comprehensive safety checks
   - May still occur if signals object is malformed
   - **Status:** Fixed in v1.01.57

3. **Model Source Tracking:**
   - Stored in evidence JSONB (not ideal)
   - Should be separate column for production
   - **Impact:** Dev mode only feature

### Technical Debt

1. **Legacy Code:**
   - `lib/content-warning-agent.ts` (1261 lines) - Old agent-based approach
   - `lib/content-warning-agent-v2.ts` - Intermediate version
   - **Status:** Kept for reference, not used in production

2. **Scripts Directory:**
   - 142 files in `scripts/` directory
   - Mix of utilities, tests, one-offs
   - **Recommendation:** Organize into subdirectories

3. **Type Safety:**
   - Some `any` types in database queries
   - Supabase types generated but not fully utilized
   - **Recommendation:** Strengthen type safety

4. **Error Handling:**
   - Some errors logged but not surfaced to user
   - Inconsistent error handling patterns
   - **Recommendation:** Standardize error handling

---

## Deployment & Operations

### Vercel Deployment
- Automatic deployment on push to `main`
- Environment variables managed in Vercel dashboard
- Custom domain support

### Database Migrations
- Supabase migrations in `supabase/migrations/`
- 18 migration files
- Applied via Supabase dashboard or API

### Version Management
- Auto-incrementing version on commit
- Version stored in `lib/config/version.ts`
- Build date tracking

### Monitoring
- Vercel Analytics
- Supabase logs
- Console logging for debugging

---

## Future Considerations

### Scalability
- **Current:** In-memory rate limiting (single instance)
- **Future:** Redis-based rate limiting for multi-instance
- **Current:** Sequential scan processing
- **Future:** Queue-based processing for high volume

### Model Improvements
- Fine-tuning on book-specific data
- Specialized models for different genres
- Continuous learning from user feedback

### Feature Roadmap
- User accounts and personal libraries
- Community-sourced warnings
- Author verification workflow
- Mobile app (React Native)

---

## Code Quality Highlights

### Strengths

1. **Type Safety:** TypeScript throughout, comprehensive interfaces
2. **Modularity:** Clear separation of concerns (services, utils, config)
3. **Documentation:** Extensive inline comments, design docs
4. **Error Handling:** Graceful degradation, comprehensive safety checks
5. **Testing:** Diagnostic scripts, model testing, persona testing
6. **Innovation:** Adversarial validation is novel approach to AI accuracy

### Areas for Improvement

1. **Test Coverage:** No automated unit tests (only manual scripts)
2. **Error Boundaries:** React error boundaries not implemented
3. **Logging:** Inconsistent logging levels and formats
4. **Performance:** Some sequential operations could be parallelized
5. **Accessibility:** Some components may need ARIA improvements

---

## Key Design Decisions

### 1. Multi-Model Approach
**Decision:** Use both OpenAI and Gemini in parallel  
**Rationale:** Cross-validation improves accuracy, catches model-specific biases  
**Trade-off:** Higher cost, longer latency, but better results

### 2. Adversarial Validation
**Decision:** Models critique each other's warnings  
**Rationale:** Catches over-warnings and missed warnings through debate  
**Trade-off:** Additional API calls, but significantly improves accuracy

### 3. Signal-Based Severity
**Decision:** Compute severity from signals, not static labels  
**Rationale:** More nuanced, explainable, consistent across books  
**Trade-off:** More complex, but more accurate

### 4. Impact Score for Age Ratings
**Decision:** Use `Impact = Severity × Escalation × Presentation`  
**Rationale:** More nuanced than "any SEVERE = MA15+"  
**Trade-off:** More complex logic, but more accurate ratings

### 5. Raw Severity Score Recovery
**Decision:** Recompute raw score from signals instead of using bucket  
**Rationale:** Preserves gradient lost in mild/moderate/severe bucketing  
**Trade-off:** Additional computation, but more accurate impact calculation

---

## Conclusion

This is a **production-ready application** with sophisticated AI analysis, comprehensive content warning taxonomy, and thoughtful user experience. The multi-model adversarial validation approach is innovative and improves accuracy significantly.

**Key Strengths:**
- Robust error handling and graceful degradation
- Comprehensive safety checks
- Transparent reasoning and audit trails
- TOS-compliant implementation
- Dev mode features for debugging

**Recommendations for Review:**
1. Focus on `lib/services/scan-service.ts` and `lib/services/multi-model-analysis.ts` as core logic
2. Review `lib/utils/age-rating.ts` for age rating algorithm correctness
3. Check `lib/services/adversarial-validation.ts` for adversarial logic
4. Validate error handling in all API routes
5. Review database schema and migrations for consistency

**Overall Assessment:** Well-architected, production-ready codebase with innovative AI techniques and strong attention to user safety and TOS compliance.

