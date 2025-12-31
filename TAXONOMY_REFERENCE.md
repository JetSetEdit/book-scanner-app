# Content Warning Taxonomy v2.0

**Version:** 2.0.0  
**Model:** gpt-4o-2024-11-20

This document provides a complete reference of all content warning categories and subcategories used in Subtext.

---

## Purpose

The taxonomy serves several critical functions in the Subtext system:

### 1. **AI Agent Guidance**
   - Provides a structured framework for the AI to categorize content warnings
   - Ensures consistent, standardized warnings across all books
   - Prevents the AI from creating arbitrary or inconsistent categories
   - Guides the AI to use specific subcategories for granular warnings

### 2. **Data Consistency**
   - Standardizes how warnings are stored in the database
   - Enables reliable querying and filtering (e.g., "show all books with sexual violence")
   - Allows for statistical analysis (e.g., "how many books have mental health warnings?")
   - Supports data migration and updates

### 3. **User Experience**
   - Provides clear, user-friendly labels for warnings
   - Groups related warnings together (e.g., all mental health issues under one category)
   - Enables filtering and searching by category
   - Makes warnings more scannable and understandable

### 4. **Severity Calculation**
   - Default severity hints guide the AI's initial assessment
   - Helps determine content rating classifications (G, PG, M, MA15+, R18+)
   - Provides baseline expectations for each warning type

### 5. **Contextual Information**
   - Supports metadata like "presence" (on_page, flashback, referenced, etc.)
   - Enables "detail level" tracking (graphic, moderate, vague, clinical)
   - Helps users understand not just *what* but *how* content appears

### 6. **Scalability**
   - Hierarchical structure allows adding new subcategories without breaking existing data
   - Backward compatible (warnings can use parent categories only)
   - Easy to extend with new categories as needed

---

## Taxonomy Structure

The taxonomy uses a **hierarchical parent-child structure**:
- **Parent Categories**: High-level groupings (e.g., "Mental Health", "Violence")
- **Subcategories**: Specific warnings under each parent (e.g., "Anxiety", "Graphic Violence")

Each subcategory includes:
- **ID**: Technical identifier (used in database)
- **User Label**: Display name for users
- **Description**: What the warning covers
- **Default Severity Hint**: Typical severity level (mild/moderate/severe)

---

## 1. Mental Health

**Category ID:** `mental_health`  
**Description:** Depression, anxiety, suicide, eating disorders, and other mental health themes.

| Subcategory ID | User Label | Description | Default Severity |
|----------------|------------|------------|------------------|
| `disordered_eating` | Disordered Eating | Disordered eating, eating disorders, body image issues. | moderate |
| `anxiety` | Anxiety | Anxiety, panic attacks, stress, anxiety disorders. | mild |
| `depression` | Depression | Depression, mood disorders, depressive episodes. | moderate |
| `ptsd` | PTSD / Trauma | Post-traumatic stress disorder, trauma, traumatic experiences. | moderate |
| `self_harm` | Self-Harm | Self-harm behaviors, cutting, non-suicidal self-injury. | severe |
| `suicidal_ideation` | Suicidal Ideation | Suicidal thoughts, attempts, detailed descriptions of suicide. | severe |
| `other_mental_health` | Other Mental Health | Other mental health themes not covered by specific subcategories. | mild |

---

## 2. Sexual Content

**Category ID:** `sexual_content`  
**Description:** Sexual situations, explicit content, sexual violence, or intense romance.

### Basic Sexual Content

| Subcategory ID | User Label | Description | Default Severity |
|----------------|------------|------------|------------------|
| `explicit_sexual_content` | Explicit Sexual Content | Explicit sexual scenes, graphic sexual descriptions. | moderate |
| `sexual_violence` | Sexual Violence | Sexual assault, rape, non-consensual sexual content. | severe |
| `intense_romance` | Intense Romance / Spice | Intense romantic/sexual tension, steamy scenes, explicit romance/spice content. | mild |
| `sexual_themes` | Sexual Themes | Sexual themes, discussions, references (non-explicit). | mild |

### Sexual Dynamics & Framing

| Subcategory ID | User Label | Description | Default Severity |
|----------------|------------|------------|------------------|
| `power_imbalance` | Power Imbalance | Sexual or romantic dynamics involving authority, dependency, or unequal power (e.g., boss/employee, teacher/student, age gaps). | moderate |
| `consent_ambiguity` | Ambiguous or Non-Explicit Consent | Consent is unclear, negotiated implicitly, or framed as resistance/desire tension. | severe |
| `coercion_pressure` | Sexual Coercion / Pressure | Emotional pressure, manipulation, or obligation leading to sexual activity. | severe |
| `degradation_humiliation` | Degradation / Humiliation | Sexual content involving humiliation, degradation, or verbal diminishment. | moderate |
| `possessive_dynamics` | Possessive or Obsessive Dynamics | Sexual or romantic framing involving ownership, obsession, or control. | moderate |

### Kink / Sexual Practices (Neutral Descriptors)

