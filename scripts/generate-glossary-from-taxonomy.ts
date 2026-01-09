/**
 * Script to generate glossary entries from taxonomy
 * Extracts all category and subcategory userLabels and shortDescriptions
 */

import { WARNING_CATEGORIES } from '../lib/config/taxonomy-v2'

const glossaryEntries: Record<string, string> = {}

// Process all categories and subcategories
WARNING_CATEGORIES.forEach(category => {
  // Add category entry
  glossaryEntries[category.userLabel] = category.shortDescription
  
  // Add subcategory entries
  category.subcategories.forEach(subcategory => {
    glossaryEntries[subcategory.userLabel] = subcategory.shortDescription
  })
})

// Output as TypeScript object format
console.log('// Generated glossary entries from taxonomy\n')
console.log('export const TAXONOMY_GLOSSARY: Record<string, string> = {')

const sortedEntries = Object.entries(glossaryEntries).sort(([a], [b]) => a.localeCompare(b))

sortedEntries.forEach(([label, description], index) => {
  const comma = index < sortedEntries.length - 1 ? ',' : ''
  // Escape quotes in description
  const escapedDescription = description.replace(/"/g, '\\"')
  console.log(`  "${label}": "${escapedDescription}"${comma}`)
})

console.log('}\n')
console.log(`// Total entries: ${sortedEntries.length}`)
