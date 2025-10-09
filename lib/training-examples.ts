// Training examples for content warning generation
// Add your examples here to improve the AI agent

// ============================================================================
// THEME AND CATEGORY BREAKDOWN
// ============================================================================

export interface ThemePattern {
  theme: string;
  trigger_words: string[];
  common_categories: string[];
  typical_severity: 'mild' | 'moderate' | 'severe';
  examples: string[];
}

export const themePatterns: ThemePattern[] = [
  {
    theme: "Dark Romance",
    trigger_words: ["dark", "obsession", "trauma", "abuse", "murder", "violence", "degradation", "kink", "twisted love", "forbidden romance", "power imbalance", "gritty", "raw", "darkly emotional"],
    common_categories: ["abuse", "violence", "sexual_content", "mental_health"],
    typical_severity: "severe",
    examples: ["TWISTED LOVE", "TWISTED GAMES", "TWISTED HATE", "TWISTED LIES", "KING OF WRATH", "KING OF ENVY"]
  },
  {
    theme: "Contemporary Romance",
    trigger_words: ["anxiety", "stress", "disordered eating", "alcohol", "cheating", "toxic", "family pressure", "healing journey", "broken family", "troubled past"],
    common_categories: ["mental_health", "substance_abuse", "other"],
    typical_severity: "moderate",
    examples: ["Icebreaker", "Wildfire", "Daydream", "Holiday Ever After"]
  },
  {
    theme: "Family Dynamics",
    trigger_words: ["abusive parents", "neglect", "disownment", "family estrangement", "parental pressure", "broken family", "troubled past", "family trauma"],
    common_categories: ["abuse", "mental_health"],
    typical_severity: "moderate",
    examples: ["TWISTED LOVE", "KING OF WRATH", "KING OF SLOTH", "Wildfire", "Daydream"]
  },
  {
    theme: "Violence & Crime",
    trigger_words: ["murder", "killer", "violence", "gun", "torture", "arson", "kidnapping", "blackmail", "war", "combat", "terrorism", "hostage", "bombing", "blood", "injury", "gritty", "raw"],
    common_categories: ["violence", "death", "other"],
    typical_severity: "severe",
    examples: ["TWISTED GAMES", "TWISTED HATE", "TWISTED LIES", "KING OF ENVY", "Gravity Let Me Go"]
  },
  {
    theme: "Mental Health",
    trigger_words: ["anxiety", "depression", "suicide", "panic attacks", "mental illness", "trauma", "self-deception", "PTSD", "bipolar", "dissociation", "psychosis", "haunting", "disturbing", "unflinching"],
    common_categories: ["mental_health"],
    typical_severity: "moderate",
    examples: ["TWISTED LOVE", "TWISTED LIES", "Icebreaker", "Wildfire", "Daydream"]
  },
  {
    theme: "Substance Use",
    trigger_words: ["alcohol", "drugs", "addiction", "substance abuse", "smoking", "overdose", "intoxication", "rehab", "withdrawal"],
    common_categories: ["substance_abuse"],
    typical_severity: "moderate",
    examples: ["TWISTED GAMES", "KING OF GREED", "Icebreaker", "Wildfire", "Daydream", "Holiday Ever After"]
  },
  {
    theme: "Sexual Content",
    trigger_words: ["sexual", "consensual", "kink", "degradation", "harassment", "assault", "coercion", "power imbalance", "explicit", "intimate"],
    common_categories: ["sexual_content", "abuse"],
    typical_severity: "moderate",
    examples: ["TWISTED LOVE", "TWISTED HATE", "Icebreaker", "Wildfire", "Daydream", "Holiday Ever After"]
  },
  {
    theme: "Death & Loss",
    trigger_words: ["death", "murder", "grief", "loss", "funeral", "mortality", "suicide", "miscarriage", "stillbirth", "child death", "coming-of-age with a tragic twist", "haunting", "disturbing"],
    common_categories: ["death", "mental_health"],
    typical_severity: "moderate",
    examples: ["TWISTED GAMES", "TWISTED HATE", "TWISTED LIES", "KING OF WRATH", "KING OF GREED", "KING OF SLOTH", "THE STRIKER"]
  },
  {
    theme: "Discrimination & Social Issues",
    trigger_words: ["racism", "sexism", "homophobia", "discrimination", "medical negligence", "prejudice", "transphobia", "xenophobia", "antisemitism", "islamophobia", "ableism"],
    common_categories: ["discrimination"],
    typical_severity: "moderate",
    examples: ["TWISTED LIES", "Daydream", "The Seven Husbands of Evelyn Hugo"]
  },
  {
    theme: "Religion & Cult Themes",
    trigger_words: ["cult", "religion", "religious trauma", "excommunication", "fanatic", "indoctrination", "church", "priest", "worship", "ritual", "sacrifice", "prophecy", "fanaticism"],
    common_categories: ["other", "abuse", "mental_health"],
    typical_severity: "moderate",
    examples: []
  },
  {
    theme: "Medical & Bodily Harm",
    trigger_words: ["blood", "injury", "hospital", "surgery", "disease", "cancer", "miscarriage", "infertility", "chronic illness", "disability", "accident", "medical trauma"],
    common_categories: ["other", "death", "mental_health"],
    typical_severity: "moderate",
    examples: []
  },
  {
    theme: "Animal Harm",
    trigger_words: ["animal cruelty", "pet death", "animal death", "hunting", "vivisection", "slaughter", "animal abuse"],
    common_categories: ["other", "violence"],
    typical_severity: "moderate",
    examples: []
  },
  {
    theme: "Psychological Manipulation",
    trigger_words: ["gaslighting", "coercion", "mind control", "psychological abuse", "emotional abuse", "narcissism", "manipulation", "control"],
    common_categories: ["abuse", "mental_health"],
    typical_severity: "moderate",
    examples: []
  },
  {
    theme: "Based on True Events",
    trigger_words: ["based on true events", "true story", "real events", "historical", "biographical", "memoir"],
    common_categories: ["other", "mental_health", "violence"],
    typical_severity: "moderate",
    examples: []
  }
];

