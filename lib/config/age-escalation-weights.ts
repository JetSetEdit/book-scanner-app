/**
 * Age Escalation Weights
 * 
 * Different SEVERE content types have different "escalation weights" that determine
 * how they map to age ratings. This allows more nuanced age rating assignment.
 * 
 * Weights range from 0.0 to 1.0:
 * - 0.0-0.3: Low escalation (may stay M even with SEVERE)
 * - 0.3-0.6: Medium escalation (typically MA15+)
 * - 0.6-0.8: High escalation (typically R18+)
 * - 0.8-1.0: Very high escalation (R18+ or RC)
 */

export interface EscalationWeight {
  category: string
  subcategory?: string
  weight: number
  reasoning: string
}

/**
 * Age escalation weights for different content types
 * 
 * These weights determine how SEVERE warnings in each category/subcategory
 * should escalate the age rating. Higher weights = higher age rating.
 */
export const AGE_ESCALATION_WEIGHTS: EscalationWeight[] = [
  // Mental Health - Low to Medium escalation
  {
    category: 'mental_health',
    subcategory: 'depression',
    weight: 0.4,
    reasoning: 'Serious but often age-appropriate for 15+ with context'
  },
  {
    category: 'mental_health',
    subcategory: 'ptsd',
    weight: 0.45,
    reasoning: 'Serious trauma themes, but often age-appropriate for 15+'
  },
  {
    category: 'mental_health',
    subcategory: 'anxiety',
    weight: 0.3,
    reasoning: 'Common theme, lower escalation'
  },
  {
    category: 'mental_health',
    subcategory: 'self_harm',
    weight: 0.6,
    reasoning: 'Graphic self-harm requires higher age rating'
  },
  {
    category: 'mental_health',
    subcategory: 'suicidal_ideation',
    weight: 0.65,
    reasoning: 'Detailed suicide content requires higher age rating'
  },
  {
    category: 'mental_health',
    weight: 0.4, // Default for mental health
    reasoning: 'Mental health themes are serious but often age-appropriate for 15+'
  },

  // Violence - Medium to High escalation
  {
    category: 'violence',
    subcategory: 'war',
    weight: 0.5,
    reasoning: 'Stylized war/combat, common in fantasy/YA'
  },
  {
    category: 'violence',
    subcategory: 'physical_violence',
    weight: 0.45,
    reasoning: 'Physical violence, moderate escalation'
  },
  {
    category: 'violence',
    subcategory: 'graphic_violence',
    weight: 0.7,
    reasoning: 'Graphic violence requires higher age rating'
  },
  {
    category: 'violence',
    subcategory: 'torture',
    weight: 0.75,
    reasoning: 'Torture is extreme and requires R18+'
  },
  {
    category: 'violence',
    subcategory: 'infanticide_or_intentional_child_harm',
    weight: 0.8,
    reasoning: 'Intentional harm to infants/children is highly disturbing and should strongly escalate age rating'
  },
  {
    category: 'violence',
    subcategory: 'domestic_violence',
    weight: 0.6,
    reasoning: 'Domestic violence is serious and disturbing'
  },
  {
    category: 'violence',
    subcategory: 'school_shootings',
    weight: 0.7,
    reasoning: 'Mass violence events are highly disturbing'
  },
  {
    category: 'violence',
    weight: 0.5, // Default for violence
    reasoning: 'Violence typically requires MA15+'
  },

  // Sexual Content - Medium to High escalation
  {
    category: 'sexual_content',
    subcategory: 'intense_romance_or_spice',
    weight: 0.58,
    reasoning: 'Mature romantic themes with spice, typically MA15+ (presentation multiplier handles on-page vs off-page differences)'
  },
  {
    category: 'sexual_content',
    subcategory: 'explicit_sexual_content',
    weight: 0.7,
    reasoning: 'Explicit sexual content requires R18+'
  },
  {
    category: 'sexual_content',
    subcategory: 'sexual_violence',
    weight: 0.9,
    reasoning: 'Sexual violence always requires R18+'
  },
  // Specific Kinks
  {
    category: 'sexual_content',
    subcategory: 'group_sex',
    weight: 0.65,
    reasoning: 'Group sex typically indicates higher maturity'
  },
  {
    category: 'sexual_content',
    subcategory: 'public_sex',
    weight: 0.6,
    reasoning: 'Public sex typically indicates higher maturity'
  },
  {
    category: 'sexual_content',
    subcategory: 'degradation_kink',
    weight: 0.65,
    reasoning: 'Degradation kink themes require maturity'
  },
  {
    category: 'sexual_content',
    subcategory: 'monster_romance',
    weight: 0.6,
    reasoning: 'Monster romance often involves explicit/unconventional themes'
  },
  {
    category: 'sexual_content',
    weight: 0.5, // Default for sexual content
    reasoning: 'Sexual content typically requires MA15+'
  },

  // Tropes - Variable escalation
  {
    category: 'tropes',
    subcategory: 'stalker_romance',
    weight: 0.75,
    reasoning: 'Stalker romance involves serious/criminal themes framed as romance'
  },
  {
    category: 'tropes',
    subcategory: 'kidnapping_romance',
    weight: 0.75,
    reasoning: 'Captive/kidnapping themes involve serious criminal acts'
  },
  {
    category: 'tropes',
    subcategory: 'dark_romance',
    weight: 0.6,
    reasoning: 'Dark romance implies mature/taboo themes'
  },
  {
    category: 'tropes',
    subcategory: 'bully_romance',
    weight: 0.55,
    reasoning: 'Bullying dynamics require maturity'
  },
  {
    category: 'tropes',
    subcategory: 'mafia_romance',
    weight: 0.6,
    reasoning: 'Organized crime themes imply violence/mature content'
  },
  {
    category: 'tropes',
    subcategory: 'omegaverse',
    weight: 0.6,
    reasoning: 'Omegaverse dynamics often involve biological essentialism/dub-con themes'
  },
  {
    category: 'tropes',
    subcategory: 'why_choose',
    weight: 0.55,
    reasoning: 'Polyamorous/reverse harem dynamics require maturity'
  },
  {
    category: 'tropes',
    weight: 0.45, // Default for tropes (e.g. enemies-to-lovers, age gap)
    reasoning: 'Tropes generally map to moderate themes'
  },

  // Abuse - Medium to High escalation
  {
    category: 'abuse',
    subcategory: 'domestic_violence',
    weight: 0.6,
    reasoning: 'Domestic violence is serious and disturbing'
  },
  {
    category: 'emotional_abuse_or_toxic_relationships',
    subcategory: 'gaslighting',
    weight: 0.45,
    reasoning: 'Psychological manipulation, moderate escalation'
  },
  {
    category: 'abuse',
    weight: 0.55, // Default for abuse
    reasoning: 'Abuse themes are serious and typically require MA15+'
  },

  // Substance Use - Medium escalation
  {
    category: 'substance_use_or_alcohol',
    weight: 0.4,
    reasoning: 'Substance use is mature but often age-appropriate for 15+'
  },

  // Death/Grief - Low to Medium escalation
  {
    category: 'death_or_grief',
    weight: 0.35,
    reasoning: 'Death and grief are universal themes, lower escalation'
  },

  // Discrimination - Medium escalation
  {
    category: 'discrimination',
    weight: 0.45,
    reasoning: 'Discrimination themes are serious but often age-appropriate for 15+'
  },

  // Default fallback
  {
    category: 'other',
    weight: 0.4,
    reasoning: 'Default escalation for other content types'
  }
]

