/**
 * Get category ID from subcategory ID
 * 
 * Maps subcategory IDs to their parent category by searching the taxonomy
 */

import { WARNING_CATEGORIES } from '../config/taxonomy-v2'

/**
 * Get the category ID for a given subcategory ID
 * @param subcategoryId The subcategory ID (e.g., "intense_romance", "anxiety")
 * @returns The category ID (e.g., "sexual_content", "mental_health") or "other" if not found
 */
export function getCategoryFromSubcategory(subcategoryId: string | undefined | null): string {
  if (!subcategoryId) return 'other'
  
  // If subcategory_id is in format "category.subcategory", extract category
  if (subcategoryId.includes('.')) {
    return subcategoryId.split('.')[0]
  }
  
  // Search taxonomy for the subcategory
  for (const category of WARNING_CATEGORIES) {
    const subcategory = category.subcategories.find(s => s.id === subcategoryId)
    if (subcategory) {
      return category.id
    }
  }
  
  // Fallback: try to infer from common patterns
  if (subcategoryId.includes('romance') || subcategoryId.includes('spice') || 
      subcategoryId.includes('sexual') || subcategoryId.includes('explicit')) {
    return 'sexual_content'
  }
  if (subcategoryId.includes('violence') || subcategoryId.includes('war') || 
      subcategoryId.includes('weapon') || subcategoryId.includes('combat')) {
    return 'violence'
  }
  if (subcategoryId.includes('anxiety') || subcategoryId.includes('depression') || 
      subcategoryId.includes('ptsd') || subcategoryId.includes('mental')) {
    return 'mental_health'
  }
  if (subcategoryId.includes('abuse') || subcategoryId.includes('gaslight')) {
    return 'abuse'
  }
  
  return 'other'
}