| Subcategory ID | User Label | Description | Default Severity |
|----------------|------------|------------|------------------|
| `bdsm_themes` | BDSM Themes | Power exchange, dominance/submission, or restraint themes. | moderate |
| `roleplay` | Sexual Roleplay | Sexual roleplay scenarios as part of intimacy. | mild |
| `exhibitionism_voyeurism` | Exhibitionism / Voyeurism | Sexual content involving being watched or watching. | moderate |
| `taboo_fetish_themes` | Taboo or Fetish Themes | Fetish-focused sexual framing outside mainstream romance norms. | moderate |

### Sexual Shaming & Language

| Subcategory ID | User Label | Description | Default Severity |
|----------------|------------|------------|------------------|
| `slut_shaming` | Sexual Shaming Language | Language that shames or devalues characters for sexual behaviour. | moderate |
| `purity_culture` | Purity / Virginity Framing | Sexual value tied to virginity, purity, or sexual restraint. | mild |
| `misogynistic_sexual_language` | Gendered Sexual Degradation | Sexually degrading language targeting women or gendered characters. | severe |
| `other_sexual_content` | Other Sexual Content | Other sexual content not covered by specific subcategories. | mild |

---

## 3. Emotional Abuse / Toxic Relationships

**Category ID:** `emotional_abuse_or_toxic_relationships`  
**Description:** Gaslighting, manipulation, controlling behavior, or toxic relationship dynamics.

| Subcategory ID | User Label | Description | Default Severity |
|----------------|------------|------------|------------------|
| `gaslighting` | Gaslighting | Gaslighting, psychological manipulation, making someone question their reality. | moderate |
| `manipulation` | Manipulation | Manipulative behavior, emotional manipulation, coercive control. | moderate |
| `controlling_behavior` | Controlling Behavior | Controlling relationships, possessiveness, isolation. | moderate |
| `toxic_friendships` | Toxic Friendships | Toxic friendships, unhealthy social dynamics, peer pressure. | mild |
| `cheating` | Cheating | Infidelity, cheating in relationships, betrayal. | mild |
| `emotional_abuse` | Emotional Abuse | Emotional abuse, verbal abuse, psychological abuse. | moderate |
| `other_toxic_relationships` | Other Toxic Relationships | Other toxic relationship dynamics not covered by specific subcategories. | mild |

---

## 4. Bullying / Social Cruelty

**Category ID:** `bullying_or_social_cruelty`  
**Description:** Bullying, hazing, public humiliation, or intense social pressure.

| Subcategory ID | User Label | Description | Default Severity |
|----------------|------------|------------|------------------|
| `bullying` | Bullying | Bullying, harassment, intimidation. | moderate |
| `hazing` | Hazing | Hazing, initiation rituals, forced participation. | moderate |
| `public_humiliation` | Public Humiliation | Public humiliation, shaming, embarrassment. | moderate |
| `social_pressure` | Social Pressure | Intense social pressure, peer pressure, conformity pressure. | mild |
| `other_social_cruelty` | Other Social Cruelty | Other forms of social cruelty not covered by specific subcategories. | mild |

---

## 5. Violence

**Category ID:** `violence`  
**Description:** Physical violence, fighting, weapons, war, or gore.

| Subcategory ID | User Label | Description | Default Severity |
|----------------|------------|------------|------------------|
| `physical_violence` | Physical Violence | Physical fighting, combat, brawls, physical altercations. | moderate |
| `graphic_violence` | Graphic Violence | Graphic violence, gore, detailed violence, blood. | severe |
| `weapons` | Weapons | Weapons, gun violence, knife violence, weapon use. | moderate |
| `war` | War | War, military violence, battle scenes, combat. | severe |
| `domestic_violence` | Domestic Violence | Domestic violence, intimate partner violence, family violence. | severe |
| `torture` | Torture | Torture, extreme violence, prolonged suffering. | severe |
| `kidnapping_confinement` | Kidnapping / Confinement | Kidnapping, abduction, confinement, being held against will, captivity. | severe |
| `violence_against_children` | Violence Against Children | Violence directed at children, child abuse, harm to minors. | severe |
| `animal_cruelty` | Animal Cruelty | Animal cruelty, harm to animals, animal death, pet death. | severe |
| `other_violence` | Other Violence | Other forms of violence not covered by specific subcategories. | moderate |

---

## 6. Substance Use

**Category ID:** `substance_use_or_alcohol`  
**Description:** Alcohol consumption, drug use, addiction, or overdose.

| Subcategory ID | User Label | Description | Default Severity |
|----------------|------------|------------|------------------|
| `alcohol` | Alcohol | Alcohol consumption, drinking, alcohol abuse. | mild |
| `drug_use` | Drug Use | Drug use, drug abuse, illegal substances. | moderate |
| `addiction` | Addiction | Addiction, substance dependence, substance use disorder. | moderate |
| `overdose` | Overdose | Overdose, drug-related medical emergencies, poisoning. | severe |
| `other_substance_use` | Other Substance Use | Other substance-related content not covered by specific subcategories. | mild |

---

## 7. Death / Grief

**Category ID:** `death_or_grief`  
**Description:** Character deaths, terminal illness, mourning, or funeral scenes.

