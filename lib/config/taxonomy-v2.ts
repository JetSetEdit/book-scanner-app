/**
 * Hierarchical Taxonomy Structure v2.0
 * 
 * This version introduces parent-child relationships:
 * - Parent categories: High-level groupings (e.g., "Mental Health")
 * - Subcategories: Specific subcategories under parents (e.g., "Disordered Eating", "Anxiety")
 * 
 * This allows multiple specific warnings under one parent category,
 * solving the duplicate category problem.
 * 
 * Also includes contextual metadata:
 * - Presence: How the content appears (on_page, off_page, flashback, referenced, implied)
 * - Detail Level: How graphic/explicit (graphic, moderate, vague, clinical)
 * - Spoiler Flag: Whether warning reveals plot twists
 * - Mediation Flag: Whether content requires parental/educational mediation
 */

export const TAXONOMY_VERSION = "2.5.0";
export const MODEL_VERSION = "gpt-5.2-pro-2025-12-11";

export interface WarningSubcategory {
  id: string;
  userLabel: string;
  shortDescription: string;
  defaultSeverityHint?: 'mild' | 'moderate' | 'severe';
}

export interface WarningCategory {
  id: string;
  userLabel: string;
  shortDescription: string;
  legacyCategory: string; // For backward compatibility with DB constraints
  subcategories: WarningSubcategory[];
  defaultSeverityHint?: 'mild' | 'moderate' | 'severe';
}

