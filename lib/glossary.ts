/**
 * Glossary of terms used in content warnings
 * Provides neutral, descriptive definitions for romance/BookTok terminology
 * and other potentially confusing terms
 */

export const GLOSSARY: Record<string, string> = {
  // Sexual Dynamics & Framing
  "Power Imbalance": "Relationships involving significant disparity in authority, age, or social standing (e.g., Boss/Employee, Teacher/Student, Age Gaps).",
  "Ambiguous or Non-Explicit Consent": "Consent is unclear, negotiated implicitly, or framed as resistance/desire tension.",
  "Sexual Coercion / Pressure": "Emotional pressure, manipulation, or obligation leading to sexual activity.",
  "Degradation / Humiliation": "Sexual content involving humiliation, degradation, or verbal diminishment.",
  "Possessive or Obsessive Dynamics": "Sexual or romantic framing involving ownership, obsession, or control.",
  
  // Kink / Sexual Practices
  "BDSM Themes": "Power exchange, dominance/submission, or restraint themes. BDSM stands for Bondage, Discipline, Dominance, Submission, Sadism, and Masochism.",
  "Sexual Roleplay": "Sexual roleplay scenarios as part of intimacy.",
  "Exhibitionism / Voyeurism": "Sexual content involving being watched or watching.",
  "Taboo or Fetish Themes": "Fetish-focused sexual framing outside mainstream romance norms.",
  
  // Romance/BookTok Terms (for future use in descriptions)
  "CNC": "Consensual Non-Consent: Sexual roleplay involving agreed-upon scenarios of force or lack of consent, negotiated beforehand.",
  "Dub-Con": "Dubious Consent: Situations where consent is unclear, compromised (e.g., intoxication), or influenced by pressure/power dynamics.",
  "Non-Con": "Non-Consensual: Depictions of sexual acts occurring without consent. In Dark Romance, this is often a plot device or character dynamic.",
  "Dark Romance": "A sub-genre of romance dealing with taboo, heavy, or morally grey themes, often involving anti-heroes or villainous love interests.",
  
  // Sexual Shaming & Language
  "Sexual Shaming Language": "Language that shames or devalues characters for sexual behaviour.",
  "Purity / Virginity Framing": "Sexual value tied to virginity, purity, or sexual restraint.",
  "Gendered Sexual Degradation": "Sexually degrading language targeting women or gendered characters.",
  
  // Other potentially confusing terms
  "Explicit Sexual Content": "Explicit sexual scenes, graphic sexual descriptions.",
  "Intense Romance / Spice": "Intense romantic/sexual tension, steamy scenes, explicit romance/spice content.",
  "Sexual Themes": "Sexual themes, discussions, references (non-explicit).",
};

/**
 * Get a glossary definition for a term
 * Returns the definition if found, or null if not in glossary
 */
export function getGlossaryDefinition(term: string): string | null {
  return GLOSSARY[term] || null;
}

/**
 * Check if a term has a glossary definition
 */
export function hasGlossaryDefinition(term: string): boolean {
  return term in GLOSSARY;
}
