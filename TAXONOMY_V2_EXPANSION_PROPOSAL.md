# Taxonomy v2.0 Expansion Proposal
**Focus:** Phobias, Cultural Sensitivities, and Subtle Emotional Triggers

## Executive Summary

The current taxonomy-v2 is solid but has **critical gaps** in areas that matter for user trust, especially for your ~9 daily scans. This proposal addresses:

1. **Specific Phobias** - Not covered at all
2. **LGBTQ+ Specific Discrimination** - Missing acephobia, lesbophobia, misgendering
3. **Cultural Sensitivities** - Needs expansion beyond cultural appropriation
4. **Subtle Emotional Triggers** - Grief processing, divorce, infertility, etc.
5. **Niche Themes** - Cults, occult, police brutality, medical trauma
6. **Tropes/Genre-Specific** - Dark romance tropes, war crimes, etc.

---

## 🎯 Priority 1: Critical Gaps (Must Add)

### 1. **Phobias Category** (NEW)

**Why:** Phobias are highly specific triggers that AI might miss without explicit detection. Users with phobias need precise warnings.

**Proposed Structure:**
```typescript
{
  id: 'phobias',
  userLabel: 'Phobias / Specific Fears',
  shortDescription: 'Specific phobias or fear triggers that may cause anxiety or panic.',
  legacyCategory: 'other',
  subcategories: [
    {
      id: 'snakes',
      userLabel: 'Snakes / Serpents',
      shortDescription: 'Snakes, serpents, or snake-like creatures.',
      defaultSeverityHint: 'mild'
    },
    {
      id: 'spiders',
      userLabel: 'Spiders / Arachnids',
      shortDescription: 'Spiders, arachnids, or spider-like creatures.',
      defaultSeverityHint: 'mild'
    },
    {
      id: 'needles',
      userLabel: 'Needles / Medical Procedures',
      shortDescription: 'Needles, injections, medical procedures, or blood draws.',
      defaultSeverityHint: 'moderate'
    },
    {
      id: 'heights',
      userLabel: 'Heights / Falling',
      shortDescription: 'Heights, falling, vertigo, or high places.',
      defaultSeverityHint: 'mild'
    },
    {
      id: 'water',
      userLabel: 'Water / Drowning',
      shortDescription: 'Water, drowning, deep water, or aquaphobia triggers.',
      defaultSeverityHint: 'moderate'
    },
    {
      id: 'enclosed_spaces',
      userLabel: 'Enclosed Spaces / Claustrophobia',
      shortDescription: 'Enclosed spaces, claustrophobia, being trapped, or confinement.',
      defaultSeverityHint: 'moderate'
    },
    {
      id: 'darkness',
      userLabel: 'Darkness / Nyctophobia',
      shortDescription: 'Darkness, being in the dark, or fear of the dark.',
      defaultSeverityHint: 'mild'
    },
    {
      id: 'blood',
      userLabel: 'Blood / Hemophobia',
      shortDescription: 'Blood, gore, or blood-related medical content.',
      defaultSeverityHint: 'moderate'
    },
    {
      id: 'death_animals',
      userLabel: 'Animal Death',
      shortDescription: 'Animal death, pet death, or harm to animals.',
      defaultSeverityHint: 'severe'
    },
    {
      id: 'other_phobias',
      userLabel: 'Other Phobias',
      shortDescription: 'Other specific phobias or fear triggers not covered above.',
      defaultSeverityHint: 'mild'
    }
  ]
}
```

**AI Detection Strategy:**
- Look for explicit mentions: "snake", "spider", "needle", "drowning", "claustrophobic"
- Check for phobia-related language: "fear of", "terrified by", "panic at the sight of"
- Consider context: medical scenes → needles, underwater scenes → drowning

---

### 2. **Expand Discrimination Category**

**Current:** Has homophobia, transphobia, but missing:
- Acephobia (discrimination against asexual people)
- Lesbophobia (specific discrimination against lesbians)
- Misgendering (deadnaming, wrong pronouns)
- Biphobia (discrimination against bisexual people)
- Queerphobia (general anti-queer sentiment)

