"use client"

import { useLocalStorage } from './use-browser-storage'

export interface SparksData {
  total_sparks: number
  scans_count: number
  pivots_count: number
  validations_count: number
  badges: string[] // Array of badge codes earned
  last_updated: string
}

const SPARKS_STORAGE_KEY = 'subtext-sparks'
const DEFAULT_SPARKS: SparksData = {
  total_sparks: 0,
  scans_count: 0,
  pivots_count: 0,
  validations_count: 0,
  badges: [],
  last_updated: new Date().toISOString(),
}

// Badge definitions (matching database badges)
const BADGE_DEFINITIONS = {
  first_spark: { name: 'First Spark', description: 'Completed your first book scan', requirement: { type: 'scan_count', value: 1 }, sparks_reward: 10 },
  pivot_prodigy: { name: 'Pivot Prodigy', description: 'Made 3+ smart pivots away from risky content', requirement: { type: 'pivot_count', value: 3 }, sparks_reward: 50 },
  scan_savant: { name: 'Scan Savant', description: 'Scanned 10+ books', requirement: { type: 'scan_count', value: 10 }, sparks_reward: 100 },
  safety_advocate: { name: 'Safety Advocate', description: 'Validated 20+ content warnings', requirement: { type: 'validation_count', value: 20 }, sparks_reward: 75 },
  spark_collector: { name: 'Spark Collector', description: 'Earned 500+ total sparks', requirement: { type: 'sparks_total', value: 500 }, sparks_reward: 0 },
}

/**
 * Hook for managing Sparks in browser storage (works without authentication)
 */
export function useSparks() {
  const [sparks, setSparks] = useLocalStorage<SparksData>(
    SPARKS_STORAGE_KEY,
    DEFAULT_SPARKS
  )

  const checkBadges = (updatedSparks: SparksData): string[] => {
    const newBadges: string[] = []
    const currentBadges = new Set(updatedSparks.badges)

    // Check each badge
    for (const [code, badge] of Object.entries(BADGE_DEFINITIONS)) {
      if (currentBadges.has(code)) continue // Already earned

      const { requirement } = badge
      let qualifies = false

      switch (requirement.type) {
        case 'scan_count':
          qualifies = updatedSparks.scans_count >= requirement.value
          break
        case 'pivot_count':
          qualifies = updatedSparks.pivots_count >= requirement.value
          break
        case 'validation_count':
          qualifies = updatedSparks.validations_count >= requirement.value
          break
        case 'sparks_total':
          qualifies = updatedSparks.total_sparks >= requirement.value
          break
      }

      if (qualifies) {
        newBadges.push(code)
        // Award badge sparks if any
        if (badge.sparks_reward > 0) {
          updatedSparks.total_sparks += badge.sparks_reward
        }
      }
    }

    return newBadges
  }

  const awardSparks = (
    amount: number,
    actionType: 'scan' | 'pivot' | 'validation' | 'badge_earned'
  ) => {
    if (amount <= 0) return

    setSparks((prev) => {
      const updated: SparksData = {
        ...prev,
        total_sparks: prev.total_sparks + amount,
        scans_count: actionType === 'scan' ? prev.scans_count + 1 : prev.scans_count,
        pivots_count: actionType === 'pivot' ? prev.pivots_count + 1 : prev.pivots_count,
        validations_count: actionType === 'validation' ? prev.validations_count + 1 : prev.validations_count,
        last_updated: new Date().toISOString(),
      }

      // Check for new badges
      const newBadges = checkBadges(updated)
      if (newBadges.length > 0) {
        updated.badges = [...updated.badges, ...newBadges]
        // If badges awarded sparks, update total again
        const badgeSparks = newBadges.reduce((sum, code) => {
          return sum + (BADGE_DEFINITIONS[code as keyof typeof BADGE_DEFINITIONS]?.sparks_reward || 0)
        }, 0)
        if (badgeSparks > 0) {
          updated.total_sparks += badgeSparks
        }
      }

      return updated
    })
  }

  const recordPivot = (bookId: string, isbn: string) => {
    // Check if already pivoted on this book (store in separate key)
    const pivotKey = `subtext-pivot-${bookId}`
    const hasPivoted = typeof window !== 'undefined' && localStorage.getItem(pivotKey)
    
    if (hasPivoted) {
      return // Already pivoted on this book
    }

    // Mark as pivoted
    if (typeof window !== 'undefined') {
      localStorage.setItem(pivotKey, new Date().toISOString())
    }

    // Award sparks
    awardSparks(15, 'pivot')
  }

  const resetSparks = () => {
    setSparks(DEFAULT_SPARKS)
    // Clear pivot tracking
    if (typeof window !== 'undefined') {
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('subtext-pivot-')) {
          localStorage.removeItem(key)
        }
      })
    }
  }

  const getBadgeInfo = (code: string) => {
    return BADGE_DEFINITIONS[code as keyof typeof BADGE_DEFINITIONS]
  }

  return {
    sparks,
    awardSparks,
    recordPivot,
    resetSparks,
    getBadgeInfo,
    badgeDefinitions: BADGE_DEFINITIONS,
  }
}