| Subcategory ID | User Label | Description | Default Severity |
|----------------|------------|------------|------------------|
| `character_death` | Character Death | Character deaths, on-page deaths, death scenes. | moderate |
| `terminal_illness` | Terminal Illness | Terminal illness, dying characters, end-of-life care. | severe |
| `grief` | Grief | Grief, mourning, loss, bereavement. | moderate |
| `funeral_scenes` | Funeral Scenes | Funeral scenes, death rituals, memorial services. | mild |
| `near_death` | Near Death | Near-death experiences, life-threatening situations. | severe |
| `past_death` | Past Death | Past deaths (discussed but not shown), historical deaths. | mild |
| `miscarriage_abortion` | Miscarriage / Abortion | Miscarriage, stillbirth, abortion, pregnancy loss. | severe |
| `pregnancy_childbirth` | Pregnancy / Childbirth | Pregnancy complications, difficult childbirth, pregnancy-related trauma. | moderate |
| `other_death_grief` | Other Death / Grief | Other death/grief-related content not covered by specific subcategories. | mild |

---

## 8. Discrimination

**Category ID:** `discrimination`  
**Description:** Racism, sexism, homophobia, transphobia, or other forms of hate speech/discrimination.

| Subcategory ID | User Label | Description | Default Severity |
|----------------|------------|------------|------------------|
| `racism` | Racism | Racism, racial discrimination, racial slurs. | severe |
| `sexism` | Sexism | Sexism, gender discrimination, misogyny, misandry. | moderate |
| `homophobia` | Homophobia | Homophobia, anti-LGBTQ+ content, discrimination against gay/lesbian people. | severe |
| `transphobia` | Transphobia | Transphobia, anti-trans content, discrimination against transgender people. | severe |
| `religious_discrimination` | Religious Discrimination | Religious discrimination, religious intolerance, religious persecution. | moderate |
| `ableism` | Ableism | Ableism, discrimination against disabilities, disability slurs. | moderate |
| `cultural_appropriation` | Cultural Appropriation / Colonial Themes | Cultural appropriation, colonial themes, exploitation of Indigenous or marginalized cultures, or problematic representation of cultural groups. | moderate |
| `other_discrimination` | Other Discrimination | Other forms of discrimination not covered by specific subcategories. | moderate |

---

## 9. Coarse Language

**Category ID:** `language`  
**Description:** Strong language, swearing, or slurs.

| Subcategory ID | User Label | Description | Default Severity |
|----------------|------------|------------|------------------|
| `strong_language` | Strong Language | Strong language, profanity, swearing. | mild |
| `slurs` | Slurs | Slurs, hate speech, derogatory language. | severe |
| `other_language` | Other Language | Other language-related content not covered by specific subcategories. | mild |

---

## 10. Other

**Category ID:** `other`  
**Description:** Other potentially triggering content not covered by specific categories.

| Subcategory ID | User Label | Description | Default Severity |
|----------------|------------|------------|------------------|
| `other` | Other | Other potentially triggering content. | mild |

---

## Severity Scoring

Warnings are assigned a **score from 0.0 to 1.0**, which maps to severity levels:

| Score Range | Severity | Classification Impact |
|-------------|----------|----------------------|
| 0.00 - 0.30 | None / Very Mild | G (General) |
| 0.31 - 0.55 | Mild | PG (Parental Guidance) |
| 0.56 - 0.80 | Moderate | M (Mature) |
| 0.81 - 1.00 | Severe | MA15+ / R18+ |

---

## Context Metadata

Each warning can include additional context:

### Presence Types
- **on_page**: The event is described as it happens in real-time
- **off_page**: The event happens but is not directly described
- **flashback**: The event is shown in a flashback or memory sequence
- **referenced**: The event is discussed or mentioned but not shown
- **implied**: The event is strongly implied but not explicitly stated

### Detail Levels
- **graphic**: Detailed, explicit, or graphic description
- **moderate**: Moderate level of detail, not overly explicit but clear
- **vague**: Vague or minimal description, mostly implied
- **clinical**: Clinical or matter-of-fact description without emotional detail

---

## Total Count

- **10 Parent Categories**
- **82 Subcategories** (expanded Sexual Content category for romance/BookTok readers)
- **4 Severity Levels** (none, mild, moderate, severe)
- **5 Presence Types**
- **4 Detail Levels**

---

## Romance/BookTok Expansion

The Sexual Content category has been expanded to better serve romance readers and BookTok users who need more granular information about sexual content beyond just "is there sex?" The new subcategories focus on:

- **Sexual Dynamics & Framing**: How sexual/romantic relationships are framed (power imbalances, consent, coercion, etc.)
- **Kink / Sexual Practices**: Neutral descriptors of sexual practices (BDSM, roleplay, etc.) without judgment
- **Sexual Shaming & Language**: Language and framing that may be problematic (slut shaming, purity culture, etc.)

These additions help readers make informed decisions about content that may be triggering or uncomfortable, while maintaining neutral, descriptive language that avoids kink-shaming or moral judgment.