export const WARNING_CATEGORIES: WarningCategory[] = [
  {
    id: 'mental_health',
    userLabel: 'Mental Health',
    shortDescription: 'Depression, anxiety, suicide, eating disorders, and other mental health themes.',
    legacyCategory: 'mental_health',
    subcategories: [
      {
        id: 'disordered_eating',
        userLabel: 'Disordered Eating',
        shortDescription: 'Disordered eating, eating disorders, body image issues.',
        defaultSeverityHint: 'moderate'
      },
      {
        id: 'weight_loss_dieting',
        userLabel: 'Weight Loss / Dieting Focus',
        shortDescription: 'Chronic diet talk, weight loss focus, "makeover" plots, or dieting narratives. Distinct from disordered eating but may be triggering for ED-sensitive readers. Keywords: makeover, diet culture, clean eating.',
        defaultSeverityHint: 'mild'
      },
      {
        id: 'anxiety',
        userLabel: 'Anxiety',
        shortDescription: 'Anxiety, panic attacks, stress, anxiety disorders.',
        defaultSeverityHint: 'mild'
      },
      {
        id: 'depression',
        userLabel: 'Depression',
        shortDescription: 'Depression, mood disorders, depressive episodes.',
        defaultSeverityHint: 'moderate'
      },
      {
        id: 'ptsd',
        userLabel: 'PTSD / Trauma',
        shortDescription: 'Post-traumatic stress disorder, trauma, traumatic experiences.',
        defaultSeverityHint: 'moderate'
      },
      {
        id: 'self_harm',
        userLabel: 'Self-Harm',
        shortDescription: 'Self-harm behaviors, cutting, non-suicidal self-injury.',
        defaultSeverityHint: 'severe'
      },
      {
        id: 'suicidal_ideation',
        userLabel: 'Suicidal Ideation',
        shortDescription: 'Suicidal thoughts, attempts, detailed descriptions of suicide.',
        defaultSeverityHint: 'severe'
      },
      {
        id: 'suicide_minor',
        userLabel: 'Suicide of a Minor',
        shortDescription: 'Suicide or suicidal ideation involving a child or minor character.',
        defaultSeverityHint: 'severe'
      },
      {
        id: 'casual_suicidal_ideation',
        userLabel: 'Casual Suicidal Ideation / Jokes',
        shortDescription: 'Non-graphic but repeated "jokes" or casual references to suicide, self-harm, or death wishes. Less severe than acute suicidal content but may still be triggering.',
        defaultSeverityHint: 'mild'
      },
      {
        id: 'workplace_burnout',
        userLabel: 'Workplace Burnout / Toxic Workplace',
        shortDescription: 'Workplace burnout, toxic work environments, overwork, or professional stress. May include exploitation, harassment, or unsafe working conditions.',
        defaultSeverityHint: 'moderate'
      },
      {
        id: 'academic_pressure',
        userLabel: 'Academic Pressure / Exam Stress',
        shortDescription: 'Academic pressure, exam stress, academic competition, or intense educational pressure. May include academic failure, grade anxiety, or competitive academic environments.',
        defaultSeverityHint: 'moderate'
      },
      {
        id: 'other_mental_health',
        userLabel: 'Other Mental Health',
        shortDescription: 'Other mental health themes not covered by specific subcategories.',
        defaultSeverityHint: 'mild'
      }
    ]
  },
  {
    id: 'sexual_content',
    userLabel: 'Sexual Content',
    shortDescription: 'Sexual situations, explicit content, sexual violence, or intense romance.',
    legacyCategory: 'sexual_content',
    subcategories: [
      {
        id: 'explicit_sexual_content',
        userLabel: 'Explicit Sexual Content',
        shortDescription: 'Explicit sexual scenes, graphic sexual descriptions.',
        defaultSeverityHint: 'moderate'
      },
      {
        id: 'sexual_violence',
        userLabel: 'Sexual Violence',
        shortDescription: 'Sexual assault, rape, non-consensual sexual content.',
        defaultSeverityHint: 'severe'
      },
      {
        id: 'intense_romance',
        userLabel: 'Intense Romance / Spice',
        shortDescription: 'Intense romantic/sexual tension, steamy scenes, explicit romance/spice content. Note: Emotional romantic tension alone may not require a warning.',
        defaultSeverityHint: 'mild'
      },
      {
        id: 'sexual_themes',
        userLabel: 'Sexual Themes',
        shortDescription: 'Sexual themes, discussions, references (non-explicit).',
        defaultSeverityHint: 'mild'
      },
      {
        id: 'infidelity_cheating',
        userLabel: 'Infidelity / Cheating',
        shortDescription: 'Infidelity, cheating in relationships, or sexual/romantic betrayal. Also see Emotional Abuse category for relationship dynamics.',
        defaultSeverityHint: 'mild'
      },
      {
        id: 'pornography_sex_work',
        userLabel: 'Pornography / Sex Work',
        shortDescription: 'Explicit pornography, sex work representation, or sexual content industry themes.',
        defaultSeverityHint: 'moderate'
      },
      // Sexual Dynamics & Framing
      {
        id: 'power_imbalance',
        userLabel: 'Power Imbalance',
        shortDescription: 'Sexual or romantic dynamics involving authority, dependency, or unequal power (e.g., boss/employee, teacher/student, age gaps).',
        defaultSeverityHint: 'moderate'
      },
      {
        id: 'consent_ambiguity',
        userLabel: 'Ambiguous or Non-Explicit Consent (Dub-Con)',
        shortDescription: 'Consent is unclear, negotiated implicitly, or framed as resistance/desire tension. Also known as "Dub-Con" in dark romance.',
        defaultSeverityHint: 'severe'
      },
      {
        id: 'cnc',
        userLabel: 'Consensual Non-Consent (CNC)',
        shortDescription: 'Consensual non-consent, CNC play, or negotiated non-consent scenarios. Distinct from actual non-consent.',
        defaultSeverityHint: 'severe'
      },
      {
        id: 'somnophilia',
        userLabel: 'Somnophilia / Sleep Play',
        shortDescription: 'Non-consensual or dub-consensual sexual acts while one partner is sleeping or unconscious.',
        defaultSeverityHint: 'severe'
      },
      {
        id: 'coercion_pressure',
        userLabel: 'Sexual Coercion / Pressure',
        shortDescription: 'Emotional pressure, manipulation, or obligation leading to sexual activity.',
        defaultSeverityHint: 'severe'
      },
      {
        id: 'degradation_humiliation',
        userLabel: 'Degradation / Humiliation',
        shortDescription: 'Sexual content involving humiliation, degradation, or verbal diminishment.',
        defaultSeverityHint: 'moderate'
      },
      {
        id: 'possessive_dynamics',
        userLabel: 'Possessive or Obsessive Dynamics',
        shortDescription: 'Sexual or romantic framing involving ownership, obsession, or control.',
        defaultSeverityHint: 'moderate'
      },
      // Kink / Sexual Practices (Neutral Descriptors)
      {
        id: 'bdsm_themes',
        userLabel: 'BDSM Themes',
        shortDescription: 'Power exchange, dominance/submission, or restraint themes.',
        defaultSeverityHint: 'moderate'
      },
      {
        id: 'roleplay',
        userLabel: 'Sexual Roleplay',
        shortDescription: 'Sexual roleplay scenarios as part of intimacy.',
        defaultSeverityHint: 'mild'
      },
      {
        id: 'exhibitionism_voyeurism',
        userLabel: 'Exhibitionism / Voyeurism',
        shortDescription: 'Sexual content involving being watched or watching.',
        defaultSeverityHint: 'moderate'
      },
      {
        id: 'taboo_fetish_themes',
        userLabel: 'Taboo or Fetish Themes',
        shortDescription: 'Fetish-focused sexual framing outside mainstream romance norms.',
        defaultSeverityHint: 'moderate'
      },
      {
        id: 'breeding_kink',
        userLabel: 'Breeding Kink',
        shortDescription: 'Sexual focus on impregnation, breeding, or pregnancy as kink. Distinct from actual pregnancy/childbirth.',
        defaultSeverityHint: 'moderate'
      },
      {
        id: 'knife_play',
        userLabel: 'Knife Play / Blood Play',
        shortDescription: 'Sexualized use of knives, blood play, or weapon play in sexual contexts.',
        defaultSeverityHint: 'severe'
      },
      {
        id: 'primal_play',
        userLabel: 'Primal Play',
        shortDescription: 'Hunting/chasing dynamics, primal kink, or "touch her and you die" tropes in sexual/romantic contexts.',
        defaultSeverityHint: 'moderate'
      },
      // Sexual Shaming & Language
      {
        id: 'slut_shaming',
        userLabel: 'Sexual Shaming Language',
        shortDescription: 'Language that shames or devalues characters for sexual behaviour.',
        defaultSeverityHint: 'moderate'
      },
      {
        id: 'purity_culture',
        userLabel: 'Purity / Virginity Framing',
        shortDescription: 'Sexual value tied to virginity, purity, or sexual restraint.',
        defaultSeverityHint: 'mild'
      },
      {
        id: 'misogynistic_sexual_language',
        userLabel: 'Gendered Sexual Degradation',
        shortDescription: 'Sexually degrading language targeting women or gendered characters.',
        defaultSeverityHint: 'severe'
      },
      {
        id: 'other_sexual_content',
        userLabel: 'Other Sexual Content',
        shortDescription: 'Other sexual content not covered by specific subcategories.',
        defaultSeverityHint: 'mild'
      }
    ]
  },
  {
    id: 'emotional_abuse_or_toxic_relationships',
    userLabel: 'Emotional Abuse / Toxic Relationships',
    shortDescription: 'Gaslighting, manipulation, controlling behavior, or toxic relationship dynamics.',
    legacyCategory: 'abuse',
    subcategories: [
      {
        id: 'gaslighting',
        userLabel: 'Gaslighting',
        shortDescription: 'Gaslighting, psychological manipulation, making someone question their reality.',
        defaultSeverityHint: 'moderate'
      },
      {
        id: 'manipulation',
        userLabel: 'Manipulation',
        shortDescription: 'Manipulative behavior, emotional manipulation, coercive control.',
        defaultSeverityHint: 'moderate'
      },
      {
        id: 'controlling_behavior',
        userLabel: 'Controlling Behavior',
        shortDescription: 'Controlling relationships, possessiveness, isolation.',
        defaultSeverityHint: 'moderate'
      },
      {
        id: 'toxic_friendships',
        userLabel: 'Toxic Friendships',
        shortDescription: 'Toxic friendships, unhealthy social dynamics, peer pressure.',
        defaultSeverityHint: 'mild'
      },
      {
        id: 'cheating',
        userLabel: 'Cheating',
        shortDescription: 'Infidelity, cheating in relationships, betrayal.',
        defaultSeverityHint: 'mild'
      },
      {
        id: 'emotional_abuse',
        userLabel: 'Emotional Abuse',
        shortDescription: 'Emotional abuse, verbal abuse, psychological abuse.',
        defaultSeverityHint: 'moderate'
      },
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
      },
      {
        id: 'grooming',
        userLabel: 'Grooming',
        shortDescription: 'Grooming, predatory behavior, or manipulation of vulnerable individuals (often in age-gap or power imbalance contexts).',
        defaultSeverityHint: 'severe'
      },
      {
        id: 'other_toxic_relationships',
        userLabel: 'Other Toxic Relationships',
        shortDescription: 'Other toxic relationship dynamics not covered by specific subcategories.',
        defaultSeverityHint: 'mild'
      }
    ]
  },
  {
    id: 'bullying_or_social_cruelty',
    userLabel: 'Bullying / Social Cruelty',
    shortDescription: 'Bullying, hazing, public humiliation, or intense social pressure.',
    legacyCategory: 'abuse',
    subcategories: [
      {
        id: 'bullying',
        userLabel: 'Bullying',
        shortDescription: 'Bullying, harassment, intimidation.',
        defaultSeverityHint: 'moderate'
      },
      {
        id: 'hazing',
        userLabel: 'Hazing',
        shortDescription: 'Hazing, initiation rituals, forced participation.',
        defaultSeverityHint: 'moderate'
      },
      {
        id: 'public_humiliation',
        userLabel: 'Public Humiliation',
        shortDescription: 'Public humiliation, shaming, embarrassment.',
        defaultSeverityHint: 'moderate'
      },
      {
        id: 'social_pressure',
        userLabel: 'Social Pressure',
        shortDescription: 'Intense social pressure, peer pressure, conformity pressure.',
        defaultSeverityHint: 'mild'
      },
      {
        id: 'other_social_cruelty',
        userLabel: 'Other Social Cruelty',
        shortDescription: 'Other forms of social cruelty not covered by specific subcategories.',
        defaultSeverityHint: 'mild'
      }
    ]
  },
  {
    id: 'violence',
    userLabel: 'Violence',
    shortDescription: 'Physical violence, fighting, weapons, war, or gore.',
    legacyCategory: 'violence',
    subcategories: [
      {
        id: 'physical_violence',
        userLabel: 'Physical Violence',
        shortDescription: 'Physical fighting, combat, brawls, physical altercations.',
        defaultSeverityHint: 'moderate'
      },
      {
        id: 'graphic_violence',
        userLabel: 'Graphic Violence',
        shortDescription: 'Graphic violence, gore, detailed violence, blood.',
        defaultSeverityHint: 'severe'
      },
      {
        id: 'weapons',
        userLabel: 'Weapons',
        shortDescription: 'Weapons, gun violence, knife violence, weapon use.',
        defaultSeverityHint: 'moderate'
      },
      {
        id: 'school_shootings',
        userLabel: 'School Shootings / Mass Violence',
        shortDescription: 'School shootings, mass shootings, or mass violence events.',
        defaultSeverityHint: 'severe'
      },
      {
        id: 'war',
        userLabel: 'War',
        shortDescription: 'War, military violence, battle scenes, combat.',
        defaultSeverityHint: 'severe'
      },
      {
        id: 'domestic_violence',
        userLabel: 'Domestic Violence',
        shortDescription: 'Domestic violence, intimate partner violence, family violence.',
        defaultSeverityHint: 'severe'
      },
      {
        id: 'torture',
        userLabel: 'Torture',
        shortDescription: 'Torture, extreme violence, prolonged suffering.',
        defaultSeverityHint: 'severe'
      },
      {
        id: 'kidnapping_confinement',
        userLabel: 'Kidnapping / Confinement',
        shortDescription: 'Kidnapping, abduction, confinement, being held against will, captivity.',
        defaultSeverityHint: 'severe'
      },
      {
        id: 'human_trafficking',
        userLabel: 'Human Trafficking',
        shortDescription: 'Human trafficking, sex trafficking, or forced servitude. Distinct from general kidnapping.',
        defaultSeverityHint: 'severe'
      },
      {
        id: 'cannibalism',
        userLabel: 'Cannibalism',
        shortDescription: 'Cannibalism, eating human flesh, or cannibalistic themes.',
        defaultSeverityHint: 'severe'
      },
      {
        id: 'violence_against_children',
        userLabel: 'Violence Against Children',
        shortDescription: 'Violence directed at children, child abuse, harm to minors. Implicitly covers suicidal content involving minors (see also: suicide_minor for explicit tagging).',
        defaultSeverityHint: 'severe'
      },
      {
        id: 'crime_non_violent',
        userLabel: 'Non-Violent Crime / Prison',
        shortDescription: 'General crime content: robbery, non-violent crime, prison/jail settings, interrogations, or criminal justice system themes. May be tagged even when violence is mild. Keywords: heist, robbery, prison setting, courtroom drama.',
        defaultSeverityHint: 'mild'
      },
      {
        id: 'animal_cruelty',
        userLabel: 'Animal Cruelty',
        shortDescription: 'Animal cruelty, harm to animals, animal death, pet death.',
        defaultSeverityHint: 'severe'
      },
      {
        id: 'police_brutality',
        userLabel: 'Police Brutality / State Violence',
        shortDescription: 'Police brutality, state violence, or systemic violence by authorities.',
        defaultSeverityHint: 'severe'
      },
      {
        id: 'other_violence',
        userLabel: 'Other Violence',
        shortDescription: 'Other forms of violence not covered by specific subcategories.',
        defaultSeverityHint: 'moderate'
      }
    ]
  },
  {
    id: 'substance_use_or_alcohol',
    userLabel: 'Substance Use',
    shortDescription: 'Alcohol consumption, drug use, addiction, or overdose.',
    legacyCategory: 'substance_abuse',
    subcategories: [
      {
        id: 'alcohol',
        userLabel: 'Alcohol',
        shortDescription: 'Alcohol consumption, drinking, alcohol abuse.',
        defaultSeverityHint: 'mild'
      },
      {
        id: 'drug_use',
        userLabel: 'Drug Use',
        shortDescription: 'Drug use, drug abuse, illegal substances.',
        defaultSeverityHint: 'moderate'
      },
      {
        id: 'addiction',
        userLabel: 'Addiction',
        shortDescription: 'Addiction, substance dependence, substance use disorder.',
        defaultSeverityHint: 'moderate'
      },
      {
        id: 'overdose',
        userLabel: 'Overdose',
        shortDescription: 'Overdose, drug-related medical emergencies, poisoning.',
        defaultSeverityHint: 'severe'
      },
      {
        id: 'other_substance_use',
        userLabel: 'Other Substance Use',
        shortDescription: 'Other substance-related content not covered by specific subcategories.',
        defaultSeverityHint: 'mild'
      }
    ]
  },
  {
    id: 'death_or_grief',
    userLabel: 'Death / Grief',
    shortDescription: 'Character deaths, terminal illness, mourning, or funeral scenes.',
    legacyCategory: 'death',
    subcategories: [
      {
        id: 'character_death',
        userLabel: 'Character Death',
        shortDescription: 'Character deaths, on-page deaths, death scenes.',
        defaultSeverityHint: 'moderate'
      },
      {
        id: 'terminal_illness',
        userLabel: 'Terminal Illness',
        shortDescription: 'Terminal illness, dying characters, end-of-life care.',
        defaultSeverityHint: 'severe'
      },
      {
        id: 'grief',
        userLabel: 'Grief',
        shortDescription: 'Grief, mourning, loss, bereavement.',
        defaultSeverityHint: 'moderate'
      },
      {
        id: 'funeral_scenes',
        userLabel: 'Funeral Scenes',
        shortDescription: 'Funeral scenes, death rituals, memorial services.',
        defaultSeverityHint: 'mild'
      },
      {
        id: 'near_death',
        userLabel: 'Near Death',
        shortDescription: 'Near-death experiences, life-threatening situations.',
        defaultSeverityHint: 'severe'
      },
      {
        id: 'past_death',
        userLabel: 'Past Death',
        shortDescription: 'Past deaths (discussed but not shown), historical deaths.',
        defaultSeverityHint: 'mild'
      },
      {
        id: 'miscarriage_abortion',
        userLabel: 'Miscarriage / Abortion',
        shortDescription: 'Miscarriage, stillbirth, abortion, pregnancy loss.',
        defaultSeverityHint: 'severe'
      },
      {
        id: 'death_animals',
        userLabel: 'Animal Death',
        shortDescription: 'Animal death, pet death, or harm to animals.',
        defaultSeverityHint: 'severe'
      },
      {
        id: 'grief_processing',
        userLabel: 'Grief Processing',
        shortDescription: 'Detailed grief processing, mourning, or loss processing.',
        defaultSeverityHint: 'moderate'
      },
      {
        id: 'other_death_grief',
        userLabel: 'Other Death / Grief',
        shortDescription: 'Other death/grief-related content not covered by specific subcategories.',
        defaultSeverityHint: 'mild'
      }
    ]
  },
  {
    id: 'discrimination',
    userLabel: 'Discrimination',
    shortDescription: 'Racism, sexism, homophobia, transphobia, or other forms of hate speech/discrimination.',
    legacyCategory: 'discrimination',
    subcategories: [
      {
        id: 'racism',
        userLabel: 'Racism',
        shortDescription: 'Racism, racial discrimination, racial slurs.',
        defaultSeverityHint: 'severe'
      },
      {
        id: 'sexism',
        userLabel: 'Sexism',
        shortDescription: 'Sexism, gender discrimination, misogyny, misandry.',
        defaultSeverityHint: 'moderate'
      },
      {
        id: 'homophobia',
        userLabel: 'Homophobia',
        shortDescription: 'Homophobia, anti-LGBTQ+ content, discrimination against gay/lesbian people.',
        defaultSeverityHint: 'severe'
      },
      {
        id: 'transphobia',
        userLabel: 'Transphobia',
        shortDescription: 'Transphobia, anti-trans content, discrimination against transgender people.',
        defaultSeverityHint: 'severe'
      },
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
      },
      {
        id: 'religious_discrimination',
        userLabel: 'Religious Discrimination',
        shortDescription: 'Religious discrimination, religious intolerance, religious persecution.',
        defaultSeverityHint: 'moderate'
      },
      {
        id: 'ableism',
        userLabel: 'Ableism',
        shortDescription: 'Ableism, discrimination against disabilities, disability slurs.',
        defaultSeverityHint: 'moderate'
      },
      {
        id: 'cultural_appropriation',
        userLabel: 'Cultural Appropriation / Colonial Themes',
        shortDescription: 'Cultural appropriation, colonial themes, exploitation of Indigenous or marginalized cultures, or problematic representation of cultural groups.',
        defaultSeverityHint: 'moderate'
      },
      {
        id: 'antisemitism',
        userLabel: 'Antisemitism',
        shortDescription: 'Antisemitism, anti-Jewish discrimination, or Jewish stereotypes.',
        defaultSeverityHint: 'severe'
      },
      {
        id: 'islamophobia',
        userLabel: 'Islamophobia',
        shortDescription: 'Islamophobia, anti-Muslim discrimination, or Muslim stereotypes.',
        defaultSeverityHint: 'severe'
      },
      {
        id: 'fatphobia',
        userLabel: 'Fatphobia / Body Shaming',
        shortDescription: 'Discrimination based on weight, body shaming, anti-fat bias, or cruelty toward fat characters.',
        defaultSeverityHint: 'moderate'
      },
      {
        id: 'classism',
        userLabel: 'Classism / Poverty',
        shortDescription: 'Discrimination based on class, extreme poverty, homelessness, or economic status discrimination.',
        defaultSeverityHint: 'moderate'
      },
      {
        id: 'economic_collapse',
        userLabel: 'Economic Collapse / Eviction / Job Loss',
        shortDescription: 'Economic collapse, eviction, foreclosure, job loss, or sudden economic hardship. Distinct from chronic poverty. Keywords: recession, foreclosure, redundancy, layoffs.',
        defaultSeverityHint: 'moderate'
      },
      {
        id: 'queer_joy_identity',
        userLabel: 'Queer Joy / Identity Focus',
        shortDescription: 'Non-triggering identity flags: coming out arcs, transition journeys, or positive LGBTQ+ identity exploration. Not discrimination, but identity-focused content that some readers seek or avoid. Keywords: coming out arc, transition journey, found family (queer).',
        defaultSeverityHint: 'mild'
      },
      {
        id: 'other_discrimination',
        userLabel: 'Other Discrimination',
        shortDescription: 'Other forms of discrimination not covered by specific subcategories.',
        defaultSeverityHint: 'moderate'
      }
    ]
  },
  {
    id: 'language',
    userLabel: 'Coarse Language',
    shortDescription: 'Strong language, swearing, or slurs.',
    legacyCategory: 'other',
    subcategories: [
      {
        id: 'strong_language',
        userLabel: 'Strong Language',
        shortDescription: 'Strong language, profanity, swearing.',
        defaultSeverityHint: 'mild'
      },
      {
        id: 'slurs',
        userLabel: 'Slurs',
        shortDescription: 'Slurs, hate speech, derogatory language.',
        defaultSeverityHint: 'severe'
      },
      {
        id: 'other_language',
        userLabel: 'Other Language',
        shortDescription: 'Other language-related content not covered by specific subcategories.',
        defaultSeverityHint: 'mild'
      }
    ]
  },
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
        id: 'vomiting',
        userLabel: 'Vomiting / Emetophobia',
        shortDescription: 'Vomiting, nausea, or scenes depicting sickness.',
        defaultSeverityHint: 'mild'
      },
      {
        id: 'trypophobia',
        userLabel: 'Trypophobia',
        shortDescription: 'Clusters of small holes, patterns, or trypophobia triggers.',
        defaultSeverityHint: 'mild'
      },
      {
        id: 'dental_trauma',
        userLabel: 'Dental Trauma',
        shortDescription: 'Dental procedures, teeth falling out, pulling teeth, or dental gore.',
        defaultSeverityHint: 'moderate'
      },
      {
        id: 'other_phobias',
        userLabel: 'Other Phobias',
        shortDescription: 'Other specific phobias or fear triggers not covered above.',
        defaultSeverityHint: 'mild'
      }
    ]
  },
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
        id: 'medical_detail_procedural',
        userLabel: 'Medical Detail / Procedural',
        shortDescription: 'Non-graphic surgery or medical procedures without trauma focus. Clinical or procedural medical content.',
        defaultSeverityHint: 'mild'
      },
      {
        id: 'plastic_surgery_cosmetic',
        userLabel: 'Plastic Surgery / Cosmetic Procedures',
        shortDescription: 'Plastic surgery, cosmetic procedures, or elective body modification. Distinct from body horror and general medical trauma.',
        defaultSeverityHint: 'mild'
      },
      {
        id: 'pandemics_contagion',
        userLabel: 'Pandemics / Contagion',
        shortDescription: 'Pandemics, plague, outbreaks, contagion narratives, or infectious disease themes. Common post-2020 trigger. Keywords: plague, outbreak, virus, lockdown.',
        defaultSeverityHint: 'moderate'
      },
      {
        id: 'infertility',
        userLabel: 'Infertility',
        shortDescription: 'Infertility, long-term lack of conception, or inability to conceive. Distinct from pregnancy loss.',
        defaultSeverityHint: 'severe'
      },
      {
        id: 'pregnancy_loss',
        userLabel: 'Pregnancy Loss',
        shortDescription: 'Miscarriage, stillbirth, or pregnancy loss. Distinct from infertility (long-term conception issues).',
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
        id: 'body_horror',
        userLabel: 'Body Horror',
        shortDescription: 'Body horror, extreme body modification, or graphic body-related content.',
        defaultSeverityHint: 'severe'
      },
      {
        id: 'pregnancy_childbirth',
        userLabel: 'Pregnancy / Childbirth',
        shortDescription: 'Pregnancy, childbirth, pregnancy complications, or pregnancy-related trauma.',
        defaultSeverityHint: 'moderate'
      },
      {
        id: 'other_medical',
        userLabel: 'Other Medical / Health',
        shortDescription: 'Other medical or health-related content not covered above.',
        defaultSeverityHint: 'moderate'
      }
    ]
  },
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
      },
      {
        id: 'other_religious_cult',
        userLabel: 'Other Religious / Cult',
        shortDescription: 'Other religious or cult-related content not covered above.',
        defaultSeverityHint: 'mild'
      }
    ]
  },
  {
    id: 'family_dynamics',
    userLabel: 'Family Dynamics',
    shortDescription: 'Family-related trauma, abandonment, or family system issues.',
    legacyCategory: 'other',
    subcategories: [
      {
        id: 'parental_abandonment',
        userLabel: 'Parental Abandonment',
        shortDescription: 'Parental abandonment, estrangement, or parents leaving.',
        defaultSeverityHint: 'moderate'
      },
      {
        id: 'foster_care_adoption',
        userLabel: 'Foster Care / Adoption Trauma',
        shortDescription: 'Foster care trauma, adoption breakdown, or displacement of children.',
        defaultSeverityHint: 'moderate'
      },
      {
        id: 'divorce',
        userLabel: 'Divorce / Separation',
        shortDescription: 'Divorce, separation, or relationship breakdown. Moved from Death / Grief to better reflect family dynamics context.',
        defaultSeverityHint: 'moderate'
      },
      {
        id: 'deception_or_secrets',
        userLabel: 'Deception / Secrets',
        shortDescription: 'Deception, lying, or secret-keeping involving friends or family (e.g., hiding relationship status, lying to friends, keeping secrets from loved ones).',
        defaultSeverityHint: 'mild'
      },
      {
        id: 'incest_taboo',
        userLabel: 'Incest / Pseudo-Incest',
        shortDescription: 'Incest, pseudo-incest (step-siblings), or blood relation sexual/romantic content.',
        defaultSeverityHint: 'severe'
      },
      {
        id: 'other_family_dynamics',
        userLabel: 'Other Family Dynamics',
        shortDescription: 'Other family-related trauma or dynamics not covered above.',
        defaultSeverityHint: 'mild'
      }
    ]
  },
  {
    id: 'other',
    userLabel: 'Other',
    shortDescription: 'Other potentially triggering content not covered by specific categories.',
    legacyCategory: 'other',
    subcategories: [
      {
        id: 'natural_disasters',
        userLabel: 'Natural Disasters',
        shortDescription: 'Natural disasters, environmental trauma, or climate-related events.',
        defaultSeverityHint: 'moderate'
      },
      {
        id: 'accidents',
        userLabel: 'Car Accidents / Crashes',
        shortDescription: 'Car crashes, plane crashes, or severe vehicle accidents.',
        defaultSeverityHint: 'moderate'
      },
      {
        id: 'other',
        userLabel: 'Other',
        shortDescription: 'Other potentially triggering content.',
        defaultSeverityHint: 'mild'
      }
    ]
  }
];

