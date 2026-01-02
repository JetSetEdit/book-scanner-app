/**
 * Pattern Mapping for Dataset Conversion
 * 
 * Maps moderation dataset patterns to our taxonomy categories
 * with appropriate severity levels.
 */

export interface PatternMatch {
  category: string
  subcategory: string
  severity: 'mild' | 'moderate' | 'severe'
  description: string
  confidence: number // 0-1, how confident we are in this mapping
}

/**
 * Pattern definitions for different content types
 */
const PATTERNS = {
  // Sexual abuse / child abuse
  sexualAbuse: {
    keywords: [
      'pedophile', 'pedophilia', 'groomer', 'grooming', 'child abuse',
      'child molester', 'epstein', 'sexual abuse of minors', 'underage',
      'minor', 'child sexual', 'csam'
    ],
    category: 'sexual_content',
    subcategory: 'sexual_violence',
    severity: 'severe' as const,
    description: 'References to sexual abuse, particularly involving minors'
  },

  // Direct threats of violence
  violentThreats: {
    keywords: [
      'kill you', 'die', 'murder', 'death threat', 'i\'ll kill',
      'should die', 'deserves to die', 'going to kill', 'threaten to kill'
    ],
    category: 'violence',
    subcategory: 'threats',
    severity: 'severe' as const,
    description: 'Direct threats of violence or death'
  },

  // General threats (less direct)
  generalThreats: {
    keywords: [
      'threat', 'harm', 'hurt you', 'going to get you', 'watch out',
      'you\'ll pay', 'revenge', 'retaliation'
    ],
    category: 'violence',
    subcategory: 'threats',
    severity: 'moderate' as const,
    description: 'Threats or suggestions of harm'
  },

  // Identity-based slurs and hate speech
  identitySlurs: {
    keywords: [
      // Racial slurs (using patterns, not actual slurs)
      'n-word', 'racial slur', 'racist',
      // Other identity-based
      'faggot', 'fag', 'tranny', 'transphobic', 'homophobic',
      'antisemitic', 'islamophobic', 'xenophobic'
    ],
    category: 'discrimination',
    subcategory: 'hate_speech',
    severity: 'severe' as const,
    description: 'Identity-based slurs or hate speech'
  },

  // General discrimination/hate
  discrimination: {
    keywords: [
      'hate', 'disgusting people', 'you people', 'those people',
      'problem with society', 'ruining', 'destroying'
    ],
    category: 'discrimination',
    subcategory: 'other',
    severity: 'moderate' as const,
    description: 'Themes of discrimination or social conflict'
  },

  // Strong profanity (context-dependent)
  strongProfanity: {
    keywords: [
      'fuck', 'f*ck', 'shit', 'damn', 'hell', 'asshole', 'bitch',
      'bastard', 'crap', 'piss'
    ],
    category: 'language',
    subcategory: 'strong_language',
    severity: 'moderate' as const, // Can be adjusted based on context
    description: 'Strong profanity and coarse language'
  },

  // Mild profanity
  mildProfanity: {
    keywords: [
      'damn', 'hell', 'crap', 'stupid', 'idiot', 'moron'
    ],
    category: 'language',
    subcategory: 'strong_language',
    severity: 'mild' as const,
    description: 'Mild profanity or insults'
  },

  // Insults and name-calling
  insults: {
    keywords: [
      'senile', 'demented', 'crazy', 'insane', 'lunatic', 'psycho',
      'shrill', 'hysterical', 'deranged', 'nuts'
    ],
    category: 'language',
    subcategory: 'strong_language',
    severity: 'moderate' as const,
    description: 'Insults and derogatory language'
  },

  // Dehumanization
  dehumanization: {
    keywords: [
      'worthless', 'trash', 'garbage', 'scum', 'vermin', 'animal',
      'subhuman', 'not human', 'piece of'
    ],
    category: 'abuse',
    subcategory: 'emotional_abuse',
    severity: 'moderate' as const,
    description: 'Language that dehumanizes or demeans individuals'
  }
}

/**
 * Severity intensity markers
 * Presence of these increases severity
 */
const SEVERITY_BOOSTERS = {
  severe: ['kill', 'die', 'murder', 'rape', 'torture', 'pedophile', 'groomer'],
  moderate: ['threat', 'harm', 'hurt', 'hate', 'disgusting', 'worthless'],
  mild: ['stupid', 'idiot', 'moron', 'damn', 'hell']
}

/**
 * Match patterns in text and return taxonomy mappings
 */
