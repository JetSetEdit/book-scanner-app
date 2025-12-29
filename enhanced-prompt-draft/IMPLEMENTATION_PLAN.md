# Implementation Plan for Enhanced Prompt

## Overview

This document outlines how to integrate the enhanced prompt system into the existing Book Scanner app without disrupting Antigravity's current work.

## File Structure

```
enhanced-prompt-draft/
├── ENHANCED_PROMPT.md          # The prompt draft itself
├── IMPLEMENTATION_PLAN.md       # This file
└── content-warning-agent-v2.ts  # New implementation (when ready)
```

## Integration Strategy

### Phase 1: Review & Refinement
- [ ] Review enhanced prompt with team
- [ ] Refine genre heuristics based on test cases
- [ ] Validate few-shot example format

### Phase 2: Parallel Implementation
- [ ] Create `lib/content-warning-agent-v2.ts` with enhanced prompt
- [ ] Add strictness mode parameter support
- [ ] Implement few-shot example builder
- [ ] Add genre detection helper

### Phase 3: Testing
- [ ] Unit tests for prompt generation
- [ ] Integration tests with sample books
- [ ] A/B test against current prompt

### Phase 4: Gradual Rollout
- [ ] Feature flag for enhanced prompt
- [ ] Monitor accuracy metrics
- [ ] Iterate based on feedback

## Key Functions to Add

### 1. Build Enhanced Prompt
```typescript
function buildEnhancedPrompt(
  book: WorkflowInput,
  strictnessMode: StrictnessMode = 'standard',
  fewShotExamples: TrainingExample[] = []
): string
```

### 2. Detect Genre from Categories
```typescript
function detectGenre(categories: string[]): string
```

### 3. Apply Strictness Escalation
```typescript
function applyStrictnessEscalation(
  warnings: ContentWarning[],
  strictnessMode: StrictnessMode,
  genre: string
): ContentWarning[]
```

## Migration Path

1. **Keep existing agent** (`content-warning-agent.ts`) as fallback
2. **Add new agent** (`content-warning-agent-v2.ts`) with enhanced prompt
3. **Feature flag** to switch between versions
4. **Monitor** both versions in production
5. **Gradually migrate** once v2 proves superior

## Backward Compatibility

- Existing API contracts remain unchanged
- Strictness mode defaults to 'standard' if not provided
- Existing warnings format maintained
- Can run both versions in parallel

