**Proposed Additions:**
```typescript
// Add to discrimination subcategories:
{
  id: 'acephobia',
  userLabel: 'Acephobia',
  shortDescription: 'Discrimination against asexual people, invalidation of asexuality, or pressure to be sexual.',
  defaultSeverityHint: 'moderate'
},
{
  id: 'lesbophobia',
  userLabel: 'Lesbophobia',
  shortDescription: 'Discrimination specifically against lesbians or lesbian relationships.',
  defaultSeverityHint: 'severe'
},
{
  id: 'biphobia',
  userLabel: 'Biphobia',
  shortDescription: 'Discrimination against bisexual people, biphobic stereotypes, or invalidation of bisexuality.',
  defaultSeverityHint: 'moderate'
},
{
  id: 'misgendering',
  userLabel: 'Misgendering / Deadnaming',
  shortDescription: 'Misgendering, deadnaming, or use of incorrect pronouns for transgender or non-binary characters.',
  defaultSeverityHint: 'severe'
},
{
  id: 'queerphobia',
  userLabel: 'Queerphobia',
  shortDescription: 'General anti-queer sentiment, queerphobic language, or discrimination against LGBTQ+ people.',
  defaultSeverityHint: 'severe'
}
```

---

### 3. **Medical/Health Category** (NEW)

**Why:** Medical trauma, infertility, chronic illness are common triggers not well-covered.

**Proposed Structure:**
```typescript
{
  id: 'medical_health',
  userLabel: 'Medical / Health',
  shortDescription: 'Medical procedures, health conditions, infertility, or medical trauma.',
  legacyCategory: 'other',
  subcategories: [
    {
      id: 'medical_procedures',
      userLabel: 'Medical Procedures',
      shortDescription: 'Surgery, medical procedures, hospital scenes, or medical trauma.',
      defaultSeverityHint: 'moderate'
    },
    {
      id: 'infertility',
      userLabel: 'Infertility / Pregnancy Loss',
      shortDescription: 'Infertility, miscarriage, stillbirth, or pregnancy loss.',
      defaultSeverityHint: 'severe'
    },
    {
      id: 'chronic_illness',
      userLabel: 'Chronic Illness',
      shortDescription: 'Chronic illness, disability, or long-term health conditions.',
      defaultSeverityHint: 'moderate'
    },
    {
      id: 'cancer',
      userLabel: 'Cancer',
      shortDescription: 'Cancer, cancer treatment, or cancer-related illness.',
      defaultSeverityHint: 'severe'
    },
    {
      id: 'eating_disorders',
      userLabel: 'Eating Disorders',
      shortDescription: 'Eating disorders, disordered eating, or body image issues.',
      defaultSeverityHint: 'moderate'
    },
    {
      id: 'body_horror',
      userLabel: 'Body Horror',
      shortDescription: 'Body horror, extreme body modification, or graphic body-related content.',
      defaultSeverityHint: 'severe'
    },
    {
      id: 'other_medical',
      userLabel: 'Other Medical / Health',
      shortDescription: 'Other medical or health-related content not covered above.',
      defaultSeverityHint: 'moderate'
    }
  ]
}
```

**Note:** Eating disorders could stay in mental_health OR move here. Consider keeping in mental_health for now.

---

### 4. **Expand Toxic Relationships**

**Add explicit subcategories:**
```typescript
// Add to emotional_abuse_or_toxic_relationships:
{
  id: 'stalking',
  userLabel: 'Stalking',
  shortDescription: 'Stalking, obsessive following, or unwanted surveillance.',
  defaultSeverityHint: 'severe'
},
{
  id: 'financial_abuse',
  userLabel: 'Financial Abuse',
  shortDescription: 'Financial abuse, economic control, or financial manipulation.',
  defaultSeverityHint: 'moderate'
}
```

---

### 5. **Religious/Cult Content** (NEW or Expand)

**Why:** Cults, religious trauma, occult themes are common but not explicitly covered.

**Option A: New Category**
```typescript
{
  id: 'religious_cult',
  userLabel: 'Religious / Cult Content',
  shortDescription: 'Religious trauma, cult dynamics, occult themes, or religious persecution.',
  legacyCategory: 'other',
  subcategories: [
    {
      id: 'cult_content',
      userLabel: 'Cult Dynamics',
      shortDescription: 'Cult dynamics, indoctrination, or cult manipulation.',
      defaultSeverityHint: 'moderate'
    },
    {
      id: 'religious_trauma',
      userLabel: 'Religious Trauma',
      shortDescription: 'Religious trauma, religious abuse, or religious-based harm.',
      defaultSeverityHint: 'moderate'
    },
    {
      id: 'occult',
      userLabel: 'Occult / Supernatural',
      shortDescription: 'Occult themes, supernatural elements, or dark magic.',
      defaultSeverityHint: 'mild'
    },
    {
      id: 'excommunication',
      userLabel: 'Excommunication / Religious Exclusion',
      shortDescription: 'Excommunication, religious exclusion, or religious shunning.',
      defaultSeverityHint: 'moderate'
    }
  ]
}
```

