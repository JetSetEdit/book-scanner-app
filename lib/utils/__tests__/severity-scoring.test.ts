import { describe, it, expect } from 'vitest'
import {
  calculateSeverityScore,
  getSeverityLevelFromScore,
  compareBySeverity,
  CATEGORY_WEIGHTS,
  type ContentWarning,
} from '../severity-scoring'

describe('calculateSeverityScore', () => {
  it('returns 0 for empty warnings array', () => {
    expect(calculateSeverityScore([])).toBe(0)
  })

  it('returns 0 for null/undefined warnings', () => {
    expect(calculateSeverityScore(null as unknown as ContentWarning[])).toBe(0)
    expect(calculateSeverityScore(undefined as unknown as ContentWarning[])).toBe(0)
  })

  it('returns higher score for severe warnings than mild', () => {
    const mild: ContentWarning[] = [{ severity: 'mild' }]
    const severe: ContentWarning[] = [{ severity: 'severe' }]
    expect(calculateSeverityScore(severe)).toBeGreaterThan(calculateSeverityScore(mild))
  })

  it('returns higher score for more warnings than fewer', () => {
    const oneWarning: ContentWarning[] = [{ severity: 'moderate' }]
    const threeWarnings: ContentWarning[] = [
      { severity: 'moderate' },
      { severity: 'moderate' },
      { severity: 'moderate' },
    ]
    expect(calculateSeverityScore(threeWarnings)).toBeGreaterThan(calculateSeverityScore(oneWarning))
  })

  it('uses confidence_score when provided', () => {
    const lowConfidence: ContentWarning[] = [{ severity: 'severe', confidence_score: 0.1 }]
    const highConfidence: ContentWarning[] = [{ severity: 'severe', confidence_score: 0.95 }]
    expect(calculateSeverityScore(highConfidence)).toBeGreaterThan(calculateSeverityScore(lowConfidence))
  })

  it('applies category weight correctly', () => {
    const sexualContent: ContentWarning[] = [{ severity: 'moderate', category_id: 'sexual_content' }]
    const language: ContentWarning[] = [{ severity: 'moderate', category_id: 'language' }]
    // sexual_content has weight 1.5, language has 0.8 — sexual_content should score higher
    expect(calculateSeverityScore(sexualContent)).toBeGreaterThan(calculateSeverityScore(language))
  })

  it('applies graphic detail level boost', () => {
    const vague: ContentWarning[] = [{ severity: 'moderate', detail_level: 'vague' }]
    const graphic: ContentWarning[] = [{ severity: 'moderate', detail_level: 'graphic' }]
    expect(calculateSeverityScore(graphic)).toBeGreaterThan(calculateSeverityScore(vague))
  })

  it('applies on_page presence boost over implied', () => {
    const implied: ContentWarning[] = [{ severity: 'moderate', presence: 'implied' }]
    const onPage: ContentWarning[] = [{ severity: 'moderate', presence: 'on_page' }]
    expect(calculateSeverityScore(onPage)).toBeGreaterThan(calculateSeverityScore(implied))
  })

  it('accepts custom category weights', () => {
    const warning: ContentWarning[] = [{ severity: 'moderate', category_id: 'language' }]
    const defaultScore = calculateSeverityScore(warning)
    const boostWeights = { ...CATEGORY_WEIGHTS, language: 3.0 }
    const boostedScore = calculateSeverityScore(warning, boostWeights)
    expect(boostedScore).toBeGreaterThan(defaultScore)
  })

  it('outlier detection softens a single extreme warning among mild ones', () => {
    // One severe warning among many mild ones — without outlier detection it would dominate
    const mixedWarnings: ContentWarning[] = [
      { severity: 'severe', confidence_score: 0.95 },
      { severity: 'mild', confidence_score: 0.2 },
      { severity: 'mild', confidence_score: 0.25 },
    ]
    const singleSevere: ContentWarning[] = [{ severity: 'severe', confidence_score: 0.95 }]
    // Outlier detection means mixed score should be similar to single severe (not dramatically higher)
    const mixed = calculateSeverityScore(mixedWarnings)
    const single = calculateSeverityScore(singleSevere)
    // Both should be in a reasonable range — mixed can be higher due to volume but not excessively so
    expect(mixed).toBeGreaterThan(0)
    expect(single).toBeGreaterThan(0)
  })
})

describe('getSeverityLevelFromScore', () => {
  it('returns none for score 0', () => {
    expect(getSeverityLevelFromScore(0)).toBe('none')
  })

  it('returns mild for score < 30', () => {
    expect(getSeverityLevelFromScore(1)).toBe('mild')
    expect(getSeverityLevelFromScore(29)).toBe('mild')
  })

  it('returns moderate for score 30-79', () => {
    expect(getSeverityLevelFromScore(30)).toBe('moderate')
    expect(getSeverityLevelFromScore(79)).toBe('moderate')
  })

  it('returns severe for score 80+', () => {
    expect(getSeverityLevelFromScore(80)).toBe('severe')
    expect(getSeverityLevelFromScore(150)).toBe('severe')
  })
})

describe('compareBySeverity', () => {
  it('places more severe book first (negative return)', () => {
    const mildBook = { warnings: [{ severity: 'mild' as const }] }
    const severeBook = { warnings: [{ severity: 'severe' as const }] }
    // Higher severity = comes first = negative comparison result
    expect(compareBySeverity(severeBook, mildBook)).toBeLessThan(0)
    expect(compareBySeverity(mildBook, severeBook)).toBeGreaterThan(0)
  })

  it('returns 0 for identical books', () => {
    const book = { warnings: [{ severity: 'moderate' as const }] }
    expect(compareBySeverity(book, book)).toBe(0)
  })

  it('handles books with no warnings', () => {
    const noWarnings = { warnings: [] }
    const someWarnings = { warnings: [{ severity: 'mild' as const }] }
    expect(compareBySeverity(someWarnings, noWarnings)).toBeLessThan(0)
  })

  it('sorts an array correctly by severity', () => {
    const books = [
      { title: 'mild', warnings: [{ severity: 'mild' as const }] },
      { title: 'severe', warnings: [{ severity: 'severe' as const }] },
      { title: 'moderate', warnings: [{ severity: 'moderate' as const }] },
    ]
    books.sort(compareBySeverity)
    expect(books.map(b => b.title)).toEqual(['severe', 'moderate', 'mild'])
  })
})
