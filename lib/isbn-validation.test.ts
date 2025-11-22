import { validateISBN, validateISBNWithChecksum, normalizeISBN } from './isbn-validation'
import { describe, it, expect } from 'vitest' // Assuming vitest will be used, or just for structure

// Mocking describe/it/expect if running in a simple node script for demonstration
// In a real setup, you'd install vitest: `npm install -D vitest`

describe('ISBN Validation', () => {
  describe('normalizeISBN', () => {
    it('removes hyphens and spaces', () => {
      expect(normalizeISBN('978-3-16-148410-0')).toBe('9783161484100')
      expect(normalizeISBN('978 3 16 148410 0')).toBe('9783161484100')
    })
  })

  describe('validateISBN', () => {
    it('validates correct ISBN-10 format', () => {
      expect(validateISBN('0-306-40615-2')).toBe(true)
      expect(validateISBN('0306406152')).toBe(true)
    })

    it('validates correct ISBN-13 format', () => {
      expect(validateISBN('978-3-16-148410-0')).toBe(true)
    })

    it('rejects invalid length', () => {
      expect(validateISBN('123456789')).toBe(false)
    })

    it('rejects non-numeric characters', () => {
      expect(validateISBN('123456789Z')).toBe(false) // Z is invalid
    })
  })
})

