# BookTok Edge Cases - Potential Issues & Solutions

**Purpose:** Identify edge cases that might cause problems on BookTok specifically

---

## BookTok Context

BookTok is:
- Fast-moving, trend-driven
- Highly engaged with content warnings
- Vocal about taxonomy issues
- Uses specific terminology (CNC, Dub-Con, etc.)
- Has strong opinions about trigger warnings

---

## Edge Case 1: Terminology Mismatches

### Issue
BookTok uses specific terms that might not match our taxonomy exactly.

**Examples:**
- BookTok: "Dead Dove" → Our taxonomy: No specific tag
- BookTok: "Touch Her and You Die" → Our taxonomy: `primal_play` (might not be obvious)
- BookTok: "Age Gap" → Our taxonomy: No specific tag (might be `grooming` or `power_imbalance`)

### Risk
Users might not find what they're looking for, or might think we're missing important tags.

### Solution
✅ **Already addressed:**
- Added `cnc` (Consensual Non-Consent) - matches BookTok terminology
- Added `breeding_kink` - matches BookTok terminology
- Added `primal_play` - covers "Touch Her and You Die" tropes
- Updated `consent_ambiguity` to include "(Dub-Con)" - matches industry term

**Remaining considerations:**
- "Dead Dove" is more of a meta-tag (meaning "this contains exactly what it says on the tin") - not a content warning itself
- "Age Gap" is a trope, not a content warning - but `grooming` covers problematic age gaps
- Consider adding `age_gap` as a subcategory if there's demand, but it's more of a trope than a warning

### Recommendation
Monitor BookTok feedback. If users consistently request specific tags, add them. We've already added the major ones (CNC, breeding kink, etc.).

---

## Edge Case 2: Severity Disagreements

### Issue
BookTok users might disagree with our severity levels.

**Examples:**
- We mark `cnc` as "severe" - some BookTok users might think it should be "moderate" (since it's consensual)
- We mark `breeding_kink` as "moderate" - some might think it should be "severe"
- We mark `primal_play` as "moderate" - some might think it should be "severe"

### Risk
Users might lose trust in the taxonomy if severities don't match their expectations.

### Solution
**Current approach:**
- `cnc` → **severe** (consensual but still intense, needs clear warning)
- `breeding_kink` → **moderate** (kink, not inherently harmful)
- `primal_play` → **moderate** (trope, not inherently harmful)

**Rationale:**
- Severity = Narrative Centrality + Explicitness, not just topic
- CNC is severe because even though it's consensual, it's intense and needs clear warning
- Breeding kink and primal play are moderate because they're kinks/tropes, not inherently harmful

**If users disagree:**
- Acknowledge that severity can be subjective
- Explain our formula: Severity = Narrative Centrality + Explicitness
- Consider user feedback, but maintain consistency

### Recommendation
Monitor BookTok feedback on severity levels. If there's strong consensus that a severity is wrong, consider adjusting. But maintain consistency - don't change severities based on individual complaints.

---

## Edge Case 3: Missing Dark Romance Tags

### Issue
BookTok users might request additional dark romance tags we haven't added.

**Potential requests:**
- "Bully Romance" - might be covered by `bullying` or `emotional_abuse`
- "Mafia Romance" - might be covered by `violence`, `human_trafficking`
- "Reverse Harem" - might be covered by `polyamory` (if we add it) or just `sexual_content`
- "Omegaverse" - might be covered by `breeding_kink`, `primal_play`

### Risk
Users might think we're missing important tags for their favorite genres.

### Solution
**Current coverage:**
- ✅ CNC, Dub-Con, Somnophilia (consent spectrum)
- ✅ Breeding Kink, Knife Play, Primal Play (dark kinks)
- ✅ Human Trafficking, Cannibalism (extreme themes)
- ✅ Grooming, Incest/Pseudo-Incest (problematic dynamics)

**For tropes (Bully Romance, Mafia Romance, etc.):**
- These are tropes, not content warnings
- Our taxonomy covers the *content* (bullying, violence, etc.), not the *trope*
- Users can search for content warnings, not tropes

**If users request specific tags:**
- Evaluate: Is this a content warning or a trope?
- If it's a content warning (e.g., "non-con" is already covered), explain coverage
- If it's a legitimate gap (e.g., we're missing something), add it

### Recommendation
Monitor BookTok feedback. If users consistently request tags that are legitimate content warnings (not just tropes), add them. But maintain the distinction between content warnings and tropes.

---

## Edge Case 4: Over-Tagging vs Under-Tagging

### Issue
BookTok users might complain that we're either:
- **Over-tagging:** Flagging things that don't need warnings
- **Under-tagging:** Missing things that should be warned about

### Risk
Users might lose trust if they think we're either too cautious or not cautious enough.

### Solution
**Our approach:**
- Be comprehensive but accurate
- Flag themes, not brief mentions
- Use severity levels to indicate intensity
- Allow AI/model to adjust based on context

