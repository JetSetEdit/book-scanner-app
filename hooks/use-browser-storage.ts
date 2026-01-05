"use client"

import { useState, useEffect, useCallback } from 'react'

type StorageType = 'localStorage' | 'sessionStorage'

/**
 * Custom hook for browser storage (localStorage/sessionStorage)
 * Provides type-safe access to browser storage with React state synchronization
 */
export function useBrowserStorage<T>(
  key: string,
  initialValue: T,
  storageType: StorageType = 'localStorage'
): [T, (value: T | ((val: T) => T)) => void, () => void] {
  // Get the storage object
  const storage = typeof window !== 'undefined' 
    ? (storageType === 'localStorage' ? window.localStorage : window.sessionStorage)
    : null

  // State to store our value
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (!storage) return initialValue
    
    try {
      const item = storage.getItem(key)
      return item ? JSON.parse(item) : initialValue
    } catch (error) {
      console.error(`Error reading ${storageType} key "${key}":`, error)
      return initialValue
    }
  })

  // Return a wrapped version of useState's setter function that
  // persists the new value to storage
  const setValue = useCallback(
    (value: T | ((val: T) => T)) => {
      try {
        // Allow value to be a function so we have the same API as useState
        const valueToStore = value instanceof Function ? value(storedValue) : value
        
        // Save state
        setStoredValue(valueToStore)
        
        // Save to storage
        if (storage) {
          storage.setItem(key, JSON.stringify(valueToStore))
        }
      } catch (error) {
        console.error(`Error setting ${storageType} key "${key}":`, error)
      }
    },
    [key, storage, storageType, storedValue]
  )

  // Remove value from storage
  const removeValue = useCallback(() => {
    try {
      if (storage) {
        storage.removeItem(key)
      }
      setStoredValue(initialValue)
    } catch (error) {
      console.error(`Error removing ${storageType} key "${key}":`, error)
    }
  }, [key, storage, storageType, initialValue])

  // Listen for changes to this key in other tabs/windows
  useEffect(() => {
    if (!storage) return

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === key && e.newValue !== null) {
        try {
          setStoredValue(JSON.parse(e.newValue))
        } catch (error) {
          console.error(`Error parsing storage event for key "${key}":`, error)
        }
      }
    }

    // Only listen for localStorage events (sessionStorage doesn't sync across tabs)
    if (storageType === 'localStorage') {
      window.addEventListener('storage', handleStorageChange)
      return () => window.removeEventListener('storage', handleStorageChange)
    }
  }, [key, storageType])

  return [storedValue, setValue, removeValue]
}

/**
 * Hook specifically for localStorage
 */
export function useLocalStorage<T>(key: string, initialValue: T) {
  return useBrowserStorage(key, initialValue, 'localStorage')
}

/**
 * Hook specifically for sessionStorage
 */
export function useSessionStorage<T>(key: string, initialValue: T) {
  return useBrowserStorage(key, initialValue, 'sessionStorage')
}























