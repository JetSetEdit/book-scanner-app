import { getCategoryFromSubcategory } from './get-category-from-subcategory'

/** Minimal warning shape for spice derivation (matches Booktok Quick Glance). */
export type SpiceWarningLike = {
  category?: string | null
  category_id?: string | null
  subcategory_id?: string | null
  severity?: string | null
}

/** True if this warning counts toward spice / should be excluded from "key triggers" as heat. */
export function isSexualContentWarning(w: SpiceWarningLike): boolean {
  if (w.category_id === 'sexual_content' || w.category === 'sexual_content') return true
  return getCategoryFromSubcategory(w.subcategory_id) === 'sexual_content'
}

/**
 * Spice / heat indicator for Quick Glance (0–3).
 * Uses sexual_content warnings; falls back to taxonomy parent of subcategory when category fields are wrong.
 */
export function computeSpiceLevel(warnings: SpiceWarningLike[]): 0 | 1 | 2 | 3 {
  const sexWarnings = warnings.filter((w) => isSexualContentWarning(w))
  if (sexWarnings.length === 0) return 0
  const hasSevere = sexWarnings.some((w) => w.severity === 'severe')
  const hasExplicit = sexWarnings.some((w) => w.subcategory_id?.includes('explicit'))
  const hasModerate = sexWarnings.some((w) => w.severity === 'moderate')
  if (hasSevere || hasExplicit) return 3
  if (hasModerate) return 2
  return 1
}
