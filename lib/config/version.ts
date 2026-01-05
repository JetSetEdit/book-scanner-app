/**
 * Application Version Configuration
 * 
 * This file tracks the current version of the application.
 * Update this when deploying new versions.
 */

export const APP_VERSION = "1.01.13"
export const APP_VERSION_LABEL = "Public Beta 1.01"
export const APP_BUILD_DATE = "2026-01-05" // YYYY-MM-DD - Update on each deployment

// Version history
export const VERSION_HISTORY = [
  {
    version: "1.01.0",
    label: "Public Beta 1.01",
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