export type SeverityLevel = 'none' | 'mild' | 'moderate' | 'severe';

export const SEVERITY_MAPPING = {
  none: { min: 0.0, max: 0.30 },
  mild: { min: 0.31, max: 0.55 },
  moderate: { min: 0.56, max: 0.80 },
  severe: { min: 0.81, max: 1.0 }
};

export function getSeverityFromScore(score: number): SeverityLevel {
  if (score <= SEVERITY_MAPPING.none.max) return 'none';
  if (score <= SEVERITY_MAPPING.mild.max) return 'mild';
  if (score <= SEVERITY_MAPPING.moderate.max) return 'moderate';
  return 'severe';
}

export function getCategoryById(id: string): WarningCategory | undefined {
  return WARNING_CATEGORIES.find(c => c.id === id);
}

export function getSubcategoryById(categoryId: string, subcategoryId: string): WarningSubcategory | undefined {
  const category = getCategoryById(categoryId);
  if (!category) return undefined;
  return category.subcategories.find(s => s.id === subcategoryId);
}

export function getAllSubcategories(): Array<{ categoryId: string; subcategory: WarningSubcategory }> {
  const result: Array<{ categoryId: string; subcategory: WarningSubcategory }> = [];
  for (const category of WARNING_CATEGORIES) {
    for (const subcategory of category.subcategories) {
      result.push({ categoryId: category.id, subcategory });
    }
  }
  return result;
}

