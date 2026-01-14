# Content Warning Taxonomy v2.5

**Version:** 2.5.0  
**Model:** gpt-5.2-2025-12-11

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
| `weight_loss_dieting` | Weight Loss / Dieting Focus | Chronic diet talk, weight loss focus, "makeover" plots, or dieting narratives. | moderate |
| `anxiety` | Anxiety | Anxiety, panic attacks, stress, anxiety disorders. | mild |
| `depression` | Depression | Depression, mood disorders, depressive episodes. | moderate |
| `ptsd` | PTSD / Trauma | Post-traumatic stress disorder, trauma, traumatic experiences. | moderate |
| `self_harm` | Self-Harm | Self-harm behaviors, cutting, non-suicidal self-injury. | severe |
| `suicidal_ideation` | Suicidal Ideation | Suicidal thoughts, attempts, detailed descriptions of suicide. | severe |
| `suicide_minor` | Suicide of a Minor | Suicide or suicidal ideation involving a child or minor character. | moderate |
| `casual_suicidal_ideation` | Casual Suicidal Ideation / Jokes | Non-graphic but repeated "jokes" or casual references to suicide, self-harm, or death wishes. | moderate |
| `workplace_burnout` | Workplace Burnout / Toxic Workplace | Workplace burnout, toxic work environments, overwork, or professional stress. | moderate |
| `academic_pressure` | Academic Pressure / Exam Stress | Academic pressure, exam stress, academic competition, or intense educational pressure. | moderate |
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
| `infidelity_cheating` | Infidelity / Cheating | Infidelity, cheating in relationships, or sexual/romantic betrayal. | moderate |
| `pornography_sex_work` | Pornography / Sex Work | Explicit pornography, sex work representation, or sexual content industry themes. | moderate |

### Sexual Dynamics & Framing

| Subcategory ID | User Label | Description | Default Severity |
|----------------|------------|------------|------------------|
| `power_imbalance` | Power Imbalance | Sexual or romantic dynamics involving authority, dependency, or unequal power (e.g., boss/employee, teacher/student, age gaps). | moderate |
| `consent_ambiguity` | Ambiguous or Non-Explicit Consent | Consent is unclear, negotiated implicitly, or framed as resistance/desire tension. | severe |
| `cnc` | Consensual Non-Consent (CNC) | Consensual non-consent, CNC play, or negotiated non-consent scenarios. | severe |
| `somnophilia` | Somnophilia / Sleep Play | Non-consensual or dub-consensual sexual acts while one partner is sleeping or unconscious. | severe |
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
| `breeding_kink` | Breeding Kink | Sexual focus on impregnation, breeding, or pregnancy as kink. | moderate |
| `knife_play` | Knife Play / Blood Play | Sexualized use of knives, blood play, or weapon play in sexual contexts. | severe |
| `primal_play` | Primal Play | Hunting/chasing dynamics, primal kink, or "touch her and you die" tropes in sexual/romantic contexts. | moderate |
| `praise_kink` | Praise Kink | Sexual gratification from receiving praise or "good girl/boy" affirmation. | moderate |
| `degradation_kink` | Degradation Kink | Sexual gratification from verbal humiliation or degradation. | moderate |
| `public_sex` | Public Sex / Risk of Discovery | Sexual acts in public or semi-public places, or fear/thrill of being caught. | moderate |
| `group_sex` | Group Sex / Threesome | Sexual acts involving more than two participants. | moderate |
| `monster_romance` | Monster Romance / Anatomy | Sexual content involving non-human partners or anatomy. | moderate |
| `size_difference` | Size Difference Kink | Sexual focus on significant physical size difference between partners. | moderate |

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
| `stalking` | Stalking | Stalking, obsessive following, or unwanted surveillance. | severe |
| `financial_abuse` | Financial Abuse | Financial abuse, economic control, or financial manipulation. | moderate |
| `grooming` | Grooming | Grooming, predatory behavior, or manipulation of vulnerable individuals. | severe |
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
| `school_shootings` | School Shootings / Mass Violence | School shootings, mass shootings, or mass violence events. | severe |
| `war` | War | War, military violence, battle scenes, combat. | severe |
| `domestic_violence` | Domestic Violence | Domestic violence, intimate partner violence, family violence. | severe |
| `torture` | Torture | Torture, extreme violence, prolonged suffering. | severe |
| `kidnapping_confinement` | Kidnapping / Confinement | Kidnapping, abduction, confinement, being held against will, captivity. | severe |
| `infanticide_or_intentional_child_harm` | Infanticide / Intentional Harm to a Child | Infanticide, attempted murder of a newborn/child, or intentional harm targeting infants/children. | severe |
| `human_trafficking` | Human Trafficking | Human trafficking, sex trafficking, or forced servitude. | severe |
| `cannibalism` | Cannibalism | Cannibalism, eating human flesh, or cannibalistic themes. | severe |
| `violence_against_children` | Violence Against Children | Violence directed at children, child abuse, harm to minors. | severe |
| `crime_non_violent` | Non-Violent Crime / Prison | General crime content: robbery, non-violent crime, prison/jail settings. | mild |
| `animal_cruelty` | Animal Cruelty | Animal cruelty, harm to animals, animal death, pet death. | severe |
| `police_brutality` | Police Brutality / State Violence | Police brutality, state violence, or systemic violence by authorities. | severe |
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
| `death_animals` | Animal Death | Animal death, pet death, or harm to animals. | severe |
| `grief_processing` | Grief Processing | Detailed grief processing, mourning, or loss processing. | moderate |
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
| `acephobia` | Acephobia | Discrimination against asexual people, invalidation of asexuality, or pressure to be sexual. | moderate |
| `lesbophobia` | Lesbophobia | Discrimination specifically against lesbians or lesbian relationships. | severe |
| `biphobia` | Biphobia | Discrimination against bisexual people, biphobic stereotypes, or invalidation of bisexuality. | moderate |
| `misgendering` | Misgendering / Deadnaming | Misgendering, deadnaming, or use of incorrect pronouns for transgender or non-binary characters. | severe |
| `queerphobia` | Queerphobia | General anti-queer sentiment, queerphobic language, or discrimination against LGBTQ+ people. | severe |
| `religious_discrimination` | Religious Discrimination | Religious discrimination, religious intolerance, religious persecution. | moderate |
| `ableism` | Ableism | Ableism, discrimination against disabilities, disability slurs. | moderate |
| `cultural_appropriation` | Cultural Appropriation / Colonial Themes | Cultural appropriation, colonial themes, exploitation of Indigenous or marginalized cultures. | moderate |
| `antisemitism` | Antisemitism | Antisemitism, anti-Jewish discrimination, or Jewish stereotypes. | severe |
| `islamophobia` | Islamophobia | Islamophobia, anti-Muslim discrimination, or Muslim stereotypes. | severe |
| `fatphobia` | Fatphobia / Body Shaming | Discrimination based on weight, body shaming, anti-fat bias, or cruelty toward fat characters. | moderate |
| `classism` | Classism / Poverty | Discrimination based on class, extreme poverty, homelessness, or economic status discrimination. | moderate |
| `economic_collapse` | Economic Collapse / Eviction / Job Loss | Economic collapse, eviction, foreclosure, job loss, or sudden economic hardship. | moderate |
| `queer_joy_identity` | Queer Joy / Identity Focus | Non-triggering identity flags: coming out arcs, transition journeys, or positive LGBTQ+ identity exploration. | moderate |
| `religious_joy_identity` | Religious Joy / Positive Identity | Non-triggering identity flags: positive religious identity exploration, faith journeys, or affirming religious content. | moderate |
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

