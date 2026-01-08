/**
 * Application Version Configuration
 * 
 * This file tracks the current version of the application.
 * Update this when deploying new versions.
 */

export const APP_VERSION = "1.01.103"
export const APP_VERSION_LABEL = "Public Beta"
export const APP_BUILD_DATE = "2026-01-08" // YYYY-MM-DD - Update on each deployment

// Build ID from git commit hash (set at build time)
// Falls back to "dev" if not in git repo or during development
function getBuildId(): string {
  // Try to get from environment variable first (set at build time)
  if (process.env.NEXT_PUBLIC_BUILD_ID) {
    return process.env.NEXT_PUBLIC_BUILD_ID
  }
  
  // Fallback for development
  if (process.env.NODE_ENV === 'development') {
    return 'dev'
  }
  
  return 'unknown'
}

export const APP_BUILD_ID = getBuildId()

// Version history
export const VERSION_HISTORY = [
  {
    version: "1.01.0",
    label: "Public Beta",
    date: "2025-12-31",
    changes: [
      "Added spoiler blur feature for content warnings",
      "Improved AI analysis with multi-model support",
      "Fixed description fetching for books without descriptions",
      "Added force re-scan functionality",
      "Enhanced taxonomy system with context modifiers"
    ]
  }
] as const