export function getSubcategoriesByCategory(categoryId: string): WarningSubcategory[] {
  const category = getCategoryById(categoryId);
  return category?.subcategories || [];
}

/**
 * Get a flat list of all valid subcategory IDs in the format "category_id.subcategory_id"
 * Useful for validation and AI prompts
 */
export function getAllSubcategoryIds(): string[] {
  const result: string[] = [];
  for (const category of WARNING_CATEGORIES) {
    for (const subcategory of category.subcategories) {
      result.push(`${category.id}.${subcategory.id}`);
    }
  }
  return result;
}

/**
 * Get just the subcategory IDs (without parent prefix)
 * Useful for validating the subcategory_id database field
 */
export function getSubcategoryIdsOnly(): string[] {
  const result: string[] = [];
  for (const category of WARNING_CATEGORIES) {
    for (const subcategory of category.subcategories) {
      result.push(subcategory.id);
    }
  }
  return result;
}

/**
 * Validate that a subcategory belongs to its parent category
 * Returns true if valid, false otherwise
 */
export function validateSubcategoryParent(categoryId: string, subcategoryId: string): boolean {
  const category = getCategoryById(categoryId);
  if (!category) return false;
  return category.subcategories.some(s => s.id === subcategoryId);
}

/**
 * Get all valid subcategory IDs for a specific parent category
 * Useful for AI prompt constraints and validation
 */
