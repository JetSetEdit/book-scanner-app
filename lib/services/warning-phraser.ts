/**
 * Phrasing rotation for content warnings
 * Rotates phrases per warning, seeded by category ID for consistency
 */

const phrases = [
  'Contains references to…',
  'Includes depictions of…',
  'Explores themes involving…',
  'Features content related to…',
  'Addresses topics concerning…',
  'Touches on themes of…',
]

/**
 * Get a consistent phrase for a warning based on its category ID
 * This ensures the same category always gets the same phrase
 */
export function getWarningPhrase(categoryId: string | null | undefined): string {
  if (!categoryId) {
    return phrases[0] // Default phrase
  }
  
  // Simple hash function to convert category ID to phrase index
  let hash = 0
  for (let i = 0; i < categoryId.length; i++) {
    hash = ((hash << 5) - hash) + categoryId.charCodeAt(i)
    hash = hash & hash // Convert to 32-bit integer
  }
  
  const index = Math.abs(hash) % phrases.length
  return phrases[index]
}

/**
 * Format a warning description with the rotated phrase
 * Removes redundant phrases to avoid "Explores themes involving moderate themes..."
 */
export function formatWarningDescription(
  categoryId: string | null | undefined,
  description: string
): string {
  const phrase = getWarningPhrase(categoryId)
  
  // If description already starts with a phrase-like pattern, use it as-is
  if (description.match(/^(Contains|Includes|Explores|Features|Addresses|Touches)/i)) {
    return description
  }
  
  // Remove the ellipsis and combine
  const cleanPhrase = phrase.replace('…', '')
  let combined = `${cleanPhrase} ${description.toLowerCase()}`
  
  // Fix redundant phrases like "Explores themes involving moderate themes..."
  // Pattern: "Explores themes involving" + "moderate themes of..." → "Explores moderate themes of..."
  combined = combined.replace(
    /(Explores|Includes|Contains|Features|Addresses|Touches)\s+themes\s+involving\s+(moderate|mild|strong|severe)\s+themes\s+of/gi,
    (match, verb, severity) => `${verb} ${severity} themes of`
  )
  
  // Also fix "themes involving moderate themes" (without "of") → "moderate themes"
  combined = combined.replace(
    /(Explores|Includes|Contains|Features|Addresses|Touches)\s+themes\s+involving\s+(moderate|mild|strong|severe)\s+themes\b/gi,
    (match, verb, severity) => `${verb} ${severity} themes`
  )
  
  // Fix "themes involving themes of" → "themes of"
  combined = combined.replace(
    /\bthemes\s+involving\s+themes\s+of\b/gi,
    'themes of'
  )
  
  return combined
}
