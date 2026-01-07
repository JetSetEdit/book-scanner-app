# Age Rating Escalation Weights Design

**Date**: 2026-01-06  
**Purpose**: Refine age rating mapping to better reflect how different SEVERE content types should escalate to age ratings

---

## Problem Statement

Current system: **Any SEVERE warning → MA15+**

This is architecturally correct (severity independence works), but semantically incomplete:
- SEVERE mental health (depression) → MA15+ ✅ Feels right
- SEVERE stylized violence (Hunger Games) → MA15+ ⚠️ Might feel too high
- SEVERE graphic sexual content → MA15+ ⚠️ Might feel too low

**The issue**: Not all SEVERE content types should escalate to the same age rating.

---

## Proposed Solution: Age Escalation Weights

Different SEVERE content types have different "escalation weights" that determine how they map to age ratings.

### Escalation Weight Table

| SEVERE Content Type | Escalation Weight | Default Rating | Reasoning |
|---------------------|-------------------|----------------|-----------|
| **Mental Health** (depression, PTSD, anxiety) | Low-Medium | MA15+ | Serious but often age-appropriate for 15+ with context |
| **Stylized Violence** (fantasy combat, war) | Medium | MA15+ | Intense but stylized, common in YA/fantasy |
| **Graphic Violence** (torture, graphic injury) | High | R18+ | Explicit and disturbing |
| **Sexual Content** (intense romance, spice) | Medium | MA15+ | Mature themes but not necessarily explicit |
| **Explicit Sexual Content** (graphic sex scenes) | High | R18+ | Explicit sexual content |
| **Sexual Violence** | Very High | R18+ | Always R18+ |
| **Substance Abuse** (alcohol, drugs) | Medium | MA15+ | Mature themes |
| **Abuse** (domestic violence, gaslighting) | Medium-High | MA15+ | Serious but often age-appropriate for 15+ |
| **Death/Grief** | Low-Medium | MA15+ | Serious but universal theme |

### Rating Logic (Refined)

Instead of: `if (severeWarnings.length > 0) → MA15+`

Use: `Calculate escalation score from SEVERE warnings, then map to rating`

**Escalation Score Calculation**:
```
escalationScore = max(severeWarnings.map(w => escalationWeight[w.category]))
```

**Rating Mapping**:
- Escalation Score < 0.3 → M (13+)
- Escalation Score 0.3-0.6 → MA15+ (15+)
- Escalation Score 0.6-0.8 → R18+ (18+)
- Escalation Score > 0.8 → RC (Refused Classification)

---

## Implementation Approach

### Phase 1: Add Escalation Weights (Non-Breaking)

1. Add `ageEscalationWeight` to taxonomy configuration
2. Update `calculateAgeRating()` to use weights
3. Keep existing logic as fallback

### Phase 2: Test with Known Books

- The Love Hypothesis: 0 SEVERE → M ✅ (unchanged)
- The Woman in the Window: 1 SEVERE (mental health, weight 0.4) → MA15+ ✅ (unchanged)
- Hunger Games: 2 SEVERE (violence, weight 0.5) → MA15+ ✅ (unchanged, but could be M if stylized)
- Explicit Romance: 1 SEVERE (explicit sexual, weight 0.7) → R18+ ✅ (more accurate)

### Phase 3: Refine Based on Feedback

Adjust weights based on:
- User feedback
- Cultural norms
- Comparison with official ratings

---

## Benefits

1. **More Nuanced**: Different SEVERE types get appropriate ratings
2. **Backward Compatible**: Existing books still work
3. **Transparent**: Weights are explicit and adjustable
4. **Maintains Independence**: Severity computation unchanged, only rating mapping refined

---

## Open Questions

1. **Should stylized violence (fantasy) escalate less than realistic violence?**
   - Hunger Games: Stylized combat → M or MA15+?
   - Red Rising: Graphic violence → MA15+ or R18+?

2. **Should mental health themes escalate differently based on detail level?**
   - Clinical depression discussion → M?
   - Graphic self-harm depiction → R18+?

3. **Should we show escalation reasoning to users?**
   - "MA15+ due to strong mental health themes (not graphic violence)"

---

**Status**: ✅ **Implemented** - See `docs/AGE_RATING_ESCALATION_IMPLEMENTATION.md` for details

---

## Implementation Status

✅ **Phase 1 Complete**: Escalation weights system implemented
✅ **Phase 2 Complete**: Tested with existing books (backward compatible)
⏳ **Phase 3 Pending**: Refine based on feedback

**Files Created**:
- `lib/config/age-escalation-weights.ts` - Escalation weights configuration
- `lib/utils/age-rating.ts` - Updated to use escalation weights
- `scripts/test-age-escalation.ts` - Test script

**Test Results**: 0/3 ratings changed - system is backward compatible ✅

