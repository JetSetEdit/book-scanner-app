# Classification Agent Proposal

**Problem:** Current system uses fixed score-to-severity mapping (0.0-0.30 = mild, 0.31-0.55 = mild, etc.), which doesn't consider context.

**Solution:** Dedicated classification agent that considers multiple factors to determine severity.

---

## Current System

### How It Works Now:
1. Content Warning Agent assigns a score (0.0-1.0)
2. Score is mapped to severity using fixed thresholds:
   - 0.0-0.30: none
   - 0.31-0.55: mild
   - 0.56-0.80: moderate
   - 0.81-1.0: severe

### Problems:
- ❌ Doesn't consider context (presence, detail_level, narrative centrality)
- ❌ Same score can mean different things in different contexts
- ❌ Category-specific rules not applied
- ❌ No nuanced decision-making

**Example Problem:**
- Score: 0.65 (would map to "moderate")
- But: Graphic sexual violence, on-page, central to plot
- Should be: **SEVERE** (sexual violence is always severe when graphic)

---

## Proposed System

### How It Would Work:
1. Content Warning Agent assigns a score (0.0-1.0) and context
2. **Classification Agent** analyzes all factors:
   - Score (starting point)
   - Presence (on_page, off_page, referenced, implied)
   - Detail Level (graphic, moderate, vague, clinical)
   - Narrative Centrality (central, significant, background)
   - Frequency (repeated, multiple, single, brief)
   - Category sensitivity (sexual violence = always severe)
   - Genre context
3. Classification Agent determines severity: **mild**, **moderate**, or **severe**
4. Returns severity + reasoning + confidence

### Benefits:
- ✅ Context-aware decisions
- ✅ Category-specific rules applied
- ✅ More accurate severity assessment
- ✅ Better reasoning for users
- ✅ Confidence scores for transparency

---

## Implementation

### New File: `lib/services/severity-classification-agent.ts`

**Key Functions:**
- `classifySeverity(context)` - Classify single warning
- `classifySeverities(contexts[])` - Batch classify

**Integration Points:**
1. After content warning generation, call classification agent
2. Replace `getSeverityFromScore()` with classification result
3. Store classification reasoning alongside warning

### Modified Files:
- `lib/content-warning-agent.ts` - Call classification agent after generation
- `lib/services/scan-service.ts` - Use classified severity instead of mapped

---

## Example Classification

**Input:**
```typescript
{
  category_id: "sexual_content",
  subcategory_id: "sexual_violence",
  description: "Contains graphic sexual assault scene",
  score: 0.75,
  presence: "on_page",
  detail_level: "graphic",
  narrative_centrality: "central",
  frequency: "single"
}
```

**Classification Agent Output:**
```typescript
{
  severity: "severe",  // Not "moderate" (which score would suggest)
  confidence: "high",
  reasoning: "Sexual violence is always severe, especially when graphic, on-page, and central to plot. This requires the highest severity rating.",
  factors_considered: [
    "Category: sexual_violence (always severe)",
    "Detail level: graphic",
    "Presence: on_page (shown directly)",
    "Narrative centrality: central to plot"
  ]
}
```

---

## Cost Considerations

**Additional API Calls:**
- One classification call per warning
- ~500-1000 tokens per classification
- Cost: ~$0.001-0.002 per warning (GPT-4o)

**Optimization Options:**
1. **Batch classification** - Classify multiple warnings in one call
2. **Cache classifications** - Cache by (category, subcategory, score, presence, detail_level)
3. **Selective classification** - Only classify edge cases (scores near thresholds)
4. **Fallback to mapping** - Use classification for important warnings, mapping for others

---

## Migration Strategy

### Phase 1: Add Classification (Optional)
- Add classification agent
- Use classification for new warnings
- Keep score-based mapping as fallback
- Compare results

### Phase 2: Make Default
- Make classification default for all warnings
- Keep score-based as fallback only
- Monitor accuracy improvements

### Phase 3: Optimize
- Add caching
- Batch processing
- Selective classification

---

## Comparison

### Current (Score-Based):
```
Score: 0.65 → Moderate
```

### Proposed (Classification Agent):
```
Score: 0.65
+ Context: graphic, on_page, central
+ Category: sexual_violence
→ Classification: SEVERE
Reasoning: "Sexual violence is always severe when graphic and on-page"
```

---

## Recommendation

**Implement classification agent** because:
1. ✅ More accurate severity assessment
2. ✅ Better user trust (reasoning provided)
3. ✅ Category-specific rules applied correctly
4. ✅ Context-aware decisions
5. ✅ Low cost (~$0.001-0.002 per warning)

**Optimization:**
- Start with batch classification (multiple warnings per call)
- Add caching for common patterns
- Use selective classification (only for edge cases or important categories)

---

## Next Steps

1. ✅ Create classification agent (`lib/services/severity-classification-agent.ts`)
2. ⚠️ Integrate into content warning generation flow
3. ⚠️ Test on sample books
4. ⚠️ Compare accuracy vs. score-based mapping
5. ⚠️ Add caching/optimization
6. ⚠️ Deploy

