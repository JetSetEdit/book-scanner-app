# Support Resources Triggers

This document maps which warning types trigger which support resource sections.

## Quick Reference

| Support Resource Section | Triggered By |
|-------------------------|--------------|
| **Mental Health & Crisis Support** | Any `mental_health` warning OR keywords: suicide, depression, self-harm, anxiety, PTSD, trauma, eating disorder |
| **Domestic Violence & Sexual Assault** | `violence` (with specific subcategories) OR `emotional_abuse_or_toxic_relationships` OR `sexual_content` with `sexual_violence` subcategory |
| **LGBTIQA+ Support** | `discrimination` with LGBTQIA+ subcategories (queerphobia, homophobia, transphobia, etc.) |
| **Substance Use & Addiction** | `substance_use_or_alcohol` category OR keywords: addiction, drug, alcohol, overdose, substance |
| **Grief & Bereavement** | `death_or_grief` category OR keywords: grief, bereavement, mourning, funeral, death, terminal |
| **Bullying Support** | `bullying_or_social_cruelty` category OR keywords: bullying, hazing, cyberbullying |
| **Racism & Discrimination** | `discrimination` with subcategories: racism, cultural_appropriation, antisemitism, islamophobia |

---

## Detailed Breakdown

### 1. Mental Health & Crisis Support

**Triggers:**
- **Category:** `mental_health` (any subcategory)
- **Legacy Categories:** `mental_health`, `suicide`, `self_harm`
- **Keywords in description:** suicide, depression, self-harm, self harm, anxiety, ptsd, trauma, eating disorder

**Subcategories that trigger:**
- `disordered_eating`
- `anxiety`
- `depression`
- `ptsd`
- `self_harm`
- `suicidal_ideation`
- `suicide_minor`
- `casual_suicidal_ideation`
- `workplace_burnout`
- `academic_pressure`

**Services Shown:**
- Lifeline (13 11 14)
- Beyond Blue (1300 22 4636)
- Kids Helpline (1800 55 1800)
- MensLine (1300 78 99 78)
- State-specific mental health services (if available)

---

### 2. Domestic Violence & Sexual Assault

**Triggers:**
- **Categories:**
  - `violence` (with specific subcategories)
  - `emotional_abuse_or_toxic_relationships` (any subcategory)
  - `bullying_or_social_cruelty` (any subcategory)
- **Violence Subcategories:**
  - `domestic_violence`
  - `graphic_violence`
  - `violence_against_women`
  - `violence_against_children`
  - `torture`
  - `kidnapping_confinement`
  - `human_trafficking`
  - `infanticide_or_intentional_child_harm`
  - `physical_violence`
- **Sexual Violence:**
  - `sexual_content` category with `sexual_violence` subcategory
- **Keywords in description:** domestic violence, abuse, assault, torture, kidnapping, trafficking, sexual assault, rape, sexual violence

**Services Shown:**
- 1800RESPECT (1800 737 732)
- DVConnect (1800 811 811)
- Safe Steps (1800 015 188)
- State-specific domestic violence services (if available)

**Also Triggers:**
- **Quick Exit Button** (if user has enabled it in preferences)

---

### 3. LGBTIQA+ Support

**Triggers:**
- **Discrimination Subcategories:**
  - `queerphobia`
  - `homophobia`
  - `transphobia`
  - `lesbophobia`
  - `biphobia`
  - `acephobia`
  - `misgendering`
- **Keywords in description:** queerphobia, homophobia, transphobia, lgbt, lgbtq, lgbtqia, queer, gay, lesbian, transgender, trans

**Note:** Only LGBTQIA+ specific discrimination triggers this. Other discrimination types (racism, classism, sexism, etc.) do NOT trigger LGBTIQA+ support.

**Services Shown:**
- QLife (1800 184 527)
- Minus18 (Youth Support)
- Switchboard (1800 184 527)
- TransHub (Resources)
- State-specific LGBTIQA+ services (if available)

---

### 4. Substance Use & Addiction

**Triggers:**
- **Category:** `substance_use_or_alcohol` (any subcategory)
- **Legacy Category:** `substance_abuse`
- **Keywords in description:** addiction, drug, alcohol, overdose, substance

