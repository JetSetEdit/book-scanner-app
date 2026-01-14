"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Loader2 } from "lucide-react"

interface ScanningAnimationProps {
  categories?: string[]
  isAnalyzing: boolean
}

// Fallback categories if none provided
const DEFAULT_CATEGORIES = [
  "Violence", "Romance", "Language", "Themes", "Content", "Triggers", "Tone"
]

export function ScanningAnimation({ categories = DEFAULT_CATEGORIES, isAnalyzing }: ScanningAnimationProps) {
  const [index, setIndex] = useState(0)

  // Cycle through categories rapidly
  useEffect(() => {
    if (!isAnalyzing) return

    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % categories.length)
    }, 150) // Fast flip (150ms)

    return () => clearInterval(interval)
  }, [isAnalyzing, categories.length])

  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground font-mono">
      <Loader2 className="h-3 w-3 animate-spin text-primary" />
      <span>Checking for:</span>
      <div className="relative h-5 w-32 overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={categories[index]}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -20, opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="absolute inset-0 font-bold text-primary uppercase tracking-wider"
          >
            {categories[index]}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}
