/**
 * Test the updateDescriptionForSeverity function logic directly
 */

// Copy the function logic here to test it
function updateDescriptionForSeverity(
  originalDescription: string | undefined,
  computedSeverity: 'mild' | 'moderate' | 'severe'
): string {
  if (!originalDescription) {
    const intensityMap = {
      severe: 'Strong',
      moderate: 'Moderate',
      mild: 'Mild'
    }
    return `${intensityMap[computedSeverity]} themes of sensitive content.`
  }

  const intensityMap = {
    severe: 'Strong',
    moderate: 'Moderate',
    mild: 'Mild'
  }
  const targetIntensity = intensityMap[computedSeverity]
  
  let updatedDescription = originalDescription.trim()
  
  // Pattern to match intensity word at the start
  const intensityStartPattern = /^(Strong|Moderate|Mild|Graphic|Explicit|Intense|Heavy|Light|Subtle)\s+/i
  
  if (intensityStartPattern.test(updatedDescription)) {
    // Extract the current intensity word and everything after it
    const match = updatedDescription.match(intensityStartPattern)
    if (match) {
      const currentIntensity = match[1]
      const restOfDescription = updatedDescription.substring(match[0].length).trim()
      
      // Check if "themes" is missing (common AI error: "Moderate of..." instead of "Moderate themes of...")
      const hasThemes = /^themes?\s+of/i.test(restOfDescription)
      const hasDirectOf = /^of\s+/i.test(restOfDescription)
      
      console.log(`Input: "${originalDescription}"`)
      console.log(`  Current intensity: "${currentIntensity}"`)
      console.log(`  Rest: "${restOfDescription}"`)
      console.log(`  hasThemes: ${hasThemes}`)
      console.log(`  hasDirectOf: ${hasDirectOf}`)
      
      // If we have "Moderate of..." (missing themes), add "themes"
      if (hasDirectOf && !hasThemes) {
        updatedDescription = `${targetIntensity} themes ${restOfDescription}`
        console.log(`  → Fixed: "${updatedDescription}"`)
      } else if (hasThemes) {
        // Already has "themes of", just replace intensity if needed
        if (currentIntensity.toLowerCase() !== targetIntensity.toLowerCase()) {
          updatedDescription = `${targetIntensity} ${restOfDescription}`
          console.log(`  → Replaced intensity: "${updatedDescription}"`)
        } else {
          console.log(`  → No change needed`)
        }
      } else {
        // Has intensity word but no "themes" or "of" - check if it's a valid format
        if (restOfDescription.startsWith('of ')) {
          updatedDescription = `${targetIntensity} themes ${restOfDescription}`
          console.log(`  → Fixed (startsWith): "${updatedDescription}"`)
        } else if (currentIntensity.toLowerCase() !== targetIntensity.toLowerCase()) {
          updatedDescription = `${targetIntensity} ${restOfDescription}`
          console.log(`  → Replaced intensity only: "${updatedDescription}"`)
        } else {
          console.log(`  → No change needed`)
        }
      }
    }
  } else {
    // Description doesn't start with intensity word - prepend it with "themes of"
    const content = updatedDescription.replace(/^(The|A|An)\s+/i, '').trim()
    const firstChar = content.charAt(0)
    const rest = content.slice(1)
    updatedDescription = `${targetIntensity} themes of ${firstChar.toLowerCase()}${rest}`
    console.log(`Input: "${originalDescription}"`)
    console.log(`  → Prepended: "${updatedDescription}"`)
  }

  return updatedDescription
}

// Test cases
console.log('=== Test 1: "Moderate of possessive or obsessive dynamics" ===')
const result1 = updateDescriptionForSeverity('Moderate of possessive or obsessive dynamics', 'moderate')
console.log(`Result: "${result1}"`)
console.log(`Expected: "Moderate themes of possessive or obsessive dynamics"`)
console.log(`Match: ${result1 === 'Moderate themes of possessive or obsessive dynamics'}\n`)

console.log('=== Test 2: "Moderate of emotional manipulation" ===')
const result2 = updateDescriptionForSeverity('Moderate of emotional manipulation', 'moderate')
console.log(`Result: "${result2}"`)
console.log(`Expected: "Moderate themes of emotional manipulation"`)
console.log(`Match: ${result2 === 'Moderate themes of emotional manipulation'}\n`)

console.log('=== Test 3: "Moderate themes of trauma" (already correct) ===')
const result3 = updateDescriptionForSeverity('Moderate themes of trauma', 'moderate')
console.log(`Result: "${result3}"`)
console.log(`Expected: "Moderate themes of trauma"`)
console.log(`Match: ${result3 === 'Moderate themes of trauma'}\n`)

console.log('=== Test 4: "Strong themes of violence" (SEVERE) ===')
const result4 = updateDescriptionForSeverity('Moderate themes of violence', 'severe')
console.log(`Result: "${result4}"`)
console.log(`Expected: "Strong themes of violence"`)
console.log(`Match: ${result4 === 'Strong themes of violence'}\n`)

