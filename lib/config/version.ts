/**
 * Application Version Configuration
 * 
 * This file tracks the current version of the application.
 * Update this when deploying new versions.
 */

export const APP_VERSION = "1.03.81"
export const APP_VERSION_LABEL = "Public Beta"
export const APP_BUILD_DATE = "2026-04-02" // YYYY-MM-DD - Update on each deployment

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
    version: "1.03.0",
    label: "Public Beta",
    date: "2026-01-09",
    changes: [
      "Added Quick Exit button for sensitive content (domestic violence, sexual assault)",
      "Implemented state-based support resources (NSW, VIC, QLD, WA, SA, TAS, ACT, NT)",
      "Enhanced feedback system with context prefilling and smart type detection",
      "Expanded support resources: LGBTIQA+, substance use, grief, bullying, racism",
      "Added comprehensive Australian support services for all warning categories",
      "Improved feedback data capture with book context and technical metadata"
    ]
  },
  {
    version: "1.02.0",
    label: "Public Beta",
    date: "2026-01-08",
    changes: [
      "Added dynamic reader summaries for content warnings",
      "Implemented accordion grouping by category",
      "Added phrase rotation for warning descriptions",
      "Enhanced UX with collapsible warning sections"
    ]
  },
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