export function getValidSubcategoriesForCategory(categoryId: string): string[] {
  const category = getCategoryById(categoryId);
  if (!category) return [];
  return category.subcategories.map(s => s.id);
}

/**
 * Presence types: How the content appears in the book
 */
export type PresenceType = 'on_page' | 'off_page' | 'flashback' | 'referenced' | 'implied';

export const PRESENCE_TYPES: Array<{ id: PresenceType; label: string; description: string }> = [
  {
    id: 'on_page',
    label: 'On Page',
    description: 'The event is described as it happens in real-time during the narrative.'
  },
  {
    id: 'off_page',
    label: 'Off Page',
    description: 'The event happens but is not directly described (happens "off-screen").'
  },
  {
    id: 'flashback',
    label: 'Flashback',
    description: 'The event is shown in a flashback or memory sequence.'
  },
  {
    id: 'referenced',
    label: 'Referenced',
    description: 'The event is discussed or mentioned but not shown (e.g., in therapy, conversation).'
  },
  {
    id: 'implied',
    label: 'Implied',
    description: 'The event is strongly implied but not explicitly stated or shown.'
  }
];

/**
 * Detail level: How graphic or detailed the content is
 */
export type DetailLevel = 'graphic' | 'moderate' | 'vague' | 'clinical';

