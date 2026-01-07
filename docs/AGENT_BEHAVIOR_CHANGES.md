# Content Warning Agent Behavior Changes

**Generated:** January 3, 2026

---

## Executive Summary

The content warning system was **completely refactored** on **December 31, 2025**, moving from an **OpenAI Agents SDK-based system** to a **direct API call system** with stricter evidence-based requirements.

**Key Change:** The old system allowed assumptions and genre-based inference. The new system requires evidence-based analysis only.

**Project Timeline:** October 5, 2025 - January 3, 2026 (~3 months of active development)

**Note:** While the project is ~3 months old, development has been intensive with 37+ commits related to agents alone.

---

## Complete List of Agents (Historical)

### 1. **Content Warning Agent** (Primary)
- **File:** `lib/content-warning-agent.ts`
- **Lifespan:** Oct 9, 2025 - Dec 31, 2025
- **Commits:** 23
- **Purpose:** Main agent for generating content warnings from book metadata
- **Functions:** `findBookAndGenerateWarnings`, `generateContentWarnings`

### 2. **Book Finder Agent** (Primary)
- **File:** `lib/book-finder-agent.ts`
- **Lifespan:** Nov 24, 2025 - Dec 31, 2025
- **Commits:** 1
- **Purpose:** Agent for finding book information by ISBN
- **Note:** Separate from Content Warning Agent, focused on metadata retrieval

### 3. **Severity Classification Agent** (Primary)
- **File:** `lib/services/severity-classification-agent.ts`
- **Lifespan:** Dec 29, 2025 - Dec 31, 2025
- **Commits:** 3
- **Purpose:** Agent for classifying severity levels based on context
- **Functions:** `classifySeverity`, `getClassificationAgentConfig`

### 4. **Content Review Agent** (Secondary)
- **File:** `lib/services/content-review-agent.ts`
- **Lifespan:** Dec 10, 2025 - Dec 31, 2025
- **Commits:** 2
- **Purpose:** Rule-based agent for reviewing and validating content warnings (not AI-based)
- **Functions:** `detectDuplicates`, `detectMisclassification`

### 5. **Multi-Model Service** (Primary)
- **File:** `lib/services/multi-model-service.ts`
- **Lifespan:** Dec 29, 2025 - Dec 31, 2025
- **Commits:** 8
- **Purpose:** Service that orchestrates multiple AI models (GPT-4o + Gemini)
- **Functions:** `runMultiModelAnalysis`, `generateWarningsWithGemini`

### 6. **Voice Agent** (Removed Early)
- **File:** `lib/services/voice-agent.ts`
- **Lifespan:** Dec 10, 2025 - Dec 14, 2025 (4 days)
- **Commits:** 1
- **Purpose:** ElevenLabs TTS integration for audio briefings
- **Status:** Removed completely on Dec 14, 2025

### 7. **Agent Chain** (Experimental)
- **File:** `lib/agent-chain.ts`
- **Lifespan:** Nov 24, 2025 (backup only)
- **Purpose:** Experimental chaining of multiple agents
- **Status:** Never fully integrated, only exists in backup

### 8. **API Route Agents** (Supporting)
- **Files:**
  - `app/api/dev/scan-with-agent/route.ts`
  - `app/api/scan-isbn-agent-chain/route.ts`
  - `app/api/test-agent-chain/route.ts`
  - `app/api/test-ai-agent/route.ts`
- **Purpose:** API endpoints for testing and using agents
- **Status:** Removed with agent system

---

## Agent Statistics

**Total Agents:** 8 (7 primary/secondary + 1 experimental)
**Total Agent-Related Commits:** 37+
**Total Project Commits:** ~200+ (estimated)
**Agent System Lifespan:** Oct 9, 2025 - Dec 31, 2025 (83 days)
**Most Active Agent:** Content Warning Agent (23 commits)
**Shortest-Lived Agent:** Voice Agent (4 days)

---

## Timeline of Changes

### October 5, 2025: Project Start
- First commit: "feat: Add comprehensive content warning system with collapsible UI"
- Project begins

### October 9, 2025: First Agent
- Content Warning Agent created
- Uses OpenAI Agents SDK
- Assumption-based instructions

### November 24, 2025: Agent Expansion
- Book Finder Agent added
- Agent Chain experimental code created

