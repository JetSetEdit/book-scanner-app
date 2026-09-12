const SEVERITY_RANK: Record<string, number> = {
  severe: 3,
  moderate: 2,
  mild: 1,
}

function severityRank(severity: string): number {
  return SEVERITY_RANK[severity.toLowerCase()] ?? 0
}

/**
 * Collapse duplicate warning rows that share the same category, keeping the highest severity.
 * Used for compact previews (homepage sample card) where subcategory rows would repeat labels.
 */
export function dedupeWarningsByCategory<T extends { category: string; severity: string }>(
  warnings: T[],
): T[] {
  const byCategory = new Map<string, T>()

  for (const warning of warnings) {
    const key = warning.category.trim().toLowerCase()
    const existing = byCategory.get(key)
    if (!existing || severityRank(warning.severity) > severityRank(existing.severity)) {
      byCategory.set(key, warning)
    }
  }

  return Array.from(byCategory.values())
}

export function formatCategoryLabel(category: string): string {
  return category
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
}
