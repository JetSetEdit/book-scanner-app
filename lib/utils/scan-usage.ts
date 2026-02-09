/**
 * Client-side daily scan usage for freemium gate.
 * Stored in localStorage; resets by calendar day (local date).
 * See OpenSpec add-positioning-and-monetization-strategy.
 */

const STORAGE_KEY = "subtext_daily_scan_usage"

export interface DailyUsage {
  date: string // YYYY-MM-DD
  quick: number
  deep: number
}

function today(): string {
  if (typeof window === "undefined") return ""
  return new Date().toISOString().slice(0, 10)
}

function load(): DailyUsage {
  if (typeof window === "undefined") return { date: "", quick: 0, deep: 0 }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return { date: today(), quick: 0, deep: 0 }
    const parsed = JSON.parse(raw) as DailyUsage
    const t = today()
    if (parsed.date !== t) return { date: t, quick: 0, deep: 0 }
    return parsed
  } catch {
    return { date: today(), quick: 0, deep: 0 }
  }
}

function save(usage: DailyUsage): void {
  if (typeof window === "undefined") return
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(usage))
  } catch {
    // ignore
  }
}

export function getDailyScanUsage(): { usedQuick: number; usedDeep: number } {
  const u = load()
  return { usedQuick: u.quick, usedDeep: u.deep }
}

export function incrementDailyScanUsage(scanType: "quick" | "deep"): void {
  const u = load()
  if (u.date !== today()) {
    u.date = today()
    u.quick = 0
    u.deep = 0
  }
  if (scanType === "quick") u.quick += 1
  else u.deep += 1
  save(u)
}