### December 10, 2025: Voice Agent Added
- Voice Agent with ElevenLabs TTS integration
- Content Review Agent added (rule-based)

### December 14, 2025: Voice Agent Removed
- Voice Agent completely removed (4 days after creation)

### December 29, 2025: Multi-Model System
- Severity Classification Agent added
- Multi-Model Service created (GPT-4o + Gemini)

### December 31, 2025: Complete Agent Removal
- **Removed:** All OpenAI Agents SDK-based agents
  - `lib/content-warning-agent.ts` (1,374 lines, 23 commits)
  - `lib/book-finder-agent.ts` (1 commit)
  - `lib/services/severity-classification-agent.ts` (3 commits)
  - `lib/services/content-review-agent.ts` (2 commits)
  - `lib/services/multi-model-service.ts` (8 commits)
  - `lib/agent-chain.ts` (experimental)
  - All API route agents

- **Replaced with:** `lib/services/multi-model-analysis.ts` (direct API calls)

### January 1, 2026: New System Active
- First database usage with new system
- All books analyzed using evidence-based approach

---

## Behavioral Differences

### 1. **Assumption vs. Evidence**

#### OLD SYSTEM (Agents SDK):
```typescript
// OLD INSTRUCTIONS (getOldInstructions):
"CRITICAL: Use Your Internal Knowledge": 
If the web search returns limited results or "no results", 
**YOU MUST use your internal training data** to fill in the gaps. 
You know about popular books like "Twisted Love" (dark romance, abuse themes), 
"The Catcher in the Rye" (mental health, language), "1984" (violence, torture), etc. 
DO NOT say "no warnings" just because the search tool failed.

"CRITICAL: Romance/Fantasy Books": 
Romance and fantasy romance books typically contain sexual content, violence, 
and mature themes. Even if web search fails, you MUST generate appropriate 
warnings based on genre conventions.
```

**Behavior:** Could generate warnings based on:
- Author's other works
- Genre conventions
- Internal training knowledge
- Similar book titles
- Title keywords alone

#### NEW SYSTEM (Direct API):
```typescript
// NEW INSTRUCTIONS (multi-model-analysis.ts):
"CRITICAL: Be specific and evidence-based. 
Only include warnings you can identify from ACTUAL CONTENT in the description.

- DO NOT make assumptions based on genre, categories, or book title alone
- DO NOT use phrases like "often includes", "typically features", "usually contains"
- DO NOT infer warnings from genre labels (e.g., "dark romance", "thriller")
- ONLY include warnings if you can point to specific content mentioned in the description
- If you cannot identify specific content warnings from the description, return [] (empty array)"
```

**Behavior:** Only generates warnings based on:
- Actual content in the book description
- Verified web search results about THIS SPECIFIC BOOK
- Returns empty warnings if insufficient information

---

### 2. **Web Search Usage**

#### OLD SYSTEM:
- Web search was a tool the agent could choose to use
- If search failed, agent would fall back to assumptions
- Could generate warnings even with no search results

#### NEW SYSTEM:
- Web search is **mandatory** when description is minimal (< 50 chars)
- If web search fails, returns empty warnings with low confidence
- No fallback to assumptions

---

### 3. **Genre Awareness**

#### OLD SYSTEM:
```typescript
"Romance and fantasy romance books typically contain sexual content, 
violence, and mature themes. Even if web search fails, you MUST 
generate appropriate warnings based on genre conventions."
```

**Result:** Romance books would get warnings even with minimal descriptions.

#### NEW SYSTEM:
```typescript
"2a. GENRE AWARENESS FOR ROMANCE BOOKS:
- If the book appears to be a Romance novel, you MUST be especially thorough:
  - Look for HEAT/SPICE LEVEL indicators in the description
  - Look for COMMON ROMANCE TROPES that are content warnings
  - IMPORTANT: If the description is vague or doesn't mention heat level, 
    you should note in 'no_warnings_reasoning' that 'Analysis based on 
    blurb only; community reviews may indicate different heat/spice levels 
    or tropes not mentioned in the description.'"
```

**Result:** Romance books get thorough analysis, but warnings are only generated if evidence exists in the description. If description is vague, a disclaimer is added instead of generating assumptions.

---

### 4. **Reasoning Requirements**