**Subcategories:**
- `alcohol`
- `drug_use`
- `addiction`
- `overdose`
- `other_substance_use`

**Services Shown:**
- Alcohol & Drug Foundation (1300 85 85 84)
- DirectLine (1800 888 236)
- Counselling Online (24/7 Support)
- State-specific substance use services (if available)

---

### 5. Grief & Bereavement

**Triggers:**
- **Category:** `death_or_grief` (any subcategory)
- **Legacy Category:** `death`
- **Keywords in description:** grief, bereavement, mourning, funeral, death, terminal

**Subcategories:**
- `character_death`
- `terminal_illness`
- `grief`
- `funeral_scenes`
- `miscarriage_abortion`
- `animal_death`
- `grief_processing`
- `near_death`
- `past_death`
- `pregnancy_childbirth`

**Services Shown:**
- GriefLine (1300 845 745)
- Australian Centre for Grief (1800 642 066)
- Lifeline (13 11 14)

---

### 6. Bullying Support

**Triggers:**
- **Category:** `bullying_or_social_cruelty` (any subcategory)
- **Keywords in description:** bullying, hazing, cyberbullying

**Subcategories:**
- `bullying`
- `hazing`
- `public_humiliation`
- `social_pressure`
- `other_social_cruelty`

**Services Shown:**
- Kids Helpline (1800 55 1800)
- eSafety (Online Safety)
- Bullying No Way (Resources)

---

### 7. Racism & Discrimination

**Triggers:**
- **Discrimination Subcategories:**
  - `racism`
  - `cultural_appropriation`
  - `antisemitism`
  - `islamophobia`
- **Keywords in description:** racism, racial, antisemitism, islamophobia

**Note:** Only these specific discrimination subcategories trigger this. Other discrimination types (classism, sexism, LGBTQIA+ discrimination, etc.) do NOT trigger racism support.

**Services Shown:**
- Australian Human Rights (1300 656 419)
- Lifeline (13 11 14)
- Beyond Blue (1300 22 4636)

---

## Quick Exit Button

**Triggers:**
- `hasAbuseOrViolence` OR `hasSexualAssault` is true
- AND user has `enableQuickExit` preference enabled (default: true)

**Behavior:**
- Redirects to `https://www.google.com` when clicked
- Also accessible via Escape key
- Appears as floating button (top-right) and inline in support resources section

---

## Examples

### Example 1: Book with Classism Warning
- **Warning:** `discrimination` category, `classism` subcategory
- **Triggers:** None (classism is not a trigger for any support resources)
- **Result:** No support resources shown

### Example 2: Book with Homophobia Warning
- **Warning:** `discrimination` category, `homophobia` subcategory
- **Triggers:** LGBTIQA+ Support
- **Result:** Shows LGBTIQA+ support resources

### Example 3: Book with Domestic Violence Warning
- **Warning:** `violence` category, `domestic_violence` subcategory
- **Triggers:** Domestic Violence & Sexual Assault resources, Quick Exit button
- **Result:** Shows domestic violence resources and quick exit button

### Example 4: Book with Multiple Warnings
- **Warnings:** 
  - `mental_health` category, `depression` subcategory
  - `death_or_grief` category, `character_death` subcategory
  - `discrimination` category, `racism` subcategory
- **Triggers:** Mental Health, Grief & Bereavement, Racism & Discrimination
- **Result:** Shows all three support resource sections

---

## Important Notes

1. **Subcategory vs Category:** Most detection logic checks both the category ID and subcategory ID to ensure accuracy. For example, `racism` is a subcategory of `discrimination`, not a top-level category.

2. **Keyword Fallback:** All detection logic includes keyword matching in the warning description as a fallback, in case the category/subcategory structure doesn't match.

3. **Multiple Sections:** Multiple support resource sections can appear if multiple warning types are present. They are displayed in a specific order with visual separators.

4. **State-Specific Services:** If the user's state is detected (via IP geolocation), state-specific services are shown first, followed by national services.

5. **Quick Exit Button:** Only appears for highly sensitive content (domestic violence, sexual assault) and only if the user has enabled it in preferences.
