/**
 * Freemium entitlements: daily limits per plan, canRunScan check.
 * "Free triage. Pay for depth." – free tier gets limited Quick scans; Deep scans and richer output are paid.
 * See OpenSpec add-positioning-and-monetization-strategy.
 */

export type Plan = "free" | "plus"

export function getDailyLimits(plan: Plan): { quickScans: number; deepScans: number } {
  if (plan === "plus") return { quickScans: 50, deepScans: 10 }
  return { quickScans: 3, deepScans: 0 }
}

export interface CanRunScanParams {
  plan: Plan
  scanType: "quick" | "deep"
  usedQuick: number
  usedDeep: number
}

export function canRunScan({ plan, scanType, usedQuick, usedDeep }: CanRunScanParams): boolean {
  const limits = getDailyLimits(plan)
  if (scanType === "quick") return usedQuick < limits.quickScans
  return usedDeep < limits.deepScans
}
