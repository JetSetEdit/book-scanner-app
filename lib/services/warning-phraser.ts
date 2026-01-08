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
 */
export function formatWarningDescription(
  categoryId: string | null | undefined,
  description: string
): string {
  const phrase = getWarningPhrase(categoryId)
  
  // If description already starts with a phrase-like pattern, use it as-is
  // Otherwise, prepend the phrase
  if (description.match(/^(Contains|Includes|Explores|Features|Addresses|Touches)/i)) {
    return description
  }
  
  // Remove the ellipsis and combine
  const cleanPhrase = phrase.replace('…', '')
  return `${cleanPhrase} ${description.toLowerCase()}`
}