#### OLD SYSTEM:
- Reasoning could reference author reputation
- Could use generic genre phrasing ("typical of romance genre")
- Could make assumptions without citing sources

#### NEW SYSTEM:
```typescript
"reasoning: A clear explanation of why this warning was assigned, 
using Australian Classification Board style language. 
Explain what evidence supports the warning...

CRITICAL: If context modifiers are applied, explicitly explain 
how the context reduces the impact and justifies a lower severity level.

DO NOT mention specific character names, plot events, or story details."
```

**Result:** Reasoning must:
- Cite specific evidence from description
- Reference Australian Classification Board methodology
- Use categorical language (not plot-specific)
- Explain context modifiers explicitly

---

### 5. **"No Warnings" Handling**

#### OLD SYSTEM:
- Would rarely return empty warnings
- Would generate warnings based on assumptions if description was thin
- "Err on the side of caution - better to warn than to miss important content"

#### NEW SYSTEM:
```typescript
"If the warnings array is empty, you MUST provide a 'no_warnings_reasoning' 
field explaining why no warnings were identified. This should explain what 
content was reviewed (e.g., 'romance themes', 'lighthearted tone', 'no 
violence or sensitive themes mentioned') and why it does not meet the 
threshold for content warnings according to Australian Classification 
Board standards."
```

**Result:** 
- Returns empty warnings when no evidence exists
- Provides explicit reasoning for why no warnings were found
- No assumptions made

---

## Why The Change?

### Problems with Old System:
1. **False Positives:** Generated warnings based on genre assumptions, not actual content
2. **Over-Warning:** "Err on the side of caution" led to warnings for books that didn't need them
3. **Lack of Transparency:** Reasoning didn't cite sources, making it hard to verify
4. **Spoiler Risk:** Could reveal plot details in reasoning
5. **Inconsistent:** Different results for same book depending on agent's "internal knowledge"

### Benefits of New System:
1. **Accuracy:** Only warns about content that actually exists
2. **Transparency:** Reasoning cites specific evidence
3. **Spoiler-Free:** Uses categorical language, not plot details
4. **Consistent:** Same book = same result (based on description)
5. **Verifiable:** Can check reasoning against actual book description

---

## Impact on User Experience

### Before (Old Agents):
- **More warnings** (often based on assumptions)
- **Less accurate** (false positives from genre assumptions)
- **Less transparent** (reasoning didn't cite sources)
- **Spoiler risk** (could reveal plot in reasoning)

### After (New System):
- **Fewer warnings** (only when evidence exists)
- **More accurate** (evidence-based only)
- **More transparent** (reasoning cites sources)
- **Spoiler-safe** (categorical language only)

---

## Example Comparison

### Book: "Book Lovers" by Emily Henry

#### OLD SYSTEM (Assumption-Based):
```
Warnings Generated:
- Sexual Content (Moderate) - "Romance novels typically contain sexual content"
- Emotional Abuse (Mild) - "Contemporary romance often includes relationship conflict"
```

**Reasoning:** Generic genre assumptions, no specific evidence cited.

#### NEW SYSTEM (Evidence-Based):
```
Warnings: [] (Empty)

No Warnings Reasoning: 
"The book description focuses on a lighthearted enemies-to-lovers 
romance with workplace banter and family dynamics. No violence, 
sexual content, or sensitive themes are mentioned in the description. 
The tone is described as witty and charming, with no indication of 
content that would require warnings according to Australian 
Classification Board standards."
```

**Reasoning:** Cites specific evidence from description, explains why no warnings are needed.

---

## Migration Notes

- **All books analyzed before Jan 1, 2026:** Used old agent system (assumption-based)
- **All books analyzed after Jan 1, 2026:** Use new system (evidence-based)
- **Re-scanning old books:** Will get new evidence-based analysis (may have different warnings)

---

## Conclusion

The content warning system now prioritizes **accuracy and transparency** over **comprehensiveness**. This means:

✅ **More accurate warnings** (only when evidence exists)  
✅ **Better user trust** (can verify reasoning)  
✅ **Fewer false positives** (no genre assumptions)  
⚠️ **Fewer warnings overall** (evidence-based only)  
⚠️ **May miss warnings** if description is insufficient (but provides disclaimer)

The trade-off is intentional: **Better to have fewer, accurate warnings than many, inaccurate ones.**