export function matchPatterns(text: string): PatternMatch[] {
  const lowerText = text.toLowerCase()
  const matches: PatternMatch[] = []
  const matchedKeywords = new Set<string>()

  // Check each pattern category
  for (const [patternName, pattern] of Object.entries(PATTERNS)) {
    for (const keyword of pattern.keywords) {
      // Use word boundaries for better matching
      const regex = new RegExp(`\\b${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i')
      if (regex.test(lowerText) && !matchedKeywords.has(keyword)) {
        matchedKeywords.add(keyword)
        
        // Calculate confidence based on keyword specificity
        let confidence = 0.7 // Base confidence
        if (pattern.keywords.length < 5) {
          confidence = 0.9 // More specific patterns = higher confidence
        }
        
        // Check for severity boosters
        let severity = pattern.severity
        for (const booster of SEVERITY_BOOSTERS.severe) {
          if (lowerText.includes(booster) && severity !== 'severe') {
            severity = 'severe'
            confidence = Math.min(confidence + 0.1, 1.0)
            break
          }
        }

        matches.push({
          category: pattern.category,
          subcategory: pattern.subcategory,
          severity,
          description: pattern.description,
          confidence
        })
        
        // Only match once per pattern category
        break
      }
    }
  }

  // If no patterns matched but text is clearly toxic, default to language
  if (matches.length === 0 && isLikelyToxic(text)) {
    matches.push({
      category: 'language',
      subcategory: 'strong_language',
      severity: calculateDefaultSeverity(text),
      description: 'Strong or offensive language',
      confidence: 0.5
    })
  }
  
  // Additional fallback: if text has toxic characteristics but no matches
  // This catches edge cases like "senile" that might not be in keyword lists
  if (matches.length === 0) {
    const lowerText = text.toLowerCase()
    // Check for common toxic patterns that might have been missed
    if (lowerText.match(/\b(senile|demented|crazy|insane|resign|should|needs to)\b/)) {
      matches.push({
        category: 'language',
        subcategory: 'strong_language',
        severity: 'moderate',
        description: 'Strong or offensive language',
        confidence: 0.4
      })
    }
  }

  return matches
}

/**
 * Check if text is likely toxic even without pattern matches
 */
function isLikelyToxic(text: string): boolean {
  const lowerText = text.toLowerCase()
  
  // Check for all-caps (often indicates anger)
  const capsRatio = (text.match(/[A-Z]/g) || []).length / text.length
  if (capsRatio > 0.5 && text.length > 10) {
    return true
  }
  
  // Check for multiple exclamation marks
  if ((text.match(/!/g) || []).length > 2) {
    return true
  }
  
  // Check for common toxic phrases
  const toxicPhrases = [
    'you are', 'you\'re', 'you should', 'go to hell',
    'shut up', 'fuck off', 'get lost'
  ]
  
  return toxicPhrases.some(phrase => lowerText.includes(phrase))
}

/**
 * Calculate default severity based on text characteristics
 */
function calculateDefaultSeverity(text: string): 'mild' | 'moderate' | 'severe' {
  const lowerText = text.toLowerCase()
  
  // Count severity indicators
  let severeCount = 0
  let moderateCount = 0
  let mildCount = 0
  
  SEVERITY_BOOSTERS.severe.forEach(term => {
    if (lowerText.includes(term)) severeCount++
  })
  
  SEVERITY_BOOSTERS.moderate.forEach(term => {
    if (lowerText.includes(term)) moderateCount++
  })
  
  SEVERITY_BOOSTERS.mild.forEach(term => {
    if (lowerText.includes(term)) mildCount++
  })
  
  // Determine severity
  if (severeCount > 0) return 'severe'
  if (moderateCount > 1 || (moderateCount > 0 && text.length > 100)) return 'moderate'
  if (mildCount > 0 || text.length < 20) return 'mild'
  
  return 'moderate' // Default
}

/**
 * Get the best match(es) for a text, prioritizing higher confidence and severity
 */
export function getBestMatches(text: string, maxMatches: number = 2): PatternMatch[] {
  const matches = matchPatterns(text)
  
  // Sort by confidence (desc) then severity (severe > moderate > mild)
  const severityOrder = { severe: 3, moderate: 2, mild: 1 }
  matches.sort((a, b) => {
    if (a.confidence !== b.confidence) {
      return b.confidence - a.confidence
    }
    return severityOrder[b.severity] - severityOrder[a.severity]
  })
  
  // Remove duplicates (same category/subcategory)
  const seen = new Set<string>()
  const unique: PatternMatch[] = []
  
  for (const match of matches) {
    const key = `${match.category}.${match.subcategory}`
    if (!seen.has(key)) {
      seen.add(key)
      unique.push(match)
      if (unique.length >= maxMatches) break
    }
  }
  
  return unique
}