## 10. Phobias / Specific Fears

**Category ID:** `phobias`  
**Description:** Specific phobias or fear triggers that may cause anxiety or panic.

| Subcategory ID | User Label | Description | Default Severity |
|----------------|------------|------------|------------------|
| `snakes` | Snakes / Serpents | Snakes, serpents, or snake-like creatures. | mild |
| `spiders` | Spiders / Arachnids | Spiders, arachnids, or spider-like creatures. | mild |
| `needles` | Needles / Medical Procedures | Needles, injections, medical procedures, or blood draws. | moderate |
| `heights` | Heights / Falling | Heights, falling, vertigo, or high places. | mild |
| `water` | Water / Drowning | Water, drowning, deep water, or aquaphobia triggers. | moderate |
| `enclosed_spaces` | Enclosed Spaces / Claustrophobia | Enclosed spaces, claustrophobia, being trapped, or confinement. | moderate |
| `darkness` | Darkness / Nyctophobia | Darkness, being in the dark, or fear of the dark. | mild |
| `blood` | Blood / Hemophobia | Blood, gore, or blood-related medical content. | moderate |
| `vomiting` | Vomiting / Emetophobia | Vomiting, nausea, or scenes depicting sickness. | mild |
| `trypophobia` | Trypophobia | Clusters of small holes, patterns, or trypophobia triggers. | mild |
| `dental_trauma` | Dental Trauma | Dental procedures, teeth falling out, pulling teeth, or dental gore. | moderate |
| `other_phobias` | Other Phobias | Other specific phobias or fear triggers not covered above. | mild |

---

## 11. Medical / Health

**Category ID:** `medical_health`  
**Description:** Medical procedures, health conditions, infertility, or medical trauma.

| Subcategory ID | User Label | Description | Default Severity |
|----------------|------------|------------|------------------|
| `medical_procedures` | Medical Procedures | Surgery, medical procedures, hospital scenes, or medical trauma. | moderate |
| `medical_detail_procedural` | Medical Detail / Procedural | Non-graphic surgery or medical procedures without trauma focus. | mild |
| `plastic_surgery_cosmetic` | Plastic Surgery / Cosmetic Procedures | Plastic surgery, cosmetic procedures, or elective body modification. | mild |
| `pandemics_contagion` | Pandemics / Contagion | Pandemics, plague, outbreaks, contagion narratives, or infectious disease themes. | moderate |
| `infertility` | Infertility | Infertility, long-term lack of conception, or inability to conceive. | moderate |
| `pregnancy_loss` | Pregnancy Loss | Miscarriage, stillbirth, or pregnancy loss. | severe |
| `chronic_illness` | Chronic Illness | Chronic illness, disability, or long-term health conditions. | moderate |
| `cancer` | Cancer | Cancer, cancer treatment, or cancer-related illness. | severe |
| `body_horror` | Body Horror | Body horror, extreme body modification, or graphic body-related content. | severe |
| `pregnancy_childbirth` | Pregnancy / Childbirth | Pregnancy, childbirth, pregnancy complications, or pregnancy-related trauma. | moderate |
| `other_medical` | Other Medical / Health | Other medical or health-related content not covered above. | moderate |

