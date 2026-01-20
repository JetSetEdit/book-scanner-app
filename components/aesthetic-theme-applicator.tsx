"use client"

import { useEffect, useState } from "react"
import type { AestheticThemeId } from "@/lib/config/aesthetic-themes"

const PREFERENCES_KEY = "book-scanner-preferences"

function getAesthetic(): AestheticThemeId {
  if (typeof window === "undefined") return "reader"
  try {
    const raw = window.localStorage.getItem(PREFERENCES_KEY)
    const p = raw ? JSON.parse(raw) : ({} as Record<string, unknown>)
    return (p.aestheticTheme || "reader") as AestheticThemeId
  } catch {
    return "reader"
  }
}

/**
 * Applies data-aesthetic to <html> so CSS [data-aesthetic="id"] overrides take effect.
 * "reader" uses default :root/.dark; others override with BookTok-style palettes.
 * Listens for subtext-preferences-changed (fired by updatePreference) so it sees
 * same-tab updates; useLocalStorage only syncs across tabs via storage events.
 */
export function AestheticThemeApplicator() {
  const [id, setId] = useState<AestheticThemeId>("reader")

  useEffect(() => {
    setId(getAesthetic())
    const handler = () => setId(getAesthetic())
    window.addEventListener("subtext-preferences-changed", handler)
    return () => window.removeEventListener("subtext-preferences-changed", handler)
  }, [])

  useEffect(() => {
    document.documentElement.setAttribute("data-aesthetic", id)
  }, [id])

  return null
}
