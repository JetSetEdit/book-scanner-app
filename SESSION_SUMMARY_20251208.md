# Session Summary - December 8, 2025

## Overview
This session focused on implementing and refining a hybrid AI agent approach for content warning generation, combining evidence-based analysis with conservative inference. We also created a dev-only comparison tool to test different agent instruction sets side-by-side.

## Major Accomplishments

### 1. Hybrid AI Agent Implementation
**Problem:** The AI was making assumptions about book content based on author reputation or genre (e.g., marking books as having sexual content just because the author writes romance).

**Solution:** Implemented a three-phase hybrid approach:
- **Phase 1: Evidence-Based Analysis** - Prioritizes verified sources (Author/Publisher > Professional Reviews > User Consensus)
- **Phase 2: Inference-Based Analysis** - Uses conservative, genre-aware inference only when verified info is insufficient
- **Phase 3: False Positive Checks** - Prevents common misclassifications (Death ≠ Grief, Action ≠ Violence)

**Files Modified:**
- `lib/content-warning-agent.ts` - Added `getHybridInstructions()`, `getOldInstructions()`, `getNewInstructions()` functions
- Updated `getBaseAgentConfig()` to accept `instructionMode: 'old' | 'new' | 'hybrid'`
- Updated `findBookAndGenerateWarnings()` and `generateContentWarnings()` to accept `instructionMode` parameter
- Hybrid mode is now the default (`instructionMode: 'hybrid'`)

**Key Features of Hybrid Mode:**
- **Source Reliability Hierarchy**: Author/Publisher (Gold Standard) > Professional Reviews > User Consensus
- **Conflict Resolution**: If author says "clean" but >70% user reviews cite graphic trigger, flag as Verified (User Consensus)
- **Genre-Specific Inference Rules**: 
  - Romance: Don't infer explicit sex unless "Steamy", "Spice", or "Erotica" indicated
  - Thriller/Mystery: Don't infer graphic gore unless "Horror", "Slasher", or "Dark" indicated
- **False Positive Prevention**: Death ≠ Grief, Action ≠ Violence, Non-Fiction uses clinical detail level
- **Structured Reasoning Format**: Includes `evidence_type`, `sources_checked`, `key_evidence`, `conflict_resolution`, `confidence_rationale`

### 2. Agent Comparison Tool
**Created:** `app/dev/agent-comparison/page.tsx` - Dev-only UI for comparing agent outputs

**Features:**
- Side-by-side comparison of three agent modes:
  - **OLD**: Assumption-based (original)
  - **NEW**: Evidence-based (strict, no assumptions)
  - **PROD**: Hybrid (current production default)
- Sequential execution option to prevent rate limits (default: enabled)
- Toggle to include/exclude hybrid mode
- Visual distinction: Orange border (old), Green border (new), Blue border (hybrid)
- Comparison summary showing warning counts and confidence levels
- Error handling for rate limits (429 errors)

**API Endpoint:** `app/api/dev/scan-with-agent/route.ts`
- Accepts `isbn` and `agentType` ('assumption-based' | 'evidence-based' | 'hybrid')
- Calls `processIsbnScan` with appropriate `instructionMode`
- Returns book, warnings, reasoning, and confidence without saving to DB

### 3. Bug Fixes
**Fixed:** `ReferenceError: hybrid is not defined` in `ComparisonSummary` component
- Updated function signature to accept `hybrid?: AgentResult` as optional parameter
- Ensured hybrid results display correctly when available

**Fixed:** Rate limit handling
- Added sequential execution with 2-second delay between scans
- Improved error messages in UI
- Added checkbox to toggle sequential vs parallel execution

## Technical Details

### Instruction Modes
The system now supports three instruction sets:

1. **OLD (`'old'`)**: Assumption-based
   - Makes inferences based on genre conventions
   - Higher false positive rate
   - Faster (fewer web searches)

2. **NEW (`'new'`)**: Evidence-based
   - Strict "NO ASSUMPTIONS" rule
   - Only generates warnings from verified information
   - Lower false positive rate but may miss some warnings

3. **HYBRID (`'hybrid'`)**: Current production default
   - Evidence-first approach
   - Conservative inference when needed
   - Best balance of accuracy and coverage
   - Clear labeling of "verified" vs "inferred" warnings

