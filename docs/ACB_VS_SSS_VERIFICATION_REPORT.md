# ACB vs SSS: Verification Report

This report verifies that **age ratings (ACB)** and **SSS (Subtext Suitability Scale)** are implemented as **orthogonal** systems: one a legal/industry content gate, the other an emotional-intensity lens. It also documents how each model and component treats (or does not mention) ACB and SSS.

---

## 1. Conceptual Split (Verified in Code)

| Dimension | ACB (Age ratings) | SSS (S1–S4) |
|-----------|-------------------|-------------|
| **Purpose** | “Is this content suitable for audiences of a certain age under law/industry standards?” | “How heavy or activating will this book feel to a typical reader?” |
| **Output** | G, PG, M, MA15+, R18+, RC (stored in `books.categories` as `CLASSIFICATION:…`) | S1_GENTLE, S2_MILD, S3_MODERATE, S4_INTENSE (stored in `books.sss_level`, `books.sss_notes`) |
| **Computation** | **Deterministic**: `lib/utils/age-rating.ts` → `calculateAgeRating(warnings)` using escalation weights, severity signals, and ACB-style rules. No LLM. | **Assigned by LLM**: `lib/services/sss-assignment.ts` → `assignSSS({ warnings, title, author, description })` via OpenAI (gpt-4o-mini by default). |
| **Inputs** | Same `EnhancedContentWarning[]` (warnings) only. | Warnings + book metadata (title, author, description). |
| **Referenced in prompts** | Content-warning prompts ask for “Australian Classification Board” **style** language (descriptions, impact) but do **not** ask the model to output an age rating or G/PG/M/MA15+/R. | SSS prompt explicitly states SSS is **independent** of “legal or ACB classification.” |

**Conclusion:** The codebase implements the intended split: ACB = regulatory/age gate; SSS = reader-focused emotional load. They are not conflated in logic or in the SSS prompt.

---

## 2. How Each Component Treats ACB vs SSS

### 2.1 OpenAI (content-warning analysis)

**Location:** `lib/services/multi-model-analysis.ts` → `analyzeWithOpenAI()`

- **Role:** Produces content warnings (taxonomy subcategories, descriptions, presence, detail_level, severity signals). Does **not** output an age rating or SSS.
- **ACB:** Prompt says to use **Australian Classification Board style** for:
  - Description wording (“Strong [content type]”, “Moderate…”, “Mild…”)
  - Impact factors (Emphasis, Tone, Frequency, Context, Detail, Cumulative effect)
  - References: Guidelines for the Classification of Publications, National Classification Code, classification.gov.au
- **SSS:** Not mentioned. Model only outputs warnings (and optional `no_warnings_reasoning`).
- **Conclusion:** OpenAI is used for **evidence-based warnings** in ACB-style language; it does not assign ACB ratings or SSS.

---

### 2.2 Gemini (content-warning analysis)

**Location:** `lib/services/multi-model-analysis.ts` → `analyzeWithGemini()`

- **Role:** Same as OpenAI: produces content warnings. Does **not** output age rating or SSS.
- **ACB:** Same as OpenAI: “Australian Classification Board’s methodology,” six classifiable elements, impact (very mild → high), description style, classification.gov.au.
- **SSS:** Not mentioned.
- **Conclusion:** Gemini is aligned with OpenAI: warnings only, ACB-style language only; no ACB or SSS assignment.

---

### 2.3 Multi-model pipeline (combine, adversarial, verification)

**Location:** `lib/services/multi-model-analysis.ts` → `analyzeBookWithMultiModel()`, `combineResults()`, adversarial + verification

- **Role:** Runs OpenAI and/or Gemini, combines warnings, optionally runs adversarial validation (each model critiques the other’s warnings) and verification (unique warnings checked by the other model). Output is `EnhancedContentWarning[]` (+ optional `noWarningsReasoning`).
- **ACB:** Never computed or mentioned in this file. No instruction to output or consider age rating.
- **SSS:** Not mentioned. Pipeline only produces warnings.
- **Conclusion:** Multi-model layer is warning-only; ACB and SSS are downstream.

---

### 2.4 ACB (age rating) – deterministic

**Location:** `lib/utils/age-rating.ts`, `lib/config/age-escalation-weights.ts`

- **Role:** Maps `EnhancedContentWarning[]` → one classification (G, PG, M, MA15+, R18+, RC) using:
  - Severity (mild/moderate/severe) and severity_signals (explicitness, frequency, proximity, centrality, intensity_markers)
  - Category/subcategory escalation weights (e.g. sexual violence → R18+; graphic violence, torture → higher band)
  - Explicit on-page sexual content flag (derived from signals, not just subcategory name)
  - Presentation multiplier and impact score
- **SSS:** Not referenced. Age rating does not use or output SSS.
- **Conclusion:** ACB is a **rule-based, deterministic** gate from warnings to age band. No LLM; no emotional-intensity scale.

---

### 2.5 SSS (Subtext Suitability Scale) – LLM-assigned

**Location:** `lib/services/sss-assignment.ts`

- **Role:** Consumes warnings + book metadata; outputs `sss_level` (S1–S4) and `sss_notes`. Uses OpenAI (default `gpt-4o-mini`, overridable via `SSS_MODEL`).
- **ACB:** Explicitly **decoupled**. System prompt states: *“SSS is … **independent** of legal or ACB classification.”* The model is not asked to output or align with G/PG/M/MA15+/R.
- **Logic:** Triage in prompt: themes → explicitness/frequency → emotional-load band → short notes. S1–S4 definitions are reader-focused (e.g. “very activating for trauma-affected readers” for S4).
- **Conclusion:** SSS is a separate, emotional-intensity lens; the prompt enforces independence from ACB.

