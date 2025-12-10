/**
 * Content Briefing Generator
 */

import { Database } from "@/types/supabase"

type Book = Database['public']['Tables']['books']['Row']
type ContentWarning = Database['public']['Tables']['content_warnings']['Row']

interface BriefingOptions {
  maxWords?: number
  minWords?: number
  includeAudience?: boolean
}

export function generateContentBriefing(
  book: Book,
  warnings: ContentWarning[],
  options: BriefingOptions = {}
): string {
  const { maxWords = 60, minWords = 20, includeAudience = true } = options

  const severeWarnings = warnings.filter(w => w.severity === 'severe')
  const moderateWarnings = warnings.filter(w => w.severity === 'moderate')
  const mildWarnings = warnings.filter(w => w.severity === 'mild')

  const parts: string[] = []

  if (book.title) {
    parts.push(`${book.title}`)
    if (book.author) {
      parts.push(`by ${book.author}`)
    }
  }

  if (warnings.length === 0) {
    parts.push("contains no significant content warnings.")
  } else {
    const categoryCounts = new Map<string, number>()
    warnings.forEach(w => {
      categoryCounts.set(w.category, (categoryCounts.get(w.category) || 0) + 1)
    })

    const categoryLabels: string[] = []
    categoryCounts.forEach((count, category) => {
      const label = formatCategoryLabel(category)
      if (count > 1) {
        categoryLabels.push(`${label} (${count} instances)`)
      } else {
        categoryLabels.push(label)
      }
    })

    if (severeWarnings.length > 0) {
      parts.push(`contains ${severeWarnings.length} severe content warning${severeWarnings.length > 1 ? 's' : ''}`)
      if (categoryLabels.length > 0) {
        parts.push(`including ${formatList(categoryLabels.slice(0, 3))}`)
      }
    } else if (moderateWarnings.length > 0) {
      parts.push(`contains ${moderateWarnings.length} moderate content warning${moderateWarnings.length > 1 ? 's' : ''}`)
      if (categoryLabels.length > 0) {
        parts.push(`including ${formatList(categoryLabels.slice(0, 3))}`)
      }
    } else if (mildWarnings.length > 0) {
      parts.push(`contains ${mildWarnings.length} mild content warning${mildWarnings.length > 1 ? 's' : ''}`)
      if (categoryLabels.length > 0) {
        parts.push(`including ${formatList(categoryLabels.slice(0, 2))}`)
      }
    }
  }

  if (includeAudience && book.categories) {
    const audienceHints = extractAudienceHints(book.categories)
    if (audienceHints) {
      parts.push(audienceHints)
    }
  }

  let briefing = parts.join(" ")
  const wordCount = briefing.split(/\s+/).length
  
  if (wordCount < minWords && warnings.length > 0) {
    const additionalDetail = generateAdditionalDetail(warnings, minWords - wordCount)
    briefing = `${briefing} ${additionalDetail}`
  }

  const words = briefing.split(/\s+/)
  if (words.length > maxWords) {
    briefing = words.slice(0, maxWords).join(" ") + "."
  }

  if (!briefing.match(/[.!?]$/)) {
    briefing += "."
  }

  return briefing.trim()
}

function formatCategoryLabel(category: string): string {
  const labels: Record<string, string> = {
    violence: "violence",
    sexual_content: "sexual content",
    substance_abuse: "substance use",
    mental_health: "mental health themes",
    death: "death and grief",
    abuse: "abuse",
    discrimination: "discrimination",
    other: "other sensitive content"
  }
  return labels[category] || category.replace(/_/g, " ")
}

function formatList(items: string[]): string {
  if (items.length === 0) return ""
  if (items.length === 1) return items[0]
  if (items.length === 2) return `${items[0]} and ${items[1]}`
  const last = items[items.length - 1]
  const rest = items.slice(0, -1)
  return `${rest.join(", ")}, and ${last}`
}

function extractAudienceHints(categories: string[]): string | null {
  const lowerCategories = categories.map(c => c.toLowerCase())
  
  if (lowerCategories.some(c => c.includes("young adult") || c.includes("ya"))) {
    return "Recommended for young adult readers."
  }
  if (lowerCategories.some(c => c.includes("children") || c.includes("juvenile"))) {
    return "Recommended for children."
  }
  if (lowerCategories.some(c => c.includes("adult") || c.includes("mature"))) {
    return "Recommended for adult readers."
  }
  
  return null
}

function generateAdditionalDetail(warnings: ContentWarning[], targetWords: number): string {
  if (warnings.length === 0) return ""
  
  const sampleWarning = warnings.find(w => 
    w.description && 
    !w.description.toLowerCase().includes("spoiler") &&
    w.description.length < 100
  )
  
  if (sampleWarning) {
    const words = sampleWarning.description.split(/\s+/).slice(0, Math.min(20, targetWords))
    return `Content includes ${words.join(" ")}.`
  }
  
  return ""
}

export function validateBriefing(briefing: string): {
  valid: boolean
  issues: string[]
} {
  const issues: string[] = []
  const wordCount = briefing.split(/\s+/).length

  if (wordCount < 20) {
    issues.push(`Briefing too short (${wordCount} words, minimum 20)`)
  }
  if (wordCount > 60) {
    issues.push(`Briefing too long (${wordCount} words, maximum 60)`)
  }
  if (!briefing.match(/[.!?]$/)) {
    issues.push("Briefing should end with proper punctuation")
  }
  if (briefing.match(/spoiler/i)) {
    issues.push("Briefing should not contain spoiler warnings")
  }
  if (briefing.split(/\s+/).some(word => word.length > 20)) {
    issues.push("Briefing contains very long words that may be difficult for TTS")
  }

  return {
    valid: issues.length === 0,
    issues
  }
}
