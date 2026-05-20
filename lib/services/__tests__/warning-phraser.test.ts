/**
 * Tests for warning-phraser description rendering — specifically guarding
 * the acronym-casing bug fixed in Task 3, where the blanket .toLowerCase()
 * applied before the wrapper phrase turned DB "PTSD" into "ptsd".
 */

import { describe, it, expect } from 'vitest'
import { lowercasePreservingAcronyms, formatWarningDescription } from '../warning-phraser'

describe('lowercasePreservingAcronyms', () => {
  it('preserves a standalone acronym', () => {
    expect(lowercasePreservingAcronyms('Themes of PTSD')).toBe('themes of PTSD')
  })

  it('preserves acronyms with trailing punctuation', () => {
    expect(lowercasePreservingAcronyms('Moderate PTSD, anxiety, and OCD.')).toBe(
      'moderate PTSD, anxiety, and OCD.'
    )
  })

  it('preserves acronyms with trailing symbols and digits', () => {
    expect(lowercasePreservingAcronyms('Rated PG-13 with LGBTQIA+ themes')).toBe(
      'rated PG-13 with LGBTQIA+ themes'
    )
  })

  it('lowercases ordinary capitalized words', () => {
    expect(lowercasePreservingAcronyms('Strong Themes Of Grief')).toBe('strong themes of grief')
  })

  it('lowercases single-letter tokens (not treated as acronyms)', () => {
    expect(lowercasePreservingAcronyms('A Story')).toBe('a story')
  })

  it('leaves already-lowercase text unchanged', () => {
    expect(lowercasePreservingAcronyms('themes of grief and loss')).toBe('themes of grief and loss')
  })
})

describe('formatWarningDescription', () => {
  it('keeps PTSD uppercase after prepending the wrapper phrase', () => {
    const out = formatWarningDescription('mental_health', 'Strong themes of PTSD and trauma.')
    expect(out).toContain('PTSD')
    expect(out).not.toContain('ptsd')
  })

  it('passes through descriptions that already start with a wrapper phrase', () => {
    const input = 'Contains references to PTSD and trauma.'
    expect(formatWarningDescription('mental_health', input)).toBe(input)
  })
})