**Option B: Add to Discrimination**
- Add `religious_trauma` and `cult_content` as subcategories under discrimination

**Recommendation:** Option A (new category) - religious/cult content is distinct from discrimination.

---

### 6. **Police Brutality / State Violence**

**Add to Violence:**
```typescript
// Add to violence subcategories:
{
  id: 'police_brutality',
  userLabel: 'Police Brutality / State Violence',
  shortDescription: 'Police brutality, state violence, or systemic violence by authorities.',
  defaultSeverityHint: 'severe'
}
```

---

### 7. **Subtle Emotional Triggers**

**Expand Death/Grief:**
```typescript
// Add to death_or_grief subcategories:
{
  id: 'divorce',
  userLabel: 'Divorce / Separation',
  shortDescription: 'Divorce, separation, or relationship breakdown.',
  defaultSeverityHint: 'moderate'
},
{
  id: 'grief_processing',
  userLabel: 'Grief Processing',
  shortDescription: 'Detailed grief processing, mourning, or loss processing.',
  defaultSeverityHint: 'moderate'
}
```

**Note:** "Grief" already exists, but "grief_processing" is more specific about the emotional journey.

---

## 🎯 Priority 2: Enhancements (Should Add)

### 8. **Natural Disasters**

**Add to "Other" or create new category:**
```typescript
// Under "other" category, add:
{
  id: 'natural_disasters',
  userLabel: 'Natural Disasters',
  shortDescription: 'Natural disasters, environmental trauma, or climate-related events.',
  defaultSeverityHint: 'moderate'
}
```

Or create a new category:
```typescript
{
  id: 'environmental_trauma',
  userLabel: 'Environmental Trauma',
  subcategories: [
    { id: 'fire', userLabel: 'Fire', ... },
    { id: 'flood', userLabel: 'Flood', ... },
    { id: 'earthquake', userLabel: 'Earthquake', ... },
    { id: 'natural_disaster', userLabel: 'Natural Disaster', ... }
  ]
}
```

**Recommendation:** Add to "other" for now, can expand later.

---

### 9. **Tropes / Genre-Specific Warnings**

**Challenge:** Tropes are narrative patterns, not content warnings. However, some tropes signal problematic content.

**Proposed:** Add a "Content Patterns" category or use tags:
```typescript
{
  id: 'content_patterns',
  userLabel: 'Content Patterns / Tropes',
  shortDescription: 'Narrative patterns or tropes that may be triggering.',
  legacyCategory: 'other',
  subcategories: [
    {
      id: 'forced_proximity',
      userLabel: 'Forced Proximity',
      shortDescription: 'Forced proximity tropes, being trapped together, or coerced intimacy.',
      defaultSeverityHint: 'moderate'
    },
    {
      id: 'enemies_to_lovers_dark',
      userLabel: 'Dark Enemies-to-Lovers',
      shortDescription: 'Enemies-to-lovers with dark themes, abuse, or problematic dynamics.',
      defaultSeverityHint: 'moderate'
    },
    {
      id: 'age_gap',
      userLabel: 'Age Gap Relationships',
      shortDescription: 'Significant age gaps in romantic relationships.',
      defaultSeverityHint: 'mild'
    },
    {
      id: 'war_crimes',
      userLabel: 'War Crimes',
      shortDescription: 'War crimes, genocide, or mass violence.',
      defaultSeverityHint: 'severe'
    }
  ]
}
```

**Alternative:** Don't add as category, but enhance AI prompt to detect and flag in reasoning.

**Recommendation:** Enhance AI prompt rather than adding category - tropes are too subjective.

---

## 🎯 Priority 3: AI Detection Enhancements

### 10. **Improve AI Context Awareness**

**Current Issue:** AI might miss subtle triggers without explicit mentions.

**Proposed Enhancements to AI Prompt:**

