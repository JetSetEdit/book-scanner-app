# Taxonomy v2.5.0 Enhancements

This document outlines the enhancements made to the taxonomy system based on actionable suggestions for improving trust, accuracy, and UX.

## Overview

The taxonomy system has been enhanced with:
1. **Context Modifiers** - Second axis of nuance beyond category/subcategory
2. **Evidence Storage** - Spans with confidence, location, and source tracking
3. **Computed Severity** - Severity calculated from signals rather than static labels
4. **Display Rules** - Intelligent filtering and collapsing to prevent overwhelming users
5. **Sexual Violence Evaluation** - Separate logic to distinguish actual violence from consent play
6. **Other Bucket Strategy** - Required notes for "other_*" subcategories to feed taxonomy refinement
7. **Version Tracking** - Taxonomy version stored with each warning for migration support

## Implementation Details

### 1. Context Modifiers

**File:** `lib/config/taxonomy-context.ts`

Context modifiers provide nuance for discrimination and sensitive content:
- `historical_context` - Content appears in historical setting
- `quoted_or_discussed` - Content is quoted/discussed, not directly depicted
- `character_held_bias` - Bias held by character, not narrative
- `condemned_by_narrative` - Content explicitly condemned
- `endorsed_by_narrative` - Content endorsed/normalized (rare but important)
- `educational_or_analytical` - Educational/informational context
- `satire_or_parody` - Satirical context

**Usage:**
```typescript
import { CONTEXT_MODIFIERS, ContextModifier } from '@/lib/config/taxonomy-context';

const modifiers: ContextModifier[] = ['historical_context', 'condemned_by_narrative'];
```

### 2. Evidence Storage

**File:** `lib/config/taxonomy-context.ts`

Each warning can store evidence spans:
```typescript
interface EvidenceSpan {
  source: 'text' | 'community' | 'author_note';
  location?: {
    chapter?: number;
    page?: number;
    span_start?: number;
    span_end?: number;
  };
  excerpt?: string; // Safe-truncated (max 200 chars)
  confidence: number; // 0-1
}
```

**Database:** Stored as JSONB array in `content_warnings.evidence`

### 3. Computed Severity

**File:** `lib/utils/severity-computation.ts`

Severity is computed from signals:
- **Frequency** - How often (0-1)
- **Explicitness** - Graphic detail (0-1)
- **Proximity** - On-page vs off-page (0-1)
- **Centrality** - Theme vs throwaway (0-1)
- **Intensity Markers** - e.g., ['weapons', 'coercion', 'threats']

**Usage:**
```typescript
import { buildSeveritySignals, computeSeverityFromSignals } from '@/lib/utils/severity-computation';

const signals = buildSeveritySignals({
  presence: 'on_page',
  detail_level: 'graphic',
  description: '...',
  category_id: 'violence',
});

const severity = computeSeverityFromSignals(signals);
```

### 4. Display Rules

**File:** `lib/utils/display-rules.ts`

Intelligent filtering to prevent overwhelming users:
- **Top N by severity** - Show only top 5 warnings by severity + confidence
- **Collapse siblings** - Hide `physical_violence` if `graphic_violence` exists
- **Hide mild by default** - Only show mild warnings if user opts in

**Usage:**
```typescript
import { applyDisplayRules, DEFAULT_DISPLAY_RULES } from '@/lib/utils/display-rules';

const filtered = applyDisplayRules(warnings, {
  topN: 5,
  collapseSiblings: true,
  hideMild: true,
  showMild: false,
});
```

### 5. Sexual Violence Evaluation

**File:** `lib/utils/sexual-violence-evaluation.ts`

Critical logic to separate actual sexual violence from dark romance consent play:
- Never let keyword hits alone escalate to `sexual_violence`
- Require strong signals: force, threat, non-consent, victim framing
- Keep CNC/Dub-Con as separate path unless strong violence signals appear