export interface CategoryGuidelines {
  category: string;
  description: string;
  severity_guidelines: {
    mild: string[];
    moderate: string[];
    severe: string[];
  };
  common_trigger_words: string[];
  examples_from_training: string[];
}

export const categoryGuidelines: CategoryGuidelines[] = [
  {
    category: "violence",
    description: "Physical violence, fighting, weapons, war, murder, torture, blood, injury",
    severity_guidelines: {
      mild: ["fantasy violence", "mild fighting", "weapons mentioned", "blood mentioned"],
      moderate: ["gun violence", "physical altercations", "attempted murder", "war", "combat"],
      severe: ["torture", "graphic violence", "murder", "arson", "terrorism", "bombing"]
    },
    common_trigger_words: ["murder", "violence", "gun", "fight", "weapon", "torture", "arson", "kill", "kills", "killed", "violent", "blood", "injury", "war", "combat", "terrorism", "hostage", "bombing"],
    examples_from_training: ["Attempted murder/drowning", "Gun violence", "Death/graphic violence", "Torture", "Arson"]
  },
  {
    category: "abuse",
    description: "Physical, emotional, or sexual abuse, domestic violence, neglect, gaslighting, coercion",
    severity_guidelines: {
      mild: ["emotional manipulation", "toxic relationships", "mild coercion"],
      moderate: ["verbal abuse", "neglect", "harassment", "gaslighting", "psychological abuse"],
      severe: ["physical abuse", "sexual assault", "child abuse", "domestic violence", "mind control"]
    },
    common_trigger_words: ["abuse", "neglect", "harassment", "assault", "manipulation", "toxic", "abusive", "gaslighting", "coercion", "emotional abuse", "psychological abuse", "narcissism", "control", "domestic violence"],
    examples_from_training: ["Abusive parents and child abuse", "Sexual harassment and assault", "Parental neglect and verbal abuse"]
  },
  {
    category: "mental_health",
    description: "Depression, anxiety, suicide, mental illness, psychological trauma, PTSD, bipolar",
    severity_guidelines: {
      mild: ["stress", "anxiety mentions", "mood changes", "mental health themes"],
      moderate: ["depression", "panic attacks", "mental health struggles", "PTSD", "bipolar"],
      severe: ["suicide", "severe mental illness", "psychological trauma", "psychosis", "dissociation"]
    },
    common_trigger_words: ["anxiety", "depression", "suicide", "mental health", "panic", "trauma", "stress", "suicidal", "PTSD", "bipolar", "dissociation", "psychosis", "mental illness", "self-deception"],
    examples_from_training: ["Aquaphobia/panic attacks and mentions of suicide", "Disordered eating, anxiety and stress", "Mental health (low self esteem)"]
  },
  {
    category: "death",
    description: "Character deaths, grief, loss, mortality themes, miscarriage, stillbirth",
    severity_guidelines: {
      mild: ["death mentioned", "grief themes", "loss of loved ones", "mortality themes"],
      moderate: ["character death", "death of family members", "miscarriage", "stillbirth"],
      severe: ["graphic death", "murder", "death of minors", "child death"]
    },
    common_trigger_words: ["death", "die", "murder", "grief", "loss", "funeral", "mortality", "miscarriage", "stillbirth", "child death", "blood"],
    examples_from_training: ["Death of a parent", "Death of a minor (small scene)", "Death and murder"]
  },
  {
    category: "sexual_content",
    description: "Sexual situations, explicit content, romance with mature themes, assault, coercion",
    severity_guidelines: {
      mild: ["romance", "kissing", "mild sexual content", "intimate themes"],
      moderate: ["sexual situations", "mature themes", "kink", "harassment", "power imbalance"],
      severe: ["explicit sexual content", "non-consensual situations", "assault", "coercion"]
    },
    common_trigger_words: ["sexual", "sex", "kink", "romance", "intimate", "explicit", "sexuality", "harassment", "assault", "coercion", "power imbalance"],
    examples_from_training: ["Sexual content (consensual)", "Degradation kink", "Mildly dubious consent (one scene)"]
  },
  {
    category: "substance_abuse",
    description: "Alcohol, drugs, smoking, addiction themes, intoxication, rehab",
    severity_guidelines: {
      mild: ["alcohol use", "smoking mentioned", "substance use"],
      moderate: ["substance abuse", "addiction themes", "drug use", "intoxication"],
      severe: ["severe addiction", "overdose", "substance dependency", "rehab", "withdrawal"]
    },
    common_trigger_words: ["alcohol", "drug", "smoking", "addiction", "substance", "overdose", "addictive", "drugs", "intoxication", "rehab", "withdrawal"],
    examples_from_training: ["Alcohol use", "Addiction issues (parent)", "Mention of death and drug overdose"]
  },
  {
    category: "discrimination",
    description: "Racism, sexism, homophobia, prejudice, hate crimes, transphobia, ableism",
    severity_guidelines: {
      mild: ["prejudice mentioned", "discrimination themes", "bias"],
      moderate: ["racism", "sexism", "homophobia", "transphobia", "xenophobia"],
      severe: ["hate crimes", "systemic discrimination", "violence based on identity", "antisemitism", "islamophobia"]
    },
    common_trigger_words: ["racism", "sexism", "homophobia", "discrimination", "prejudice", "hate", "prejudiced", "transphobia", "xenophobia", "antisemitism", "islamophobia", "ableism"],
    examples_from_training: ["Mention of Black women being disproportionately impacted by medical negligence", "Themes of sexism, homophobia, and racism"]
  },
  {
    category: "other",
    description: "Any other potentially triggering content: kidnapping, stalking, cults, medical trauma, animal harm",
    severity_guidelines: {
      mild: ["explicit language", "mild themes", "brief mentions", "disturbing content"],
      moderate: ["blackmail", "stalking", "kidnapping", "cult themes", "medical trauma", "animal cruelty"],
      severe: ["extreme situations", "highly disturbing content", "religious trauma", "animal death"]
    },
    common_trigger_words: ["blackmail", "stalking", "kidnapping", "explicit", "disturbing", "cult", "religion", "religious trauma", "fanatic", "indoctrination", "hospital", "surgery", "disease", "cancer", "chronic illness", "disability", "animal cruelty", "pet death", "animal death", "based on true events", "true story", "memoir"],
    examples_from_training: ["Blackmail", "Stalking/cyberstalking", "Kidnapping", "Explicit language"]
  }
];

