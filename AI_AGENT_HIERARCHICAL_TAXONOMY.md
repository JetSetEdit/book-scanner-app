# AI Agent Updates for Hierarchical Taxonomy

## Overview
This document outlines the changes needed to update the AI agent (`lib/content-warning-agent.ts`) to use the hierarchical taxonomy structure (v2.0) with parent-child categories.

## Key Changes Required

### 1. Update Imports
```typescript
// OLD
import { WARNING_CATEGORIES, SEVERITY_MAPPING, getSeverityFromScore } from "./config/taxonomy";

// NEW
import { 
  WARNING_CATEGORIES, 
  SEVERITY_MAPPING, 
  getSeverityFromScore,
  getValidSubcategoriesForCategory,
  validateSubcategoryParent 
} from "./config/taxonomy-v2";
```

### 2. Update ContentWarningSchema
```typescript
const ContentWarningSchema = z.object({
  category_id: z.enum([
    'mental_health',
    'sexual_content',
    'emotional_abuse_or_toxic_relationships',
    'bullying_or_social_cruelty',
    'violence',
    'substance_use_or_alcohol',
    'death_or_grief',
    'discrimination',
    'language',
    'other'
  ]),
  subcategory_id: z.string().optional().nullable().describe(
    "Specific subcategory ID. MUST belong to the parent category_id. " +
    "If not provided, the warning will use the parent category only. " +
    "See valid subcategories per category below."
  ),
  description: z.string().describe("User-facing description of the content"),
  score: z.number().min(0).max(1).describe("Severity score from 0.0 to 1.0"),
  reasoning: z.string().describe("Technical explanation for the score"),
  is_author_verified: z.boolean().optional().default(false),
  source_url: z.string().optional().nullable(),
}).refine(
  (data) => {
    // If subcategory_id is provided, validate it belongs to the parent
    if (data.subcategory_id) {
      return validateSubcategoryParent(data.category_id, data.subcategory_id);
    }
    return true; // subcategory_id is optional
  },
  {
    message: "subcategory_id must belong to the specified category_id",
    path: ["subcategory_id"]
  }
);
```

### 3. Update AI Prompt Instructions

Add this section to `getBaseAgentConfig()` instructions:

```typescript
## Hierarchical Taxonomy (v2.0)

You MUST use the hierarchical taxonomy structure. Each warning has:
- **category_id**: The parent category (required)
- **subcategory_id**: A specific subcategory under the parent (optional but recommended)

### Valid Subcategories by Category:

${WARNING_CATEGORIES.map(cat => `
**${cat.userLabel}** (category_id: \`${cat.id}\`)
${cat.subcategories.map(sub => `- \`${sub.id}\`: ${sub.shortDescription} (default severity: ${sub.defaultSeverityHint || 'varies'})`).join('\n')}
`).join('\n')}

### Rules:
1. **Always specify a subcategory_id when possible** - This provides more specific warnings
2. **subcategory_id MUST belong to its parent category_id** - Validation will fail if mismatched
3. **If unsure of subcategory**, use the parent category only (leave subcategory_id null)
4. **Multiple warnings per category are allowed** - Each warning can have a different subcategory
5. **Example**: A book with both "Disordered Eating" and "Anxiety" would have:
   - Warning 1: `category_id: "mental_health"`, `subcategory_id: "disordered_eating"`
   - Warning 2: `category_id: "mental_health"`, `subcategory_id: "anxiety"`

### Common Patterns:
- **Mental Health Issues**: Use specific subcategories (`anxiety`, `depression`, `disordered_eating`, etc.)
- **Violence**: Specify type (`graphic_violence`, `weapons`, `domestic_violence`, `kidnapping_confinement`, etc.)
- **Death/Grief**: Be specific (`character_death`, `grief`, `pregnancy_miscarriage`, `near_death`, etc.)
- **Toxic Relationships**: Specify type (`gaslighting`, `manipulation`, `cheating`, `toxic_friendships`, etc.)
```

### 4. Add Post-Validation

After AI returns warnings, validate them:

```typescript
// Validate subcategory_id matches parent category_id
const validatedWarnings = mappedWarnings.map(w => {
  if (w.subcategory_id && !validateSubcategoryParent(w.category_id, w.subcategory_id)) {
    console.warn(`Invalid subcategory ${w.subcategory_id} for category ${w.category_id}, removing subcategory`);
    return { ...w, subcategory_id: null };
  }
  return w;
});
```

### 5. Update Database Save Logic

When saving warnings to database, include `subcategory_id`:

```typescript
const { error } = await supabaseAdmin
  .from('content_warnings')
  .insert({
    book_id: bookId,
    category_id: warning.category_id,
    subcategory_id: warning.subcategory_id || null, // NEW FIELD
    description: warning.description,
    severity: warning.severity,
    // ... other fields
  });
```

## Implementation Checklist

- [ ] Update imports to use `taxonomy-v2`
- [ ] Update `ContentWarningSchema` to include `subcategory_id`
- [ ] Add validation refine() to schema
- [ ] Update AI prompt instructions with hierarchical taxonomy
- [ ] Add post-validation logic
- [ ] Update database insert logic to include `subcategory_id`
- [ ] Test with sample books
- [ ] Verify backward compatibility (warnings without subcategory_id still work)

## Testing Strategy

1. **Test with books that have multiple warnings in same category** (e.g., Icebreaker)
2. **Verify subcategory validation** - Try invalid combinations, ensure they're caught
3. **Test backward compatibility** - Warnings without subcategory_id should still work
4. **Verify AI understands hierarchy** - Check that AI assigns correct subcategories

## Example Output

```json
{
  "content_warnings": [
    {
      "category_id": "mental_health",
      "subcategory_id": "disordered_eating",
      "description": "Disordered eating",
      "score": 0.45,
      "severity": "mild",
      "reasoning": "..."
    },
    {
      "category_id": "mental_health",
      "subcategory_id": "anxiety",
      "description": "Mental health (anxiety and stress)",
      "score": 0.40,
      "severity": "mild",
      "reasoning": "..."
    }
  ]
}
```

This allows multiple specific warnings under the same parent category!