---

### 2.6 Adversarial validation

**Location:** `lib/services/adversarial-validation.ts`

- **Role:** OpenAI critiques Gemini’s warnings; Gemini critiques OpenAI’s warnings (too lenient, too restrictive, severity disagreement, agree). Refines warnings only.
- **ACB / SSS:** Neither age rating nor SSS is mentioned in prompts or logic.
- **Conclusion:** Purely about warning quality; no ACB or SSS.

---

### 2.7 Verification (unique-warning verification)

**Location:** `lib/services/multi-model-analysis.ts` → `verifyUniqueWarnings()`

- **Role:** For warnings found by only one model, the *other* model verifies (keep/drop/adjust severity or subcategory). Output is still warnings only.
- **ACB / SSS:** Not referenced.
- **Conclusion:** Verification is warning-level only; no ACB or SSS.

---

### 2.8 Web search / enrichment

**Location:** `lib/services/scan-service.ts` (0-warnings path: OpenAI web search); `lib/services/web-search-enrichment.ts`; `lib/services/multi-model-analysis.ts` (enrichment context)

- **Role:** When metadata is thin or initial analysis finds few warnings, web search/enrichment adds context (e.g. community content warnings). That context is fed back into **content-warning analysis** (OpenAI/Gemini) as extra text. No separate age or SSS step.
- **ACB / SSS:** Not produced or requested by search/enrichment; they only supply text for warning generation.
- **Conclusion:** Enrichment feeds warnings pipeline only; ACB and SSS remain downstream.

---

### 2.9 Scan service (orchestration)

**Location:** `lib/services/scan-service.ts`

- **Order of operations (when warnings exist):**
  1. Save content warnings to DB.
  2. **Age rating:** `calculateAgeRating(analysisResult.warnings)` → update `books.categories` with `CLASSIFICATION:${rating}`.
  3. **SSS:** `assignSSS({ warnings, title, author, description })` → update `books.sss_level`, `books.sss_notes`.
  4. Log audit decision.
- **When no warnings:** Still runs `assignSSS` with empty warnings (returns S1_GENTLE with default note) and persists it.
- **Conclusion:** ACB and SSS are computed and stored **separately**, in sequence; neither depends on the other’s value.

---

### 2.10 Legacy content-warning agent

**Location:** `lib/content-warning-agent.ts` (`generateContentWarnings`, `findBookAndGenerateWarnings`)

- **Usage:** Test scripts and comparison/debug (e.g. `test-single-agent.ts`, `compare-agent-patterns.ts`). **Production scan uses `analyzeBookWithMultiModel`**, not this agent.
- **ACB / SSS:** This agent returns content warnings (and possibly classification in some code paths). It does **not** compute or output SSS. Age rating, if present, would be applied elsewhere (e.g. scan-service or a script).
- **Conclusion:** Legacy agent is warning-generation only; no SSS; ACB would be applied outside this module if at all.

---

## 3. Summary Table

| Component | Produces/uses warnings | Produces/uses ACB (age rating) | Produces/uses SSS | Mentions ACB in prompt | Mentions SSS in prompt |
|-----------|------------------------|--------------------------------|-------------------|------------------------|------------------------|
| **OpenAI (multi-model)** | ✅ Yes | ❌ No | ❌ No | ✅ Style only (descriptions) | ❌ No |
| **Gemini (multi-model)** | ✅ Yes | ❌ No | ❌ No | ✅ Style only (descriptions) | ❌ No |
| **Multi-model pipeline** | ✅ Yes | ❌ No | ❌ No | ❌ No | ❌ No |
| **ACB (age-rating.ts)** | ✅ Input | ✅ Output | ❌ No | N/A (rules) | ❌ No |
| **SSS (sss-assignment.ts)** | ✅ Input | ❌ No | ✅ Output | ✅ “Independent of ACB” | ✅ Full prompt |
| **Adversarial validation** | ✅ Refines | ❌ No | ❌ No | ❌ No | ❌ No |
| **Verification (unique)** | ✅ Refines | ❌ No | ❌ No | ❌ No | ❌ No |
| **Web search / enrichment** | Feeds analysis | ❌ No | ❌ No | ❌ No | ❌ No |
| **Scan service** | Orchestrates | ✅ Persists | ✅ Persists | ❌ No | ❌ No |
| **content-warning-agent (legacy)** | ✅ Yes | ❌ No | ❌ No | Depends on instructions | ❌ No |

---

## 4. Alignment With Your Intended Design

- **ACB as legal/industry gate:** Implemented as a deterministic function from warnings to G/PG/M/MA15+/R18+/RC, using ACB-style elements and escalation. No model is asked to “choose” an age rating.
- **SSS as emotional-intensity lens:** Implemented as a separate LLM step that explicitly ignores ACB and focuses on themes, explicitness, frequency, and “how heavy this will feel.”
- **Orthogonality:** Same warnings feed both; ACB and SSS are computed independently and stored in different fields. The SSS system prompt states that SSS is independent of legal/ACB classification.
- **Combined UX:** The app can show both (e.g. “ACB: MA15+, SSS: S2_MILD – brief strong content, but overall tone is adventurous”) because they are stored and computed separately.

No changes are required for the conceptual split; the implementation matches the intended design. This report can be updated if new models or pipeline steps are added.