export interface TrainingExample {
  book_title: string;
  book_author: string;
  book_description: string;
  book_categories?: string[];
  expected_warnings: Array<{
    category: 'violence' | 'sexual_content' | 'substance_abuse' | 'mental_health' | 'death' | 'abuse' | 'discrimination' | 'other';
    description: string;
    severity: 'mild' | 'moderate' | 'severe';
  }>;
  notes?: string;
}

export const trainingExamples: TrainingExample[] = [
  {
    book_title: "TWISTED LOVE",
    book_author: "Ana Huang",
    book_description: "A dark romance novel with themes of love, obsession, and trauma",
    book_categories: ["Romance", "Fiction"],
    expected_warnings: [
      {
        category: "abuse",
        description: "Abusive parents and child abuse",
        severity: "severe"
      },
      {
        category: "mental_health",
        description: "Aquaphobia/panic attacks and mentions of suicide",
        severity: "moderate"
      },
      {
        category: "violence",
        description: "Attempted murder/drowning and death and violence",
        severity: "severe"
      },
      {
        category: "sexual_content",
        description: "Degradation kink",
        severity: "moderate"
      }
    ],
    notes: "Author-approved content warnings from official website - shows comprehensive coverage of triggering content"
  },
  {
    book_title: "TWISTED GAMES",
    book_author: "Ana Huang",
    book_description: "A dark romance novel with themes of power, protection, and danger",
    book_categories: ["Romance", "Fiction"],
    expected_warnings: [
      {
        category: "violence",
        description: "Gun violence",
        severity: "severe"
      },
      {
        category: "abuse",
        description: "Mentions of child abuse",
        severity: "moderate"
      },
      {
        category: "death",
        description: "Mentions of death and drug overdose",
        severity: "moderate"
      }
    ],
    notes: "Author-approved content warnings from official website"
  },
  {
    book_title: "TWISTED HATE",
    book_author: "Ana Huang",
    book_description: "A dark romance novel with themes of revenge, obsession, and forbidden love",
    book_categories: ["Romance", "Fiction"],
    expected_warnings: [
      {
        category: "abuse",
        description: "Abusive parents and sexual harassment",
        severity: "severe"
      },
      {
        category: "other",
        description: "Blackmail and stalking",
        severity: "moderate"
      },
      {
        category: "death",
        description: "Death of a parent and death of a minor (small scene)",
        severity: "severe"
      },
      {
        category: "sexual_content",
        description: "Mildly dubious consent (one scene)",
        severity: "moderate"
      }
    ],
    notes: "Author-approved content warnings from official website"
  },
  {
    book_title: "TWISTED LIES",
    book_author: "Ana Huang",
    book_description: "A dark romance novel with themes of deception, obsession, and dangerous secrets",
    book_categories: ["Romance", "Fiction"],
    expected_warnings: [
      {
        category: "mental_health",
        description: "Alzheimer's, anxiety, and mention of suicide",
        severity: "moderate"
      },
      {
        category: "violence",
        description: "Death/graphic violence",
        severity: "severe"
      },
      {
        category: "death",
        description: "Death of a parent",
        severity: "moderate"
      },
      {
        category: "abuse",
        description: "Emotionally abusive parents",
        severity: "moderate"
      },
      {
        category: "other",
        description: "Kidnapping and stalking/cyberstalking",
        severity: "severe"
      }
    ],
    notes: "Author-approved content warnings from official website"
  },
  {
    book_title: "KING OF WRATH",
    book_author: "Ana Huang",
    book_description: "A dark romance novel with themes of revenge, family dynamics, and dangerous secrets",
    book_categories: ["Romance", "Fiction"],
    expected_warnings: [
      {
        category: "other",
        description: "Blackmail",
        severity: "moderate"
      },
      {
        category: "death",
        description: "Death of a family member (mentioned)",
        severity: "mild"
      },
      {
        category: "abuse",
        description: "Emotional abuse, parental neglect, and family disownment",
        severity: "severe"
      },
      {
        category: "violence",
        description: "Robbery at gunpoint",
        severity: "severe"
      }
    ],
    notes: "Author-approved content warnings from official website"
  },
  {
    book_title: "KING OF PRIDE",
    book_author: "Ana Huang",
    book_description: "A dark romance novel with themes of power, secrets, and dangerous games",
    book_categories: ["Romance", "Fiction"],
    expected_warnings: [
      {
        category: "other",
        description: "Blackmail",
        severity: "moderate"
      },
      {
        category: "other",
        description: "Mention of cancer",
        severity: "mild"
      }
    ],
    notes: "Author-approved content warnings from official website"
  },
  {
    book_title: "KING OF GREED",
    book_author: "Ana Huang",
    book_description: "A dark romance novel with themes of ambition, betrayal, and dangerous desires",
    book_categories: ["Romance", "Fiction"],
    expected_warnings: [
      {
        category: "death",
        description: "Death",
        severity: "moderate"
      },
      {
        category: "violence",
        description: "Mild violence",
        severity: "mild"
      },
      {
        category: "abuse",
        description: "Mention of child abandonment/abuse",
        severity: "moderate"
      }
    ],
    notes: "Author-approved content warnings from official website"
  },
  {
    book_title: "KING OF SLOTH",
    book_author: "Ana Huang",
    book_description: "A dark romance novel with themes of family dynamics, health struggles, and complex relationships",
    book_categories: ["Romance", "Fiction"],
    expected_warnings: [
      {
        category: "other",
        description: "Cheating (not by a main character)",
        severity: "mild"
      },
      {
        category: "death",
        description: "Death of a parent",
        severity: "moderate"
      },
      {
        category: "abuse",
        description: "Emotional abuse and family estrangement",
        severity: "moderate"
      },
      {
        category: "mental_health",
        description: "Mentions of Chronic Fatigue Syndrome",
        severity: "mild"
      }
    ],
    notes: "Author-approved content warnings from official website"
  },
  {
    book_title: "KING OF ENVY",
    book_author: "Ana Huang",
    book_description: "A dark romance novel with themes of obsession, revenge, and dangerous power dynamics",
    book_categories: ["Romance", "Fiction"],
    expected_warnings: [
      {
        category: "abuse",
        description: "Sexual harassment and assault and financial abuse",
        severity: "severe"
      },
      {
        category: "violence",
        description: "Death and murder, torture, and arson",
        severity: "severe"
      }
    ],
    notes: "Author-approved content warnings from official website"
  },
  {
    book_title: "THE STRIKER",
    book_author: "Ana Huang",
    book_description: "A romance novel with themes of sports, relationships, and life challenges",
    book_categories: ["Romance", "Fiction"],
    expected_warnings: [
      {
        category: "violence",
        description: "Car accidents and injuries",
        severity: "moderate"
      },
      {
        category: "mental_health",
        description: "Chronic pain representation",
        severity: "mild"
      },
      {
        category: "death",
        description: "Death of loved ones",
        severity: "moderate"
      }
    ],
    notes: "Author-approved content warnings from official website"
  },
  {
    book_title: "Icebreaker",
    book_author: "Hannah Grace",
    book_description: "A contemporary romance novel with themes of sports, relationships, and personal growth",
    book_categories: ["Romance", "Fiction"],
    expected_warnings: [
      {
        category: "mental_health",
        description: "Disordered eating, anxiety and stress",
        severity: "moderate"
      },
      {
        category: "sexual_content",
        description: "Sexual content (consensual)",
        severity: "moderate"
      },
      {
        category: "other",
        description: "Toxic friendships",
        severity: "mild"
      },
      {
        category: "violence",
        description: "Near death experience",
        severity: "moderate"
      },
      {
        category: "death",
        description: "Death of a parent (past event, only discussed)",
        severity: "mild"
      },
      {
        category: "other",
        description: "Cheating (past event, only discussed and not involving either main character)",
        severity: "mild"
      },
      {
        category: "substance_abuse",
        description: "Alcohol use",
        severity: "mild"
      },
      {
        category: "other",
        description: "Explicit language",
        severity: "mild"
      }
    ],
    notes: "Author-approved content warnings from official website"
  },
  {
    book_title: "Wildfire",
    book_author: "Hannah Grace",
    book_description: "A contemporary romance novel with themes of relationships, personal struggles, and growth",
    book_categories: ["Romance", "Fiction"],
    expected_warnings: [
      {
        category: "substance_abuse",
        description: "Addiction issues (parent) and alcohol use",
        severity: "moderate"
      },
      {
        category: "abuse",
        description: "Parental neglect and verbal abuse",
        severity: "severe"
      },
      {
        category: "mental_health",
        description: "Mental health (low self esteem)",
        severity: "moderate"
      },
      {
        category: "sexual_content",
        description: "Sexual content (consensual)",
        severity: "moderate"
      },
      {
        category: "other",
        description: "Explicit language",
        severity: "mild"
      }
    ],
    notes: "Author-approved content warnings from official website"
  },
  {
    book_title: "Daydream",
    book_author: "Hannah Grace",
    book_description: "A contemporary romance novel with themes of family dynamics, academic pressure, and personal identity",
    book_categories: ["Romance", "Fiction"],
    expected_warnings: [
      {
        category: "mental_health",
        description: "Family pressure (shown through the eyes of an eldest daughter), anxiety, and social/academic pressures, and internalized pressures related to neurodivergence (undiagnosed)",
        severity: "moderate"
      },
      {
        category: "sexual_content",
        description: "Sexual content (consensual) and discussions about being pressured sexually",
        severity: "moderate"
      },
      {
        category: "substance_abuse",
        description: "Alcohol use, drug use (not main characters), and drink spiking (not main characters)",
        severity: "moderate"
      },
      {
        category: "discrimination",
        description: "Mention of Black women being disproportionately impacted by medical negligence",
        severity: "mild"
      },
      {
        category: "other",
        description: "Discussions about birth control",
        severity: "mild"
      },
      {
        category: "violence",
        description: "Physical altercation (not between main characters)",
        severity: "mild"
      },
      {
        category: "other",
        description: "Explicit language",
        severity: "mild"
      }
    ],
    notes: "Author-approved content warnings from official website"
  },
  {
    book_title: "Holiday Ever After",
    book_author: "Hannah Grace",
    book_description: "A contemporary romance novel with themes of holidays, relationships, and family",
    book_categories: ["Romance", "Fiction"],
    expected_warnings: [
      {
        category: "sexual_content",
        description: "Sexual content (consensual)",
        severity: "moderate"
      },
      {
        category: "death",
        description: "Death of a grandparent (past event, only discussed)",
        severity: "mild"
      },
      {
        category: "substance_abuse",
        description: "Alcohol use",
        severity: "mild"
      },
      {
        category: "other",
        description: "Explicit language",
        severity: "mild"
      }
    ],
    notes: "Author-approved content warnings from official website"
  }
];

// Function to get random training examples for the AI agent
export function getRandomTrainingExamples(count: number = 3): TrainingExample[] {
  const shuffled = [...trainingExamples].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

// Function to format examples for the AI prompt
export function formatExamplesForPrompt(examples: TrainingExample[]): string {
  return examples.map((example, index) => `
Example ${index + 1}:
Book: "${example.book_title}" by ${example.book_author}
Description: ${example.book_description}
Expected Warnings: ${JSON.stringify(example.expected_warnings, null, 2)}
${example.notes ? `Notes: ${example.notes}` : ''}
`).join('\n');
}
