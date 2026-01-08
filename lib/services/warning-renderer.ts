import { getCategoryById } from "@/lib/config/taxonomy-v2"

export interface Warning {
  category_id?: string | null
  subcategory_id?: string | null
  severity: "mild" | "moderate" | "severe"
  description: string
}

/**
 * Get top themes from warnings by category frequency
 */
function getTopThemes(warnings: Warning[], topCount: number = 3): string[] {
  // Group warnings by category
  const categoryCounts = new Map<string, { count: number; label: string }>()
  
  for (const warning of warnings) {
    if (!warning.category_id) continue
    
    const category = getCategoryById(warning.category_id)
    const label = category?.userLabel || warning.category_id
    
    const existing = categoryCounts.get(warning.category_id) || { count: 0, label }
    categoryCounts.set(warning.category_id, {
      count: existing.count + 1,
      label
    })
  }
  
  // Sort by count and get top themes
  const sorted = Array.from(categoryCounts.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, topCount)
    .map(item => item.label.toLowerCase())
  
  return sorted
}

/**
 * Get overall severity level from warnings
 */
function getOverallSeverity(warnings: Warning[]): 'mild' | 'moderate' | 'severe' {
  if (warnings.length === 0) return 'mild'
  
  const severityScores = warnings.map(w => {
    switch (w.severity) {
      case 'severe': return 3
      case 'moderate': return 2
      case 'mild': return 1
      default: return 1
    }
  })
  
  const avgScore = severityScores.reduce((a, b) => a + b, 0) / severityScores.length
  
  if (avgScore >= 2.5) return 'severe'
  if (avgScore >= 1.5) return 'moderate'
  return 'mild'
}

/**
 * Generate a reader-friendly summary of content warnings
 */
export function generateSummary(warnings: Warning[], topCount: number = 3): string {
  if (warnings.length === 0) {
    return "This book contains no content warnings."
  }
  
  const themes = getTopThemes(warnings, topCount)
  const severity = getOverallSeverity(warnings)
  
  // Build theme list
  let themeText: string
  if (themes.length === 0) {
    themeText = "various themes"
  } else if (themes.length === 1) {
    themeText = themes[0]
  } else if (themes.length === 2) {
    themeText = `${themes[0]} and ${themes[1]}`
  } else {
    const lastTheme = themes[themes.length - 1]
    const otherThemes = themes.slice(0, -1).join(", ")
    themeText = `${otherThemes}, and ${lastTheme}`
  }
  
  // Choose modifiers based on severity
  const modifiers = severity === 'mild' 
    ? ['restraint', 'subtlety'] 
    : severity === 'moderate'
      ? ['emotional honesty', 'thoughtful exploration']
      : ['directness', 'unflinching honesty']
  
  return `This novel explores ${themeText}, handled with ${modifiers[0] || 'emotional honesty'}.`
}
