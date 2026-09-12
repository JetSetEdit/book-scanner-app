import { describe, expect, it } from 'vitest'
import { dedupeWarningsByCategory, formatCategoryLabel } from '../warning-display'

describe('dedupeWarningsByCategory', () => {
  it('keeps one row per category', () => {
    const input = [
      { category: 'sexual_content', severity: 'moderate' },
      { category: 'sexual_content', severity: 'moderate' },
      { category: 'violence', severity: 'moderate' },
      { category: 'violence', severity: 'severe' },
    ]

    const result = dedupeWarningsByCategory(input)

    expect(result).toHaveLength(2)
    expect(result.find((w) => w.category === 'sexual_content')?.severity).toBe('moderate')
    expect(result.find((w) => w.category === 'violence')?.severity).toBe('severe')
  })

  it('prefers the highest severity when categories repeat', () => {
    const input = [
      { category: 'Sexual_Content', severity: 'mild' },
      { category: 'sexual_content', severity: 'severe' },
    ]

    const result = dedupeWarningsByCategory(input)

    expect(result).toHaveLength(1)
    expect(result[0].severity).toBe('severe')
  })
})

describe('formatCategoryLabel', () => {
  it('formats snake_case categories for display', () => {
    expect(formatCategoryLabel('sexual_content')).toBe('Sexual Content')
  })
})
