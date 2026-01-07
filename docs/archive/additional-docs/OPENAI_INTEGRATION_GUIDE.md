# OpenAI Integration Guide

**IMPORTANT:** When building new OpenAI integrations, use ONLY the new taxonomy v2.5.0 structure and enhancements.

## ✅ What to Use

### 1. Taxonomy Structure
```typescript
import { 
  WARNING_CATEGORIES, 
  TAXONOMY_VERSION, 
  MODEL_VERSION,
  getCategoryById,
  getSubcategoryById,
  getAllSubcategoryIds
} from '@/lib/config/taxonomy-v2'

// Current versions
TAXONOMY_VERSION = "2.5.0"
MODEL_VERSION = "gpt-4o-2024-11-20"
```

### 2. Context Modifiers
```typescript
import { 
  CONTEXT_MODIFIERS, 
  ContextModifier,
  EvidenceSpan,
  EnhancedContentWarning
} from '@/lib/config/taxonomy-context'
```

### 3. Severity Computation
```typescript
import { 
  buildSeveritySignals,
  computeSeverityFromSignals,
  presenceToProximity,
  detailLevelToExplicitness
} from '@/lib/utils/severity-computation'
```

### 4. Sexual Violence Evaluation
```typescript
import { 
  isActualSexualViolence,
  validateSexualViolenceWarning
} from '@/lib/utils/sexual-violence-evaluation'
```

### 5. Display Rules
```typescript
import { 
  applyDisplayRules,
  DEFAULT_DISPLAY_RULES
} from '@/lib/utils/display-rules'
```

## ❌ What NOT to Use

### Old Agent Files (REMOVED)
- ❌ `lib/content-warning-agent.ts` - REMOVED
- ❌ `lib/book-finder-agent.ts` - REMOVED
- ❌ `lib/services/severity-classification-agent.ts` - REMOVED
- ❌ `lib/services/content-review-agent.ts` - REMOVED
- ❌ `lib/services/multi-model-service.ts` - REMOVED
- ❌ `/api/scan-multi-model` - REMOVED

### Old Taxonomy
- ❌ `lib/config/taxonomy.ts` (legacy v1)
- ❌ Old category structure without subcategories
- ❌ Static severity labels without computation

## 📋 Example: Building a New OpenAI Integration

```typescript
import OpenAI from 'openai'
import { WARNING_CATEGORIES, TAXONOMY_VERSION, MODEL_VERSION } from '@/lib/config/taxonomy-v2'
import { ContextModifier, EvidenceSpan } from '@/lib/config/taxonomy-context'
import { buildSeveritySignals, computeSeverityFromSignals } from '@/lib/utils/severity-computation'
import { isActualSexualViolence } from '@/lib/utils/sexual-violence-evaluation'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

async function analyzeBook(bookMetadata: {
  title: string
  author: string
  description: string
  isbn: string
}) {
  // Build taxonomy context for prompt
  const subcategories = WARNING_CATEGORIES.flatMap(cat => 
    cat.subcategories.map(sub => ({
      id: `${cat.id}.${sub.id}`,
      label: sub.userLabel,
      description: sub.shortDescription,
      defaultSeverity: sub.defaultSeverityHint
    }))
  )

  const prompt = `
Analyze this book for content warnings using Taxonomy v${TAXONOMY_VERSION}.

Book: ${bookMetadata.title} by ${bookMetadata.author}
Description: ${bookMetadata.description}

Available subcategories:
${subcategories.map(s => `- ${s.id}: ${s.label} (${s.description})`).join('\n')}

For each warning found, provide:
1. subcategory_id (format: category.subcategory)
2. description
3. presence (on_page, off_page, flashback, referenced, implied)
4. detail_level (graphic, moderate, vague, clinical)
5. context_modifiers (if applicable): historical_context, quoted_or_discussed, character_held_bias, condemned_by_narrative, etc.
6. evidence spans with confidence scores
7. frequency_hint (single, repeated, theme)
8. centrality_hint (throwaway, minor, central)

Return JSON array of warnings.
`

  const response = await openai.chat.completions.create({
    model: MODEL_VERSION,
    messages: [
      {
        role: 'system',
        content: `You are a content warning analyzer using Taxonomy v${TAXONOMY_VERSION}. Always use the hierarchical category.subcategory format.`
      },
      {
        role: 'user',
        content: prompt
      }
    ],
    response_format: { type: 'json_object' },
    temperature: 0.3
  })

  const analysis = JSON.parse(response.choices[0].message.content || '{}')
  
  // Process each warning
  const processedWarnings = analysis.warnings.map((w: any) => {
    // Build severity signals
    const signals = buildSeveritySignals({
      presence: w.presence,
      detail_level: w.detail_level,
      description: w.description,
      category_id: w.subcategory_id.split('.')[0],
      frequency_hint: w.frequency_hint,
      centrality_hint: w.centrality_hint
    })
    
    // Compute severity from signals
    const severity = computeSeverityFromSignals(signals)
    
    // Validate sexual violence if applicable
    if (w.subcategory_id.includes('sexual')) {
      const violenceCheck = isActualSexualViolence({
        subcategory_id: w.subcategory_id,
        description: w.description,
        reasoning: w.reasoning
      } as any)
      
      if (!violenceCheck.isViolence && w.subcategory_id === 'sexual_content.sexual_violence') {
        // Reclassify as consent play
        w.subcategory_id = 'sexual_content.consent_ambiguity'
      }
    }
    
    return {
      subcategory_id: w.subcategory_id,
      severity,
      modifiers: w.context_modifiers || [],
      evidence: w.evidence || [],
      severity_signals: signals,
      taxonomy_version: TAXONOMY_VERSION,
      // ... other fields
    }
  })
  
  return processedWarnings
}
```

## 🔑 Key Principles

1. **Always use taxonomy v2.5.0** - Never reference old taxonomy structure
2. **Use hierarchical IDs** - Format: `category_id.subcategory_id`
3. **Compute severity** - Don't use static labels, compute from signals
4. **Include context modifiers** - Add nuance for discrimination/sensitive content
5. **Store evidence** - Track spans, confidence, location
6. **Validate sexual violence** - Use separate evaluation logic
7. **Track taxonomy version** - Store `taxonomy_version: "2.5.0"` with each warning
8. **Require other_note** - If using `other_*` subcategories, require note

## 📝 Database Schema

When saving warnings, include all new fields:
- `category_id` (string)
- `subcategory_id` (string)
- `context_modifiers` (JSONB array)
- `evidence` (JSONB array)
- `severity_signals` (JSONB object)
- `other_note` (TEXT, required for other_*)
- `taxonomy_version` (TEXT, default '2.5.0')
- `presence` (TEXT)
- `detail_level` (TEXT)
- `severity` (computed from signals)

## 🚫 Common Mistakes to Avoid

1. ❌ Using old agent functions
2. ❌ Using flat category structure
3. ❌ Using static severity labels
4. ❌ Not including context modifiers
5. ❌ Not validating sexual violence separately
6. ❌ Not tracking taxonomy version
7. ❌ Not requiring other_note for other_* subcategories



