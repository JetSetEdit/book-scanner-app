# Content Warning System: Who's Responsible?

## Overview
The system uses a **multi-model AI approach** with verification to generate content warnings. Here's who does what:

## The Flow

### Step 1: Initial Analysis (Two AI Models)
**Responsible: OpenAI GPT-4o + Google Gemini**

Both models analyze the book description **in parallel** and independently generate warnings:

- **OpenAI** (`analyzeWithOpenAI`): Analyzes the book and returns warnings
- **Gemini** (`analyzeWithGemini`): Analyzes the same book and returns warnings
- **Current Status**: Gemini is currently failing (404 error), so only OpenAI is working

**What they do:**
- Read the book description
- Identify content warnings based on the taxonomy
- Provide evidence excerpts
- Suggest severity, presence, detail level, etc.

### Step 2: Processing & Severity Computation
**Responsible: Code Logic (`processWarnings` function)**

After each AI model returns raw warnings, the code:

1. **Deduplicates** descriptions (removes identical descriptions)
2. **Looks up taxonomy** to get `defaultSeverityHint` (e.g., kidnapping = "severe")
3. **Builds severity signals** from AI-provided data (presence, detail_level, frequency, etc.)
4. **Computes final severity** using `computeSeverityFromSignals()`:
   - Uses the severity signals
   - **Applies severity floor** based on `defaultSeverityHint`
   - Ensures severe topics (like kidnapping) are never "mild" if evidence exists
5. **Validates sexual violence** (special logic to distinguish actual violence from dub-con)

**Key Point**: The AI models suggest severity, but **the code enforces the severity floor** to prevent severe topics from being labeled as "mild".

### Step 3: Combining Results
**Responsible: Code Logic (`combineResults` function)**

The system combines warnings from both models:

- **If both models agree** (same subcategory_id):
  - ✅ **Automatically included** (no verification needed)
  - Uses the more severe severity if they differ
  - If equal, prefers OpenAI's version

- **If only one model found it** (unique warning):
  - ⚠️ **Sent to verification** (see Step 4)

### Step 4: Verification (For Unique Warnings Only)
**Responsible: OpenAI GPT-4o (as verifier)**

**Only warnings found by ONE model** go through verification:

- The verifier (OpenAI) reviews each unique warning
- Checks if evidence supports the warning
- Decides: **keep**, **drop**, or **adjust**
- Uses balanced approach: "When in doubt, keep the warning"

**Current Behavior:**
- Warnings found by **both models** = ✅ Automatically kept (trusted)
- Warnings found by **one model** = ⚠️ Verified by OpenAI before keeping

### Step 5: Final Output
**Responsible: Code Logic**

The final warnings list includes:
1. All warnings both models agreed on (automatically included)
2. Unique warnings that passed verification

## Responsibility Breakdown

| Component | Responsibility | Example |
|-----------|---------------|---------|
| **OpenAI GPT-4o** | Initial analysis + Verification | Finds warnings, verifies unique ones |
| **Google Gemini** | Initial analysis (currently failing) | Would find warnings if working |
| **Code Logic** | Severity computation, deduplication, combining | Enforces severity floor, removes duplicates |
| **Taxonomy** | Provides default severity hints | Says "kidnapping = severe" |
| **Verification** | Validates unique warnings | Decides if single-model warnings are valid |

## Current State (Based on Test)

For "Gone Girl":
- **OpenAI found**: 5 warnings
- **Gemini found**: 0 warnings (API error)
- **Both agreed on**: 0 warnings (since Gemini failed)
- **Unique to OpenAI**: 5 warnings (all went to verification)
- **After verification**: 3 warnings kept, 2 dropped
- **Final result**: 3 warnings (manipulation, gaslighting, kidnapping)

## Key Insights

1. **Agreement = Trust**: If both models find the same warning, it's automatically included (no verification needed)

2. **Single Model = Verification**: Warnings found by only one model go through verification to reduce false positives

3. **Severity Floor**: The code enforces that severe topics (like kidnapping) are never "mild" - this is **code logic**, not AI decision

4. **Verification Balance**: Recently changed from "strict" to "balanced" - now keeps warnings with reasonable evidence rather than requiring "clear" evidence

5. **Gemini Status**: Currently broken (404 error), so all warnings are coming from OpenAI only, which means ALL warnings go through verification

## If Gemini Was Working

If Gemini was working:
- Some warnings would be found by both models → automatically included
- Only unique warnings would need verification
- Higher agreement score = more trusted warnings

## Summary

**Who's responsible for warnings?**
- **AI Models** (OpenAI/Gemini): Find and suggest warnings
- **Code Logic**: Enforces rules (severity floor, deduplication)
- **Verification** (OpenAI): Validates unique warnings
- **Taxonomy**: Provides ground truth (what severity should be)

The system is designed to be **conservative** - it prefers to include warnings rather than miss them, especially after the recent change to make verification less strict.

