/**
 * Severity Icons - Colored Book Icons
 * 
 * Same book icon (BookOpen) with different colors for severity
 * Simple, consistent, and book-themed
 */

import { BookOpen } from "lucide-react"

interface SeverityIconProps {
  className?: string
  size?: number
}

// Mild: BookOpen icon with yellow color
export function SeverityMild({ className = "h-3 w-3", size = 12 }: SeverityIconProps) {
  return <BookOpen className={`${className} text-yellow-600`} style={{ width: size, height: size }} />
}

// Moderate: BookOpen icon with orange color
export function SeverityModerate({ className = "h-3 w-3", size = 12 }: SeverityIconProps) {
  return <BookOpen className={`${className} text-orange-600`} style={{ width: size, height: size }} />
}

// Severe: BookOpen icon with red color
export function SeveritySevere({ className = "h-3 w-3", size = 12 }: SeverityIconProps) {
  return <BookOpen className={`${className} text-red-600`} style={{ width: size, height: size }} />
}