/**
 * Get escalation weight for a warning
 * 
 * Looks up the most specific match (category + subcategory) first,
 * then falls back to category-only, then default.
 */
export function getEscalationWeight(
  categoryId: string,
  subcategoryId?: string | null
): number {
  // Try to find exact match (category + subcategory)
  if (subcategoryId) {
    const subcategory = subcategoryId.split('.')[1] || subcategoryId
    
    // First try exact match
    const exactMatch = AGE_ESCALATION_WEIGHTS.find(
      w => w.category === categoryId && w.subcategory === subcategory
    )
    if (exactMatch) return exactMatch.weight
    
    // Try partial match for known aliases (e.g., "intense_romance" matches "intense_romance_or_spice")
    if (categoryId === 'sexual_content') {
      if (subcategory === 'intense_romance' || subcategory.includes('intense_romance')) {
        const spiceMatch = AGE_ESCALATION_WEIGHTS.find(
          w => w.category === 'sexual_content' && w.subcategory === 'intense_romance_or_spice'
        )
        if (spiceMatch) return spiceMatch.weight
      }
    }
  }

  // Fall back to category-only match
  const categoryMatch = AGE_ESCALATION_WEIGHTS.find(
    w => w.category === categoryId && !w.subcategory
  )
  if (categoryMatch) return categoryMatch.weight

  // Final fallback to default
  return 0.4 // Default medium escalation
}

/**
 * Calculate age rating from escalation weights
 * 
 * Uses the highest escalation weight from SEVERE warnings to determine rating.
 */
export function getRatingFromEscalation(escalationScore: number): {
  rating: 'G' | 'PG' | 'M' | 'MA15+' | 'R18+' | 'RC'
  reasoning: string
} {
  if (escalationScore >= 0.9) {
    return {
      rating: 'RC',
      reasoning: 'Contains extreme content requiring refused classification'
    }
  }
  if (escalationScore >= 0.7) {
    return {
      rating: 'R18+',
      reasoning: 'Contains high-impact content requiring mature audiences'
    }
  }
  if (escalationScore >= 0.3) {
    return {
      rating: 'MA15+',
      reasoning: 'Contains strong content appropriate for ages 15+'
    }
  }
  if (escalationScore >= 0.1) {
    return {
      rating: 'M',
      reasoning: 'Contains moderate content appropriate for ages 13+'
    }
  }
  return {
    rating: 'PG',
    reasoning: 'Contains mild content appropriate for ages 8+'
  }
}