export const DETAIL_LEVELS: Array<{ id: DetailLevel; label: string; description: string }> = [
  {
    id: 'graphic',
    label: 'Graphic',
    description: 'Detailed, explicit, or graphic description of the content.'
  },
  {
    id: 'moderate',
    label: 'Moderate',
    description: 'Moderate level of detail, not overly explicit but clear.'
  },
  {
    id: 'vague',
    label: 'Vague',
    description: 'Vague or minimal description, mostly implied.'
  },
  {
    id: 'clinical',
    label: 'Clinical',
    description: 'Clinical or matter-of-fact description without emotional detail.'
  }
];

/**
 * Australian Context: Indigenous deceased persons protocol
 */
export interface IndigenousContext {
  hasIndigenousContent: boolean;
  hasDeceasedPersons: boolean;
}

/**
 * Helper to determine if a book requires mediation/notification
 * Based on Australian Department of Education requirements
 */
export function requiresMediation(warnings: Array<{
  category_id: string;
  severity: 'mild' | 'moderate' | 'severe';
  detail_level?: DetailLevel | null;
}>): boolean {
  // Flag if any warning is moderate+ severity in sensitive categories
  const sensitiveCategories = [
    'sexual_content',
    'violence',
    'substance_use_or_alcohol',
    'mental_health',
    'emotional_abuse_or_toxic_relationships',
    'medical_health',
    'religious_cult',
    'family_dynamics'
  ];

  return warnings.some(w => 
    sensitiveCategories.includes(w.category_id) &&
    (w.severity === 'moderate' || w.severity === 'severe')
  );
}

/**
 * Validate that a subcategory_id exists in the taxonomy for the given category_id
 * This ensures data integrity - subcategory_id must be a valid subcategory of category_id
 */
export function validateSubcategory(categoryId: string, subcategoryId: string | null | undefined): boolean {
  if (!subcategoryId) {
    // Subcategory is optional, so null/undefined is valid
    return true;
  }

  if (!categoryId) {
    // Can't validate subcategory without category
    return false;
  }

  const category = getCategoryById(categoryId);
  if (!category) {
    return false;
  }

  const subcategory = getSubcategoryById(categoryId, subcategoryId);
  return !!subcategory;
}

/**
 * Get all valid subcategory IDs for a given category
 * Useful for validation and dropdowns
 */
export function getValidSubcategoryIds(categoryId: string): string[] {
  const category = getCategoryById(categoryId);
  if (!category) {
    return [];
  }
  return category.subcategories.map(sub => sub.id);
}
