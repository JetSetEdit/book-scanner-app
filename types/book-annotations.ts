/**
 * Represents the identity of a character.
 * We use string literals for known categories but allow string for flexibility.
 */
export type IdentityAttribute = 
  | 'Black' 
  | 'African American' 
  | 'Afro-Latine' 
  | 'Indigenous' 
  | 'Asian' 
  | 'White' 
  | 'LGBTQ+' 
  | 'Disabled'
  | string;

export type CharacterRole = 'protagonist' | 'deuteragonist' | 'supporting';

export interface CharacterProfile {
  name: string;
  role: CharacterRole;
  identities: IdentityAttribute[];
  // Helpful for "Black Joy" - is this character's arc positive?
  outcome?: 'positive' | 'tragic' | 'ambiguous'; 
}

/**
 * Specific trauma categories used for filtering.
 */
export type TraumaTopic = 
  // Race-based traumas (The "Hard Filters")
  | 'racism' 
  | 'slavery' 
  | 'police_violence' 
  | 'institutional_oppression' 
  | 'hate_crime'
  | 'colonial_violence'
  // General traumas
  | 'sexual_violence'
  | 'domestic_abuse'
  | 'grief'
  | 'chronic_illness'
  | 'poverty'
  | 'war'
  // Catch-all for other strings
  | string;

export type BookTone = 
  | 'cozy' 
  | 'uplifting' 
  | 'romantic' 
  | 'humorous' 
  | 'low-conflict' 
  | 'high-stakes' 
  | 'dark' 
  | 'tragic'
  | string;

export interface BookAnnotation {
  isbn: string;
  title: string;
  mainCharacters: CharacterProfile[];
  themes: string[]; // e.g., "friendship", "baking", "mystery"
  traumaTopics: TraumaTopic[];
  tone: BookTone[];
  // 0-10 score of how central identity struggle is to the plot
  identityStruggleScore: number; 
}
