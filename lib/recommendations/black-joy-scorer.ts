import { BookAnnotation, TraumaTopic, BookTone } from '@/types/book-annotations';

// Configuration interface to allow user toggles later
export interface BlackJoyConfig {
  strictMode: boolean; // If true, ANY race-based trauma disqualifies the book
  allowSideCharacters: boolean; // If true, Black side characters count (but for less points)
  preferredTones: BookTone[];
}

const RACE_BASED_TRAUMAS: TraumaTopic[] = [
  'racism', 
  'slavery', 
  'police_violence', 
  'institutional_oppression', 
  'hate_crime', 
  'colonial_violence'
];

const DEFAULT_CONFIG: BlackJoyConfig = {
  strictMode: true,
  allowSideCharacters: false,
  preferredTones: ['cozy', 'uplifting', 'romantic', 'humorous', 'low-conflict']
};

/**
 * Calculates a score for a book based on "Black Joy" criteria.
 * Returns -1 if the book is disqualified.
 */
export function calculateBlackJoyScore(
  book: BookAnnotation, 
  config: BlackJoyConfig = DEFAULT_CONFIG
): number {
  let score = 0;

  // Safety checks for optional/missing fields
  const traumaTopics = book.traumaTopics || [];
  const mainCharacters = book.mainCharacters || [];
  const tone = book.tone || [];
  const themes = book.themes || [];

  // 1. FILTERING: Check for disqualifying trauma
  const hasRaceBasedTrauma = traumaTopics.some(topic => 
    RACE_BASED_TRAUMAS.includes(topic)
  );

  if (hasRaceBasedTrauma) {
    if (config.strictMode) return -1; // Hard disqualification
    score -= 500; // Massive penalty if strict mode is off
  }

  // 2. IDENTITY: Check for Black characters
  const blackProtagonists = mainCharacters.filter(c => 
    c.role === 'protagonist' && 
    c.identities &&
    c.identities.some(id => id.toLowerCase().includes('black') || id.toLowerCase().includes('african'))
  );

  const blackSideChars = mainCharacters.filter(c => 
    c.role !== 'protagonist' && 
    c.identities &&
    c.identities.some(id => id.toLowerCase().includes('black') || id.toLowerCase().includes('african'))
  );

  if (blackProtagonists.length > 0) {
    score += 100; // Primary goal met
  } else if (config.allowSideCharacters && blackSideChars.length > 0) {
    score += 30; // Secondary goal met
  } else {
    // If we require representation and found none, return 0 (neutral/no match)
    // or arguably -1 if this is a strict "Black Joy" search. 
    // For this implementation, 0 means "safe but irrelevant".
    return 0; 
  }

  // 3. TONE: Reward positive vibes
  const toneMatches = tone.filter(t => config.preferredTones.includes(t));
  score += (toneMatches.length * 10);

  // Penalize "Dark" or "Tragic" tones for this specific request
  // (Unless the user explicitly asked for Dark Fantasy with Black characters)
  if (tone.includes('dark')) score -= 15;
  if (tone.includes('tragic')) score -= 25;

  // 4. THEMES: Bonus for joy-specific themes
  const joyfulThemes = ['friendship', 'family', 'success', 'magic', 'romance', 'celebration'];
  const themeMatches = themes.filter(t => joyfulThemes.includes(t.toLowerCase()));
  score += (themeMatches.length * 5);

  return score;
}

export interface RankedResult {
  isbn: string;
  score: number;
  matchReason: string; // "Black protagonist, Cozy tone, No trauma detected"
}

export function scoreBooksForBlackJoyQuery(
  books: BookAnnotation[],
  userConfig?: Partial<BlackJoyConfig>
): RankedResult[] {
  const config = { ...DEFAULT_CONFIG, ...userConfig };

  const results = books.map(book => {
    const score = calculateBlackJoyScore(book, config);
    
    // Generate a simple reason string for UI display
    const reasons: string[] = [];
    const mainCharacters = book.mainCharacters || [];
    const tone = book.tone || [];
    const traumaTopics = book.traumaTopics || [];

    if (score === -1) reasons.push("Contains excluded themes");
    else if (score === 0) reasons.push("No relevant match");
    else {
      if (mainCharacters.some(c => c.role === 'protagonist' && c.identities && c.identities.some(id => id.toLowerCase().includes('black')))) {
        reasons.push("Black Lead");
      }
      if (tone.some(t => ['cozy', 'uplifting'].includes(t))) {
        reasons.push("Positive Tone");
      }
      if (!traumaTopics.length) {
        reasons.push("Trauma-free");
      }
    }

    return {
      isbn: book.isbn,
      score,
      matchReason: reasons.join(", ") || "Low match"
    };
  });

  // Sort by score descending, remove disqualified books (score -1 or 0)
  return results
    .filter(r => r.score > 0)
    .sort((a, b) => b.score - a.score);
}
