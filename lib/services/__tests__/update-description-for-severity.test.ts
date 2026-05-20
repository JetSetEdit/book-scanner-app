/**
 * Regression tests for updateDescriptionForSeverity — specifically guarding
 * the "themes of themes of" double-prepend bug fixed in multi-model-analysis.ts.
 *
 * The function rewrites AI-generated warning descriptions so the leading
 * intensity word matches the system-computed severity. Before the fix, its
 * fallback branch unconditionally prepended "${intensity} themes of" without
 * checking whether the description already started with "themes of", which
 * produced strings like "Moderate themes of themes of betrayal...".
 */

import { describe, it, expect } from 'vitest'
import { updateDescriptionForSeverity } from '../multi-model-analysis'

describe('updateDescriptionForSeverity', () => {
  it('prepends intensity without doubling when description leads with "themes of"', () => {
    expect(
      updateDescriptionForSeverity('themes of betrayal and emotional manipulation.', 'moderate')
    ).toBe('Moderate themes of betrayal and emotional manipulation.')
  })

  it('handles uppercase "Themes of" the same way', () => {
    expect(
      updateDescriptionForSeverity('Themes of grief and loss.', 'moderate')
    ).toBe('Moderate themes of grief and loss.')
  })

  it('leaves already-correct descriptions untouched', () => {
    expect(
      updateDescriptionForSeverity('Moderate themes of betrayal.', 'moderate')
    ).toBe('Moderate themes of betrayal.')
  })

  it('rewrites the leading intensity word to match computed severity', () => {
    expect(
      updateDescriptionForSeverity('Strong themes of abuse.', 'moderate')
    ).toBe('Moderate themes of abuse.')
  })

  it('collapses pre-existing "themes of themes of" doubling (regression)', () => {
    expect(
      updateDescriptionForSeverity('themes of themes of betrayal.', 'moderate')
    ).toBe('Moderate themes of betrayal.')
  })

  it('strips leading articles and falls back to themes-of for plain prose', () => {
    expect(
      updateDescriptionForSeverity('The book contains violence.', 'moderate')
    ).toBe('Moderate themes of book contains violence.')
  })

  it('preserves intensity+noun form ("Strong violence...") with no rewrite', () => {
    expect(
      updateDescriptionForSeverity('Strong violence in domestic settings.', 'severe')
    ).toBe('Strong violence in domestic settings.')
  })

  it('prepends intensity+themes-of when description has no leading intensity word', () => {
    expect(
      updateDescriptionForSeverity('betrayal and emotional manipulation.', 'moderate')
    ).toBe('Moderate themes of betrayal and emotional manipulation.')
  })
})
