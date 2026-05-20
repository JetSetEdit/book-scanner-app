/**
 * Tests for warning-phraser display cleanup.
 */

import { describe, it, expect } from 'vitest'
import { sanitizeDescriptionForDisplay } from '../warning-phraser'

describe('sanitizeDescriptionForDisplay', () => {
  it('strips an inline "source N (url)" citation', () => {
    expect(
      sanitizeDescriptionForDisplay('Source 1 (app.thestorygraph.com): Moderate themes of grief.')
    ).toBe('Moderate themes of grief.')
  })

  it('strips a citation embedded mid-sentence', () => {
    expect(
      sanitizeDescriptionForDisplay('Moderate themes of grief source 2 (commonsensemedia.org): and loss.')
    ).toBe('Moderate themes of grief and loss.')
  })

  it('collapses doubled whitespace left behind after stripping', () => {
    expect(
      sanitizeDescriptionForDisplay('Strong   themes  of   violence.')
    ).toBe('Strong themes of violence.')
  })

  it('passes a clean description through unchanged', () => {
    const clean = 'Moderate themes of emotional abuse and psychological manipulation.'
    expect(sanitizeDescriptionForDisplay(clean)).toBe(clean)
  })

  it('preserves acronyms — nothing lowercases the text anymore', () => {
    const input = 'Moderate themes of PTSD and trauma.'
    expect(sanitizeDescriptionForDisplay(input)).toBe(input)
  })

  it('returns empty string unchanged', () => {
    expect(sanitizeDescriptionForDisplay('')).toBe('')
  })
})
