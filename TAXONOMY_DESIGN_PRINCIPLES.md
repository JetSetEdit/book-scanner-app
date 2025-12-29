# Taxonomy Design Principles & Internal Guidelines

**Version:** 2.3.0  
**Last Updated:** January 2025

---

## Core Philosophy

> **"We help people avoid surprise harm, not avoid books."**

This taxonomy is a **navigation system**, not a moral framework.

---

## Design Principles

### 1. Reader-First, Not Institutional

- **Descriptive, not prescriptive**: "Contains depictions of..." not "Problematic" or "Harmful"
- **Neutral language**: Avoid moral judgments or culture-war language
- **Practical over academic**: Use how real people talk about content, not academic jargon

### 2. Category → Subcategory Hierarchy

- **Intuitive structure**: Mirrors how people naturally categorize content
- **Examples:**
  - Mental Health → PTSD / Trauma
  - Violence → Domestic Violence
  - Sexual Content → Non-consensual Acts

### 3. Default Severity Guidelines

**Severity = Narrative Centrality + Explicitness**

Not just topic existence.

**Severity Levels:**
- **Mild**: Background themes, implied content, or brief mentions
- **Moderate**: Present but not central, some detail, or moderate explicitness
- **Severe**: Central to plot, graphic/explicit, or highly detailed

**Examples that work:**
- Self-harm → **severe** (always explicit, central to impact)
- PTSD / trauma → **moderate** (varies by narrative role)
- Anxiety → **mild** (often background, less explicit)
- Sexual assault → **severe** (always severe regardless of detail level)

**Note:** Some subcategories (depression, grief, addiction) sit on the mild/moderate line depending on audience and narrative role. This is intentional and acceptable.

### 4. Overlap is Allowed and Intentional

**Important:** Categories may overlap emotionally for users, and that's okay.

**Examples:**
- **Mental Health → Self-Harm** and **Violence → Self-directed violence** (if added)
- **Emotional Abuse → Gaslighting** and **Mental Health → PTSD**
- **Violence → Domestic Violence** and **Emotional Abuse → Domestic Abuse**

**Rationale:**
- Different users may search different categories
- Some content legitimately belongs in multiple categories
- Overlap provides multiple entry points for users

**Internal Rule:** If content fits multiple categories, it's acceptable to tag it in both. The taxonomy is a navigation system, not a strict classification.

### 5. Neutral Descriptors

**Use:**
- "Contains depictions of..."
- "Includes themes of..."
- "Descriptions of..."
- "Scenes involving..."

**Avoid:**
- "Problematic"
- "Disturbing"
- "Harmful"
- "Inappropriate"
- Moral judgments

### 6. Audience Considerations

**Primary Audiences:**
1. **BookTok readers** - Need specificity and agency
2. **Parents** - Need clarity and speed for "is this okay?" checks
3. **Librarians/Educators** - Need clarity, not vibes

**Design for:**
- Fast scanning
- Non-expert readability
- Transparency and choice
- No patronizing language

---

## Taxonomy Structure

### Categories (14 total)
1. Mental Health
2. Sexual Content
3. Emotional Abuse / Toxic Relationships
4. Bullying / Social Cruelty
5. Violence
6. Substance Use
7. Death / Grief
8. Discrimination
9. Coarse Language
10. Phobias / Specific Fears
11. Medical / Health
12. Religious / Cult Content
13. Family Dynamics
14. Other

### Subcategories (125 total)
- Hierarchical structure
- Each has: ID, user label, short description, default severity hint

---

## Handling Edge Cases

### 1. Severity Ambiguity

**Rule:** When in doubt, use the default severity hint, but allow AI/model to adjust based on:
- Narrative centrality (is it central to plot?)
- Explicitness (how graphic/detailed?)
- Context (genre, target audience signals)

### 2. Category Overlap

**Rule:** Tag in all relevant categories. Don't force a single category.

**Example:** A book with domestic violence that causes PTSD:
- Tag: `violence.domestic_violence`
- Tag: `emotional_abuse_or_toxic_relationships.domestic_abuse`
- Tag: `mental_health.ptsd` (if PTSD is depicted)

### 3. Dark Romance / Kink Content

**Rule:** Use specific tags (CNC, breeding kink, etc.) rather than generic "taboo" when applicable.

**Rationale:** Dark romance readers need specificity. Generic tags don't help.

### 4. Cultural Sensitivity

**Rule:** Use specific discrimination tags (antisemitism, islamophobia, fatphobia) rather than generic "religious discrimination" or "discrimination" when applicable.

**Rationale:** Granularity matches LGBTQ+ discrimination tags for consistency.

---

## Future Considerations

### 1. UX Presentation Modes

**Current:** One taxonomy serves all audiences

**Future Option:** Keep taxonomy, change presentation:
- **Parent mode:** Collapsed, severity-focused
- **BookTok mode:** Expanded, detailed, tag-focused
- **Librarian mode:** Full taxonomy with descriptions

**Note:** This is a UX decision, not a taxonomy problem.

### 2. Severity Refinement

As database grows, monitor:
- Are "moderate" tags being used consistently?
- Do users find severity levels helpful?
- Should we add a "varies" option for ambiguous cases?

### 3. Category Expansion

**Rule:** Add new categories/subcategories when:
- There's clear user demand (e.g., emetophobia, dark romance tags)
- It provides meaningful specificity (not just splitting hairs)
- It aligns with how readers actually talk about content

---

## Response to Criticism

### If someone says: "This is too much"

**Response:**
- It's optional - users choose to view warnings
- It's descriptive - we're not telling you what to read
- It's transparent - you see exactly what's flagged
- It respects reader choice - you decide what matters

### If someone says: "This ruins reading"

**Response:**
- We help people avoid *surprise harm*, not avoid books
- Many readers use warnings to *find* books they want to read
- Warnings enable choice, not restriction

### If someone says: "This is censorship"

**Response:**
- We're not removing content, we're adding information
- Transparency is not censorship
- Readers have a right to know what they're reading

---

## One-Sentence Manifesto

> **"We provide transparent, neutral content warnings so readers can make informed choices about what they read, without judgment or moralizing."**

---

## Internal Documentation

### Overlap Documentation

**Intentional Overlaps:**
- Mental Health ↔ Violence (self-harm, suicide)
- Emotional Abuse ↔ Violence (domestic violence/abuse)
- Sexual Content ↔ Violence (sexual violence)
- Discrimination ↔ Emotional Abuse (bullying, social cruelty)

**Rule:** When content fits multiple categories, tag in all relevant ones. This is by design.

### Severity Consistency

**Formula:** Severity = Narrative Centrality + Explicitness

**Examples:**
- **Mild:** Brief mention, background theme, implied
- **Moderate:** Present but not central, some detail
- **Severe:** Central to plot, graphic/explicit, highly detailed

**Note:** Some topics (depression, grief, addiction) can be mild or moderate depending on narrative role. This is acceptable.

---

## Conclusion

This taxonomy is:
- ✅ Structured
- ✅ Neutral
- ✅ Practical
- ✅ Readable by non-experts

It serves:
- ✅ BookTok readers (specificity, agency)
- ✅ Parents (clarity, speed)
- ✅ Librarians/Educators (clarity, not vibes)

**We stand confidently behind this design.** 🚀

