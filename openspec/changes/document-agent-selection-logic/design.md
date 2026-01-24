# Design: Agent Selection Logic Documentation

## Current Implementation

The system uses a two-tier model selection strategy:

### 1. Quick Scans (IP-Based Assignment)

**Purpose**: Reduce costs and manage Gemini quota by assigning each IP to a single model.

**Algorithm**:
- Deterministic hash of IP address (simple character hash)
- 50/50 split: even hash → Gemini, odd hash → OpenAI
- Same IP always gets same model (deterministic)
- Quota protection: If Gemini daily usage ≥ threshold (default 15), all new assignments → OpenAI

**Implementation**:
- `getModelForIP(ip: string)` in `lib/utils/rate-limiter.ts`
- `shouldAssignGemini(ip: string)` checks quota before assignment
- Applied only when `scanMode === 'quick'`

**Trade-offs**:
- ✅ Cost-effective (single model per scan)
- ✅ Quota protection prevents overuse
- ✅ Deterministic (same user gets consistent experience)
- ❌ No cross-validation (single model can miss warnings)
- ❌ Uneven distribution if quota threshold hit early

### 2. Deep Scans (Multi-Model Analysis)

**Purpose**: Maximum quality through cross-validation and consensus.

**Algorithm**:
- Always runs both OpenAI and Gemini in parallel
- Combines results: unique findings preserved, highest severity wins
- Model disagreement lowers confidence, not severity
- Gemini failures are non-fatal (continues with OpenAI only)

**Implementation**:
- `analyzeBookWithMultiModel()` in `lib/services/multi-model-analysis.ts`
- Both models enabled by default (`enableOpenAI: true`, `enableGemini: true`)
- Parallel execution with `Promise.allSettled()`

**Trade-offs**:
- ✅ Highest quality (cross-validation)
- ✅ Redundancy (one model failure doesn't break scan)
- ✅ Comprehensive coverage (both models' unique findings)
- ❌ Higher cost (2x API calls)
- ❌ Slower (waits for both models)

## Quota Management

**Gemini Daily Quota**:
- Default limit: 20 requests per day (RPD)
- Warning threshold: 15 RPD (default, configurable via `GEMINI_QUOTA_WARNING_THRESHOLD`)
- Resets at UTC midnight
- In-memory tracking (not persisted)

**Behavior**:
- When usage < threshold: IP-based assignment works normally
- When usage ≥ threshold: All new Quick scan assignments → OpenAI
- Deep scans unaffected (always use both models)

## Model Enablement Flags

The system supports fine-grained control via `AnalysisOptions`:

```typescript
{
  enableOpenAI?: boolean      // Default: true
  enableGemini?: boolean      // Default: true
  enableAdversarial?: boolean  // Default: true
  enableVerification?: boolean // Default: true
  enableWebEnrichment?: boolean // Default: true
  includeReasoning?: boolean   // Default: true
}
```

**Quick Scans**:
- Flags set based on `modelAssignment` (IP-based)
- `enableOpenAI: modelAssignment === 'openai'`
- `enableGemini: modelAssignment === 'gemini'`
- Adversarial/verification disabled by default

**Deep Scans**:
- All flags respect `analysisOptions` overrides
- Defaults enable both models and all features

## Historical Context

**Old Agent System** (Removed Dec 31, 2025):
- Used OpenAI Agents SDK (`@openai/agents`)
- Three modes: Old (assumption-based), New (evidence-based), Hybrid
- Replaced with direct API calls for better control and reliability

**Current System**:
- Direct API calls to OpenAI and Gemini
- No agent SDK dependencies
- Stricter evidence-based requirements
- Better error handling and retry logic

## Key Files

- `lib/utils/rate-limiter.ts`: IP-based assignment (`getModelForIP`, `shouldAssignGemini`)
- `app/api/scan/route.ts`: Model assignment decision (`modelAssignment`)
- `lib/services/scan-service.ts`: Analysis options construction (Quick vs Deep)
- `lib/services/multi-model-analysis.ts`: Multi-model execution and combination
