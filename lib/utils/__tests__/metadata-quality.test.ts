import { describe, it, expect } from 'vitest'
import { assessMetadataQuality } from '../metadata-quality'

describe('assessMetadataQuality', () => {
  describe('quality tiers', () => {
    it('returns thin quality for empty description', () => {
      const result = assessMetadataQuality({ description: '' })
      expect(result.quality).toBe('thin')
      expect(result.requiresEnrichment).toBe(true)
      expect(result.descriptionLength).toBe(0)
    })

    it('returns thin quality for description under 200 chars', () => {
      const shortDesc = 'A short description.'.padEnd(150, ' x')
      const result = assessMetadataQuality({ description: shortDesc })
      expect(result.quality).toBe('thin')
      expect(result.requiresEnrichment).toBe(true)
    })

    it('returns moderate quality for description between 200 and 499 chars', () => {
      const moderateDesc = 'A'.repeat(300)
      const result = assessMetadataQuality({ description: moderateDesc })
      expect(result.quality).toBe('moderate')
      expect(result.requiresEnrichment).toBe(false)
    })

    it('returns rich quality for description 500 chars or more', () => {
      const richDesc = 'A'.repeat(500)
      const result = assessMetadataQuality({ description: richDesc })
      expect(result.quality).toBe('rich')
      expect(result.requiresEnrichment).toBe(false)
    })
  })

  describe('confidence', () => {
    it('returns low confidence when description is rich but no categories', () => {
      const result = assessMetadataQuality({
        description: 'A'.repeat(600),
        categories: [],
      })
      expect(result.confidence).toBe('low')
    })

    it('returns high confidence when description is rich and categories exist', () => {
      const result = assessMetadataQuality({
        description: 'A'.repeat(600),
        categories: ['Fiction', 'Young Adult'],
      })
      expect(result.confidence).toBe('high')
    })

    it('returns low confidence when description is moderate even with categories', () => {
      const result = assessMetadataQuality({
        description: 'A'.repeat(300),
        categories: ['Fiction'],
      })
      expect(result.confidence).toBe('low')
    })

    it('returns low confidence when description is thin', () => {
      const result = assessMetadataQuality({
        description: 'Short.',
        categories: ['Fiction', 'Drama'],
      })
      expect(result.confidence).toBe('low')
    })
  })

  describe('handles missing fields gracefully', () => {
    it('treats missing description as empty', () => {
      const result = assessMetadataQuality({ author: 'Some Author' })
      expect(result.quality).toBe('thin')
      expect(result.descriptionLength).toBe(0)
    })

    it('treats null description as empty', () => {
      const result = assessMetadataQuality({ description: null })
      expect(result.quality).toBe('thin')
      expect(result.descriptionLength).toBe(0)
    })

    it('treats missing categories as zero categories', () => {
      const result = assessMetadataQuality({ description: 'A'.repeat(600) })
      expect(result.confidence).toBe('low')
    })
  })

  describe('boundary conditions', () => {
    it('thin/moderate boundary at exactly 200 chars', () => {
      // < 200 = thin, so 199 is thin
      expect(assessMetadataQuality({ description: 'A'.repeat(199) }).quality).toBe('thin')
      // 200 = moderate
      expect(assessMetadataQuality({ description: 'A'.repeat(200) }).quality).toBe('moderate')
    })

    it('moderate/rich boundary at exactly 500 chars', () => {
      // < 500 = moderate, so 499 is moderate
      expect(assessMetadataQuality({ description: 'A'.repeat(499) }).quality).toBe('moderate')
      // 500 = rich
      expect(assessMetadataQuality({ description: 'A'.repeat(500) }).quality).toBe('rich')
    })
  })
})
