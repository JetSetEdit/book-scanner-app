"use client"

import { useLocalStorage } from './use-browser-storage'

export interface UserPreferences {
  strictnessMode?: 'standard' | 'strict' | 'parent'
  showRawApiResponse?: boolean
  autoSelectSingleCandidate?: boolean
  theme?: 'light' | 'dark' | 'system'
  showCameraScanner?: boolean
  useMultiModel?: boolean
  tropeMode?: 'tropes' | 'triggers' | 'both' // For dark romance readers: show tropes they seek, triggers they avoid, or both
  enableQuickExit?: boolean // Enable/disable Quick Exit button for sensitive content
}

const PREFERENCES_KEY = 'book-scanner-preferences'

const defaultPreferences: UserPreferences = {
  strictnessMode: 'standard',
  showRawApiResponse: false,
  autoSelectSingleCandidate: true,
  theme: 'system',
  showCameraScanner: false, // Default to manual entry, camera is opt-in
  useMultiModel: true, // Default to multi-model for better coverage
  tropeMode: 'both', // Default to showing both tropes and triggers
  enableQuickExit: true, // Default to enabled for safety
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






