"use client"

import { useLocalStorage } from './use-browser-storage'

export interface UserPreferences {
  strictnessMode?: 'standard' | 'strict' | 'parent'
  showRawApiResponse?: boolean
  autoSelectSingleCandidate?: boolean
  theme?: 'light' | 'dark' | 'system'
}

const PREFERENCES_KEY = 'book-scanner-preferences'

const defaultPreferences: UserPreferences = {
  strictnessMode: 'standard',
  showRawApiResponse: false,
  autoSelectSingleCandidate: true,
  theme: 'system',
}

/**
 * Hook for managing user preferences in browser storage
 */
export function useUserPreferences() {
  const [preferences, setPreferences] = useLocalStorage<UserPreferences>(
    PREFERENCES_KEY,
    defaultPreferences
  )

  const updatePreference = <K extends keyof UserPreferences>(
    key: K,
    value: UserPreferences[K]
  ) => {
    setPreferences((prev) => ({
      ...prev,
      [key]: value,
    }))
  }

  const resetPreferences = () => {
    setPreferences(defaultPreferences)
  }

  return {
    preferences: { ...defaultPreferences, ...preferences },
    updatePreference,
    resetPreferences,
  }
}