**For over-tagging complaints:**
- Explain that we flag themes, not every mention
- Point to severity levels - "mild" means brief/background
- Acknowledge that some books legitimately have many warnings

**For under-tagging complaints:**
- Acknowledge the gap
- Investigate if it's a legitimate missing tag
- Add it if it's a real content warning (not just a trope)

### Recommendation
Monitor BookTok feedback. If users consistently report missing warnings, investigate and add them. If users complain about over-tagging, explain our approach and severity levels.

---

## Edge Case 5: "Dead Dove" Content

### Issue
"Dead Dove" is a BookTok term meaning "this contains exactly what it says on the tin" - usually for extreme content.

**Examples:**
- A book tagged with many "severe" warnings might be called "Dead Dove"
- Users might expect a "Dead Dove" tag

### Risk
Users might think we're missing an important tag.

### Solution
**"Dead Dove" is a meta-tag, not a content warning:**
- It means "this book has many/extreme warnings"
- It's not a specific content warning itself
- Our taxonomy already covers the actual content (CNC, cannibalism, etc.)

**How to handle:**
- Don't add a "Dead Dove" tag (it's not a content warning)
- If a book has many "severe" warnings, that's the signal
- Users can see the warning list and determine if it's "Dead Dove" content

### Recommendation
Don't add "Dead Dove" as a tag. It's a meta-label, not a content warning. Our taxonomy covers the actual content.

---

## Edge Case 6: Trigger vs Content Warning Terminology

### Issue
BookTok uses "trigger warning" but we use "content warning."

### Risk
Users might think we're being pedantic or missing the point.

### Solution
**Our approach:**
- We use "content warning" because it's more accurate (we're warning about content, not just triggers)
- But we understand BookTok uses "trigger warning"
- The terminology difference is fine - the function is the same

**If users complain:**
- Acknowledge the terminology difference
- Explain that "content warning" is more inclusive (not everyone has "triggers," but everyone can benefit from content information)
- But don't change the terminology - "content warning" is more accurate

### Recommendation
Keep "content warning" terminology. It's more accurate and inclusive. If users complain, explain the difference, but don't change it.

---

## Edge Case 7: Rapid Trend Changes

### Issue
BookTok trends change rapidly. New tropes/kinks/content types emerge quickly.

### Risk
Our taxonomy might feel outdated if we don't keep up with trends.

### Solution
**Our approach:**
- Monitor BookTok feedback
- Add new tags when there's clear demand and they're legitimate content warnings
- Don't add tags for every trend - only for content warnings

**Recent additions show we're keeping up:**
- ✅ Added CNC, breeding kink, knife play (dark romance trends)
- ✅ Added cannibalism (horror romance trend)
- ✅ Added human trafficking (mafia romance trend)

### Recommendation
Monitor BookTok feedback regularly. If users consistently request new tags that are legitimate content warnings (not just tropes), add them. But maintain quality - don't add tags for every trend.

---

## Edge Case 8: Controversial Content (Incest, Grooming, etc.)

### Issue
Some BookTok users might be uncomfortable with tags like `incest_taboo` or `grooming` existing at all.

### Risk
Users might think we're normalizing problematic content by having tags for it.

### Solution
**Our approach:**
- We're descriptive, not prescriptive
- Having a tag doesn't mean we approve of the content
- We're providing information, not judgment

**If users complain:**
- Explain that we flag what exists in books, not what we approve of
- Point to our manifesto: "We help people avoid surprise harm, not avoid books"
- Explain that many readers need to know about these tags to avoid them (or find them, if that's their preference)

### Recommendation
Stand firm. Having tags for controversial content is necessary for transparency. We're not normalizing it - we're providing information about it.

---

## Summary: BookTok-Specific Recommendations

1. ✅ **Already addressed major BookTok terminology** (CNC, Dub-Con, breeding kink, etc.)
2. ✅ **Monitor BookTok feedback** for new tag requests
3. ✅ **Maintain distinction** between content warnings and tropes
4. ✅ **Stand firm on controversial tags** - transparency requires flagging all content
5. ✅ **Keep severity levels consistent** - don't change based on individual complaints
6. ✅ **Don't add meta-tags** like "Dead Dove" - focus on actual content warnings

**The taxonomy is well-positioned for BookTok.** We've already added the major dark romance/kink tags, and our approach (descriptive, neutral, comprehensive) aligns with BookTok's needs.

---

## Quick Response Guide

**If BookTok users say:**
- "You're missing [tag]" → Evaluate if it's a content warning or trope. Add if it's a legitimate content warning.
- "This severity is wrong" → Explain our formula. Consider feedback, but maintain consistency.
- "You need a Dead Dove tag" → Explain it's a meta-tag, not a content warning. Our taxonomy covers the actual content.
- "You're normalizing problematic content" → Explain we're descriptive, not prescriptive. Transparency requires flagging all content.

**We stand confidently behind this design.** 🚀