```typescript
// Add to getBaseAgentConfig instructions:

## Subtle Trigger Detection (CRITICAL)

**1. Phobia Detection:**
- Look for explicit mentions: "snake", "spider", "needle", "drowning", "heights"
- Check for phobia-related language: "fear of", "terrified by", "panic at the sight of"
- Consider context: medical scenes → needles, underwater scenes → drowning, dark scenes → darkness
- If phobia is central to plot, flag it even if not explicitly stated

**2. LGBTQ+ Specific Discrimination:**
- **Acephobia**: Look for invalidation of asexuality, pressure to be sexual, "just hasn't met the right person"
- **Lesbophobia**: Specific discrimination against lesbians, fetishization, or invalidation
- **Misgendering**: Deadnaming, wrong pronouns, or refusal to use correct pronouns
- **Biphobia**: Biphobic stereotypes, "not really bi", or invalidation of bisexuality

**3. Cultural Sensitivities:**
- Beyond cultural appropriation, look for:
  - Stereotyping of marginalized groups
  - Problematic representation of Indigenous/First Nations people
  - Orientalism or exoticization
  - White savior narratives
  - Tokenism or lack of meaningful representation

**4. Subtle Emotional Triggers:**
- **Grief Processing**: Not just death, but the emotional journey of processing loss
- **Divorce/Separation**: Relationship breakdown, family separation
- **Infertility**: Not just mentioned, but as a central theme or trauma
- **Medical Trauma**: Hospital scenes, medical procedures, medical emergencies

**5. Context Clues:**
- **Genre Signals**: Horror → check for phobias, dark romance → check for problematic tropes
- **Setting Signals**: Hospital → medical trauma, underwater → drowning, dark → darkness
- **Character Signals**: Trans character → check for misgendering, ace character → check for acephobia

**6. When in Doubt:**
- If a trigger is commonly requested but not explicitly mentioned, flag it with lower confidence (0.4-0.6)
- Use "presence: implied" for subtle triggers
- Use "detail_level: vague" for implied but not explicit content
```

---

## 📊 Implementation Strategy

### Phase 1: Critical Additions (Week 1)
1. ✅ Add Phobias category
2. ✅ Expand Discrimination (acephobia, lesbophobia, misgendering, biphobia, queerphobia)
3. ✅ Add Medical/Health category
4. ✅ Add stalking and financial abuse to toxic relationships
5. ✅ Add police brutality to violence

### Phase 2: Enhancements (Week 2-3)
6. ✅ Add Religious/Cult category
7. ✅ Expand Death/Grief (divorce, grief processing)
8. ✅ Add natural disasters to "other"
9. ✅ Update AI prompt with subtle trigger detection

### Phase 3: Testing & Refinement (Week 4)
10. ✅ Test with known books that have these triggers
11. ✅ Monitor "other" subcategory usage
12. ✅ Gather user feedback on new categories

---

## 🎯 Cost Considerations

**Current:** ~$0.03/day for ~9 scans

**Impact of Expansion:**
- **Taxonomy size:** +50-60 subcategories (manageable)
- **AI prompt length:** +200-300 words (minimal cost increase)
- **Detection accuracy:** Should improve (fewer false negatives)
- **User trust:** Should increase significantly

**Estimated cost increase:** <$0.01/day (negligible)

---

## 🔍 Testing Strategy

### Test Books with Known Triggers:

1. **Phobias:**
   - Books with snakes: "Harry Potter" (basilisk)
   - Books with spiders: "The Hobbit" (Shelob)
   - Books with needles: Medical memoirs

2. **LGBTQ+ Discrimination:**
   - Books with ace characters: Check for acephobia
   - Books with trans characters: Check for misgendering
   - Books with lesbians: Check for lesbophobia

3. **Medical/Health:**
   - Books about infertility: "The Handmaid's Tale"
   - Books about cancer: Various memoirs
   - Books with medical trauma: Medical thrillers

4. **Cults:**
   - "The Handmaid's Tale" (religious cult)
   - "Educated" (religious extremism)

5. **Police Brutality:**
   - "The Hate U Give"
   - "Just Mercy"

---

## 📈 Expected Outcomes

### User Trust Improvements:
- **More comprehensive warnings** → Users feel safer
- **Specific phobia warnings** → Users with phobias can avoid triggers
- **LGBTQ+ specific warnings** → Better representation and safety
- **Subtle trigger detection** → Fewer missed warnings

### AI Accuracy Improvements:
- **Explicit categories** → AI has clear guidance
- **Enhanced prompts** → Better context awareness
- **Fewer false negatives** → More complete warnings

### Business Impact:
- **Higher user trust** → More scans, more engagement
- **Better SEO** → More comprehensive warnings = better search results
- **Competitive advantage** → More detailed than competitors

---

## ✅ Recommendation

**Implement Priority 1 items immediately:**
1. Phobias category
2. Expanded LGBTQ+ discrimination
3. Medical/Health category
4. Stalking/financial abuse
5. Police brutality

**These address the most critical gaps** mentioned in your research and will significantly improve user trust for your ~9 daily scans.

**Priority 2 can follow** based on user feedback and usage patterns.

---

## 📝 Next Steps

1. **Update taxonomy-v2.ts** with new categories/subcategories
2. **Update AI prompt** with subtle trigger detection
3. **Test with known books** that have these triggers
4. **Monitor usage** of new categories
5. **Gather user feedback** on completeness