---

## 12. Religious / Cult Content

**Category ID:** `religious_cult`  
**Description:** Religious trauma, cult dynamics, occult themes, or religious persecution.

| Subcategory ID | User Label | Description | Default Severity |
|----------------|------------|------------|------------------|
| `cult_content` | Cult Dynamics | Cult dynamics, indoctrination, or cult manipulation. | moderate |
| `religious_trauma` | Religious Trauma | Religious trauma, religious abuse, or religious-based harm. | moderate |
| `occult` | Occult / Supernatural | Occult themes, supernatural elements, or dark magic. | mild |
| `excommunication` | Excommunication / Religious Exclusion | Excommunication, religious exclusion, or religious shunning. | moderate |
| `other_religious_cult` | Other Religious / Cult | Other religious or cult-related content not covered above. | mild |

---

## 13. Family Dynamics

**Category ID:** `family_dynamics`  
**Description:** Family-related trauma, abandonment, or family system issues.

| Subcategory ID | User Label | Description | Default Severity |
|----------------|------------|------------|------------------|
| `parental_abandonment` | Parental Abandonment | Parental abandonment, estrangement, or parents leaving. | moderate |
| `foster_care_adoption` | Foster Care / Adoption Trauma | Foster care trauma, adoption breakdown, or displacement of children. | moderate |
| `divorce` | Divorce / Separation | Divorce, separation, or relationship breakdown. | moderate |
| `deception_or_secrets` | Deception / Secrets | Deception, lying, or secret-keeping involving friends or family. | mild |
| `incest_taboo` | Incest / Pseudo-Incest | Incest, pseudo-incest (step-siblings), or blood relation sexual/romantic content. | severe |
| `other_family_dynamics` | Other Family Dynamics | Other family-related trauma or dynamics not covered above. | mild |

---

## 14. Tropes & Genres (New in v2.5)

**Category ID:** `tropes`  
**Description:** Common book tropes, narrative devices, and subgenres (often used in romance/BookTok contexts).

| Subcategory ID | User Label | Description | Default Severity |
|----------------|------------|------------|------------------|
| `enemies_to_lovers` | Enemies to Lovers | Characters start as enemies or rivals and develop romantic feelings. | mild |
| `bully_romance` | Bully Romance | Romance involving bullying dynamics between love interests. | moderate |
| `dark_romance` | Dark Romance | Romance genre featuring darker themes, morally grey characters, or taboo content. | moderate |
| `mafia_romance` | Mafia / Organized Crime Romance | Romance set in the world of organized crime. | moderate |
| `stalker_romance` | Stalker Romance | Romance involving stalking behaviors framed as romantic or obsessive devotion. | severe |
| `kidnapping_romance` | Captive / Kidnapping Romance | Romance involving kidnapping, captivity, or Stockholm syndrome themes. | severe |
| `omegaverse` | Omegaverse / Dynamics | Genre involving biological hierarchies (Alpha/Beta/Omega), often with breeding/heat cycles. | moderate |
| `age_gap` | Age Gap | Romance with significant age difference between partners. | mild |
| `why_choose` | Why Choose / Reverse Harem | Romance where a protagonist has multiple simultaneous love interests. | moderate |
| `other_tropes` | Other Tropes | Other specific tropes not covered by the main categories. | mild |

---

## 15. Other

**Category ID:** `other`  
**Description:** Other potentially triggering content not covered by specific categories.

| Subcategory ID | User Label | Description | Default Severity |
|----------------|------------|------------|------------------|
| `natural_disasters` | Natural Disasters | Natural disasters, environmental trauma, or climate-related events. | moderate |
| `accidents` | Car Accidents / Crashes | Car crashes, plane crashes, or severe vehicle accidents. | moderate |
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

## Total Count

- **15 Parent Categories**
- **100+ Subcategories**
- **4 Severity Levels** (none, mild, moderate, severe)
- **5 Presence Types**
- **4 Detail Levels**

---

## Romance/BookTok Expansion (v2.5)

The Taxonomy v2.5 update introduces specific categories for "Tropes" and expanded "Sexual Content" to better serve romance readers and BookTok users.

- **Tropes**: Captures narrative devices and subgenres like *Dark Romance*, *Enemies to Lovers*, and *Omegaverse*.
- **Expanded Sexual Content**: Includes specific kinks and dynamics like *Praise Kink*, *Degradation*, *Public Sex*, and *Monster Romance*.

These additions allow for granular warnings that distinguish between genre conventions (tropes) and potentially triggering content (warnings), while maintaining neutral, descriptive language.
