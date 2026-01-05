"use client"

import { useLocalStorage } from './use-browser-storage'

export interface ScanHistoryItem {
  isbn: string
  title: string
  author?: string
  scannedAt: string
  bookId?: string
}

const SCAN_HISTORY_KEY = 'book-scanner-scan-history'
const MAX_HISTORY_ITEMS = 50

/**
 * Hook for managing scan history in browser storage
 */
export function useScanHistory() {
  const [history, setHistory] = useLocalStorage<ScanHistoryItem[]>(
    SCAN_HISTORY_KEY,
    []
  )

  const addScan = (item: Omit<ScanHistoryItem, 'scannedAt'>) => {
    setHistory((prev) => {
      // Remove duplicate if exists (by ISBN)
      const filtered = prev.filter((h) => h.isbn !== item.isbn)
      
      // Add new item at the beginning
      const updated = [
        {
          ...item,
          scannedAt: new Date().toISOString(),
        },
        ...filtered,
      ]
      
      // Keep only the most recent MAX_HISTORY_ITEMS
      return updated.slice(0, MAX_HISTORY_ITEMS)
    })
  }

  const removeScan = (isbn: string) => {
    setHistory((prev) => prev.filter((h) => h.isbn !== isbn))
  }

  const clearHistory = () => {
    setHistory([])
  }

  return {
    history,
    addScan,
    removeScan,
    clearHistory,
  }
}























