import { describe, it, expect } from 'vitest'
import {
  isPlaceholderTitle,
  hasPlaceholderMetadata,
  filterPlaceholderCandidates,
} from '../placeholder-detection'

describe('isPlaceholderTitle', () => {
  it('returns true for null or undefined', () => {
    expect(isPlaceholderTitle(null)).toBe(true)
    expect(isPlaceholderTitle(undefined)).toBe(true)
  })

  it('returns true for empty string', () => {
    expect(isPlaceholderTitle('')).toBe(true)
  })

  it('returns true for known placeholder patterns', () => {
    expect(isPlaceholderTitle('Untitled')).toBe(true)
    expect(isPlaceholderTitle('TBC')).toBe(true)
    expect(isPlaceholderTitle('TBD')).toBe(true)
    expect(isPlaceholderTitle('To Be Confirmed')).toBe(true)
    expect(isPlaceholderTitle('To Be Determined')).toBe(true)
    expect(isPlaceholderTitle('To Be Announced')).toBe(true)
    expect(isPlaceholderTitle('TBA')).toBe(true)
    expect(isPlaceholderTitle('Unknown')).toBe(true)
    expect(isPlaceholderTitle('Placeholder')).toBe(true)
    expect(isPlaceholderTitle('Coming Soon')).toBe(true)
    expect(isPlaceholderTitle('Title Pending')).toBe(true)
    expect(isPlaceholderTitle('Untitled TBC')).toBe(true)
  })

  it('returns true for case variations of placeholders', () => {
    expect(isPlaceholderTitle('untitled')).toBe(true)
    expect(isPlaceholderTitle('UNTITLED')).toBe(true)
    expect(isPlaceholderTitle('tbc')).toBe(true)
    expect(isPlaceholderTitle('coming soon')).toBe(true)
  })

  it('matches Untitled with trailing numbers pattern', () => {
    expect(isPlaceholderTitle('Untitled TBC 202325')).toBe(true)
  })

  it('returns false for real book titles', () => {
    expect(isPlaceholderTitle('The Great Gatsby')).toBe(false)
    expect(isPlaceholderTitle('Harry Potter and the Philosopher\'s Stone')).toBe(false)
    expect(isPlaceholderTitle('1984')).toBe(false)
    expect(isPlaceholderTitle('To Kill a Mockingbird')).toBe(false)
  })

  it('returns false for titles that start with placeholder words but are not placeholders', () => {
    // "To Be" prefix — only exact phrases should match, not partial
    expect(isPlaceholderTitle('To Be or Not to Be')).toBe(false)
  })
})

describe('hasPlaceholderMetadata', () => {
  it('returns true when title is a placeholder', () => {
    expect(hasPlaceholderMetadata({ title: 'TBC' })).toBe(true)
  })

  it('returns true when title is missing', () => {
    expect(hasPlaceholderMetadata({ title: null })).toBe(true)
    expect(hasPlaceholderMetadata({ title: undefined })).toBe(true)
    expect(hasPlaceholderMetadata({})).toBe(true)
  })

  it('returns true when title is empty string', () => {
    expect(hasPlaceholderMetadata({ title: '   ' })).toBe(true)
  })

  it('returns false when title is a real title', () => {
    expect(hasPlaceholderMetadata({ title: 'Dune', author: 'Frank Herbert' })).toBe(false)
  })
})

describe('filterPlaceholderCandidates', () => {
  it('filters out candidates with placeholder titles', () => {
    const candidates = [
      { title: 'Real Book', id: 1 },
      { title: 'TBC', id: 2 },
      { title: 'Another Real Book', id: 3 },
      { title: 'Untitled', id: 4 },
    ]
    const result = filterPlaceholderCandidates(candidates)
    expect(result).toHaveLength(2)
    expect(result.map(c => c.id)).toEqual([1, 3])
  })

  it('returns all candidates when none are placeholders', () => {
    const candidates = [
      { title: 'Dune' },
      { title: 'Foundation' },
    ]
    expect(filterPlaceholderCandidates(candidates)).toHaveLength(2)
  })

  it('returns empty array when all are placeholders', () => {
    const candidates = [{ title: 'TBC' }, { title: 'Unknown' }]
    expect(filterPlaceholderCandidates(candidates)).toHaveLength(0)
  })

  it('handles empty input', () => {
    expect(filterPlaceholderCandidates([])).toEqual([])
  })
})