### System Prompt Enhancements
The hybrid instructions include:
- **ACB-aligned Scoring**: Precise severity ranges (0.0-0.30: G, 0.31-0.55: PG, etc.)
- **Source Reliability Hierarchy**: Explicit priority order
- **Conflict Resolution**: Logic for when sources disagree
- **False Positive Logic**: Rules to prevent misclassifications
- **Genre-Specific Rules**: Constraints for Romance and Thriller/Mystery
- **Structured Reasoning**: Required format for transparency

### Database Schema
No schema changes in this session. The hierarchical taxonomy and new metadata fields (subcategory_id, presence, detail_level, is_spoiler, requires_mediation, has_indigenous_deceased) were added in a previous session.

## Current State

### Production
- ✅ Hybrid agent is the default mode
- ✅ All previous features intact
- ✅ Custom domain: https://subtext-books.vercel.app

### Development
- ✅ Agent comparison tool available at `/dev/agent-comparison`
- ✅ Dev-only access (checks for localhost/127.0.0.1)
- ✅ Sequential execution prevents rate limits

## Important Notes for Next Agent

### 1. Agent Comparison Tool Usage
- Access at `/dev/agent-comparison` (dev mode only)
- Use sequential execution to avoid rate limits
- Can test with same ISBN multiple times (hybrid wasn't run before)
- Results show side-by-side comparison with visual distinction

### 2. Hybrid Mode is Default
- `lib/services/scan-service.ts` calls agent with `instructionMode: 'hybrid'` by default
- To use old/new modes, pass `instructionMode` parameter explicitly
- The comparison tool allows testing all three modes without changing production code

### 3. Rate Limit Handling
- OpenAI rate limit: 30,000 tokens per minute for GPT-4o
- Sequential execution with 2-second delay recommended for comparison tool
- Error handling displays clear messages when rate limits are hit

### 4. Instruction Mode Flow
```
User/API Request
  ↓
processIsbnScan(instructionMode: 'hybrid')
  ↓
findBookAndGenerateWarnings(instructionMode)
  ↓
generateContentWarnings(instructionMode)
  ↓
getBaseAgentConfig(instructionMode)
  ↓
getHybridInstructions() / getOldInstructions() / getNewInstructions()
  ↓
AI Agent with appropriate instructions
```

## Files Modified This Session

1. **`lib/content-warning-agent.ts`**
   - Added `getHybridInstructions()`, `getOldInstructions()`, `getNewInstructions()`
   - Updated `getBaseAgentConfig()` to accept `instructionMode`
   - Updated function signatures to pass `instructionMode` through

2. **`lib/services/scan-service.ts`**
   - Updated to pass `instructionMode: 'hybrid'` to agent functions (default)

3. **`app/api/dev/scan-with-agent/route.ts`**
   - New API endpoint for agent comparison
   - Maps `agentType` to `instructionMode`
   - Returns results without saving to DB

4. **`app/dev/agent-comparison/page.tsx`**
   - New dev-only comparison UI
   - Three-column layout for old/new/hybrid results
   - Sequential execution option
   - Error handling and rate limit messages

5. **`components/navbar.tsx`**
   - Added link to agent comparison tool in Dev Settings dropdown

## Testing Recommendations

1. **Test Hybrid Mode**: Use the comparison tool with various ISBNs to verify hybrid mode balances accuracy and coverage
2. **Rate Limit Testing**: Test with sequential execution disabled to verify error handling
3. **False Positive Checks**: Test books that might trigger false positives (e.g., action books, non-fiction)
4. **Genre-Specific Rules**: Test Romance and Thriller/Mystery books to verify inference rules work

## Next Steps / Recommendations

1. **Monitor Production**: Watch for any issues with hybrid mode in production
2. **Gather Feedback**: Compare hybrid results with old/new modes to validate improvements
3. **Refine Instructions**: Based on comparison results, further refine the hybrid instructions
4. **Documentation**: Consider documenting the three instruction modes and when to use each

## Git Status
- Current branch: `feature/20251208` (or similar)
- All changes should be committed before starting new work
- Hybrid mode is production-ready

---

**Session End Time:** December 8, 2025
**Deployment Status:** ✅ Hybrid mode is default in code (not yet deployed to production)
**Next Agent:** Please review this summary and test the agent comparison tool to verify hybrid mode works as expected











