/**
 * Tests for S0_NO_INPUT SSS level: no-input branch and regression for assignSSS.
 */

import { describe, it, expect } from 'vitest'
import { assignSSS, S0_NO_INPUT_SSS_RESULT } from '../sss-assignment'

describe('S0_NO_INPUT SSS level', () => {
  it('S0_NO_INPUT_SSS_RESULT has sss_level S0_NO_INPUT and sss_notes includes "could not be assessed"', () => {
    expect(S0_NO_INPUT_SSS_RESULT.sss_level).toBe('S0_NO_INPUT')
    expect(S0_NO_INPUT_SSS_RESULT.sss_notes).toContain('could not be assessed')
  })

  it('assignSSS with empty warnings returns S1_GENTLE (regression: pipeline uses S0 only when !hasAnyInput)', async () => {
    const result = await assignSSS({
      warnings: [],
      title: 'Test Book',
      author: 'Test Author',
      description: 'Some description',
    })
    expect(result.sss_level).toBe('S1_GENTLE')
    expect(result.sss_notes).toBeDefined()
  })
})