**Usage:**
```typescript
import { isActualSexualViolence, validateSexualViolenceWarning } from '@/lib/utils/sexual-violence-evaluation';

const { isViolence, confidence, reasoning } = isActualSexualViolence(warning);
const { valid, error, suggestion } = validateSexualViolenceWarning(warning);
```

### 6. Other Bucket Strategy

**File:** `lib/config/taxonomy-context.ts`

"Other" subcategories require notes:
- `requiresOtherNote(subcategoryId)` - Check if note required
- `validateOtherNote(subcategoryId, note)` - Validate note presence and length

**Database:** Constraint enforced via trigger - `other_note` required when `subcategory_id` starts with `other_`

### 7. Version Tracking

**Database:** `content_warnings.taxonomy_version` column (default: '2.5.0')

Each warning stores the taxonomy version used when created, enabling:
- Historical data integrity
- Migration support
- Version-specific display logic

## Database Migration

**File:** `supabase/migrations/20250101_add_taxonomy_enhancements.sql`

Adds:
- `context_modifiers` (JSONB array)
- `evidence` (JSONB array)
- `severity_signals` (JSONB object)
- `other_note` (TEXT, required for other_* subcategories)
- `taxonomy_version` (TEXT, default '2.5.0')
- Trigger to enforce `other_note` requirement
- Indexes for performance

**To apply:**
```bash
supabase migration up
# or
psql -f supabase/migrations/20250101_add_taxonomy_enhancements.sql
```

## Integration Guide

### Creating Enhanced Warnings

```typescript
import { EnhancedContentWarning } from '@/lib/config/taxonomy-context';
import { buildSeveritySignals, computeSeverityFromSignals } from '@/lib/utils/severity-computation';
import { validateOtherNote } from '@/lib/config/taxonomy-context';

const warning: EnhancedContentWarning = {
  subcategory_id: 'violence.graphic_violence',
  severity: 'severe',
  modifiers: ['historical_context', 'condemned_by_narrative'],
  evidence: [{
    source: 'text',
    location: { chapter: 5, page: 120 },
    excerpt: 'The battle was brutal...',
    confidence: 0.9,
  }],
  severity_signals: buildSeveritySignals({
    presence: 'on_page',
    detail_level: 'graphic',
    frequency_hint: 'repeated',
    centrality_hint: 'central',
  }),
  taxonomy_version: '2.5.0',
};

// Validate other_note if needed
if (warning.subcategory_id.startsWith('other_')) {
  const { valid, error } = validateOtherNote(warning.subcategory_id, warning.other_note);
  if (!valid) throw new Error(error);
}
```

### Displaying Warnings

```typescript
import { applyDisplayRules } from '@/lib/utils/display-rules';

const displayedWarnings = applyDisplayRules(warnings, {
  topN: 5,
  collapseSiblings: true,
  hideMild: true,
  showMild: userPreferences.showMildWarnings,
});
```

### Validating Sexual Violence

```typescript
import { validateSexualViolenceWarning } from '@/lib/utils/sexual-violence-evaluation';

const validation = validateSexualViolenceWarning(warning);
if (!validation.valid) {
  console.warn(validation.error);
  console.info(validation.suggestion);
}
```

## Governance Notes

- **Only add new tags when:**
  - 3+ users request the same concept, OR
  - It appears frequently in author-supplied CWs, OR
  - It materially changes severity for a known cluster

- **Other subcategories:**
  - Require `other_note` (enforced by database constraint)
  - Logged for taxonomy refinement
  - Minimum 10 characters

- **Taxonomy versions:**
  - Treat as immutable per version
  - Store with each warning
  - Provide migration map if IDs change (ideally never)

## Next Steps

1. **Apply migration** to add new database columns
2. **Update AI agent** to use new context modifiers and evidence storage
3. **Update frontend** to respect display rules
4. **Add UI controls** for showing/hiding mild warnings
5. **Implement "Other" note collection** in warning submission forms
6. **Monitor "Other" notes** for taxonomy refinement opportunities



