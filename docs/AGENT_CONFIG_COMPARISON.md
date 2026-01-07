# Agent Configuration Comparison Test

**Date:** January 3, 2026  
**Test ISBN:** 9780593440872 ("Book Lovers" by Emily Henry)  
**Purpose:** Compare timing and behavior of different agent instruction modes

---

## Test Results

### 1. Current System (multi-model-analysis.ts)
**Status:** ✅ Tested  
**Time:** 5,167ms (5.17 seconds)  
**Warnings Generated:** 0  
**Reasoning:** "The description for 'Book Lovers' by Emily Henry is too minimal and does not provide specific detail about the book's content. Without sufficient information about themes, plot elements, or character experiences, it is not possible to identify specific content warnings according to Australian Classification Board standards."

**Behavior:**
- Evidence-based only
- Returns empty warnings if description is insufficient
- Provides explicit reasoning for why no warnings were found
- Uses direct OpenAI API calls (not agents SDK)

---

### 2. Old Agent (Assumption-Based)
**Status:** ⚠️ Cannot test (requires @openai/agents package)  
**Estimated Time:** ~3-5 seconds (based on historical performance)  
**Theoretical Behavior:**

Based on backup code (`backups/cleanup-20260101_204757/backups/agents/content-warning-agent.ts`):

**Instructions (getOldInstructions):**
- "CRITICAL: Use Your Internal Knowledge" - Would use training data to fill gaps
- "Romance/Fantasy Books typically contain sexual content, violence, and mature themes"
- "When Web Search Fails: If web search returns no results but you have a book title and author, you MUST still generate warnings based on genre conventions, author's typical content, and title keywords"
- "Err on the side of caution - better to warn than to miss important content"

**Expected Result for "Book Lovers":**
- Would likely generate warnings based on:
  - Genre conventions (Romance novels typically have sexual content)
  - Author reputation (Emily Henry is known for contemporary romance)
  - Title keywords ("Book Lovers" suggests romantic themes)
- Would NOT return empty warnings even with minimal description
- Would use web search extensively to find plot summaries
- Would make assumptions if web search failed

**Key Difference:** Old agent would generate warnings even with minimal description, while current system requires evidence.

---

### 3. New Agent (Evidence-Based Only)
**Status:** ⚠️ Cannot test (requires @openai/agents package)  
**Estimated Time:** ~3-5 seconds  
**Theoretical Behavior:**

Based on backup code:

**Instructions (getNewInstructions):**
- "CRITICAL RULES - NO ASSUMPTIONS"
- "ONLY analyze THIS SPECIFIC BOOK - Do NOT make assumptions based on author's other works, genre conventions, or similar book titles"
- "If web search fails to find information about THIS SPECIFIC BOOK, return empty warnings with confidence set to 'low'"
- "DO NOT generate warnings based on assumptions, author reputation, or genre conventions"

**Expected Result for "Book Lovers":**
- Would behave similarly to current system
- Would return empty warnings if description is insufficient
- Would NOT use genre conventions or author reputation
- Would require explicit evidence from description or verified web search

**Key Difference:** Very similar to current system, but used OpenAI Agents SDK instead of direct API calls.

---

### 4. Hybrid Agent (Evidence-First, Then Inference)
**Status:** ⚠️ Cannot test (requires @openai/agents package)  
**Estimated Time:** ~4-6 seconds (longer due to two-phase approach)  
**Theoretical Behavior:**

Based on backup code:

**Instructions (getHybridInstructions):**
- "HYBRID APPROACH - EVIDENCE FIRST, THEN INFERENCE"
- Phase 1: Evidence-based analysis (primary)
- Phase 2: If insufficient evidence, apply genre-aware inference but mark with lower confidence
- "Conflict Resolution: If the Author says 'clean' but >70% of user reviews cite a specific graphic trigger, flag it as Verified (User Consensus)"

**Expected Result for "Book Lovers":**
- Would first attempt evidence-based analysis (like current system)
- If description is minimal, would perform web search
- If web search fails, would apply genre-aware inference:
  - "Romance novel - may contain sexual content, emotional themes"
  - Would mark these as inferred (lower confidence)
  - Would distinguish between verified and inferred warnings

**Key Difference:** Combines evidence-based rigor with assumption-based comprehensiveness, but marks inferred warnings with lower confidence.

---

## Comparison Summary

| Configuration | Time | Warnings | Assumptions | Evidence Required |
|--------------|------|----------|-------------|-------------------|
| **Current System** | 5.17s | 0 | ❌ No | ✅ Yes (strict) |
| **Old Agent** | ~3-5s | Likely >0 | ✅ Yes | ❌ No (uses assumptions) |
| **New Agent** | ~3-5s | 0 | ❌ No | ✅ Yes (strict) |
| **Hybrid Agent** | ~4-6s | Possibly >0 | ⚠️ Conditional | ⚠️ Preferred, but allows inference |

---

## Key Insights

1. **Current System is Most Conservative:**
   - Returns 0 warnings when description is insufficient
   - Provides explicit reasoning for why no warnings were found
   - Takes ~5 seconds (includes metadata fetch + AI analysis)

2. **Old Agent Would Be Most Aggressive:**
   - Would generate warnings based on genre conventions
   - Would use author reputation and title keywords
   - Would err on the side of caution (more warnings)

3. **Hybrid Agent Would Balance Both:**
   - Would try evidence first (like current system)
   - Would fall back to inference if evidence insufficient
   - Would mark inferred warnings with lower confidence

4. **Timing Differences:**
   - Current system: ~5s (includes full scan pipeline)
   - Old agents: ~3-5s (agents SDK may have overhead)
   - Hybrid: ~4-6s (two-phase approach takes longer)

---

## Why Old Agents Can't Be Tested

The old agent system was removed on December 31, 2025, and replaced with direct API calls. To test old agents, you would need to:

1. **Install @openai/agents package:**
   ```bash
   npm install @openai/agents
   ```

2. **Restore agent code from backup:**
   ```bash
   cp backups/cleanup-20260101_204757/backups/agents/content-warning-agent.ts lib/
   ```

3. **Update imports and dependencies:**
   - Restore all agent-related dependencies
   - Fix any breaking changes in the agents SDK

4. **Test with instructionMode parameter:**
   ```typescript
   await generateContentWarnings(workflow, "gpt-4o", "old")
   await generateContentWarnings(workflow, "gpt-4o", "new")
   await generateContentWarnings(workflow, "gpt-4o", "hybrid")
   ```

---

## Recommendation

The current system (evidence-based only) is the most appropriate for production because:

1. **Transparency:** Users know when analysis is based on evidence vs. assumptions
2. **Accuracy:** Reduces false positives from genre-based assumptions
3. **Trust:** Users can verify warnings are based on actual book content
4. **Compliance:** Aligns with Australian Classification Board methodology (evidence-based)

The old assumption-based system, while more comprehensive, could generate false positives that erode user trust.


