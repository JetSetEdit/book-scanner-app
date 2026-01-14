"use client"

import { useMemo } from "react"
import { Badge } from "@/components/ui/badge"
import { Flame, AlertTriangle, BookOpen, Heart } from "lucide-react"
import { cn } from "@/lib/utils"

interface Warning {
  category: string
  category_id?: string | null
  subcategory_id?: string | null
  description: string
  severity: "mild" | "moderate" | "severe"
}

interface BooktokWarningsSummaryProps {
  warnings: Warning[]
}

export function BooktokWarningsSummary({ warnings }: BooktokWarningsSummaryProps) {
  const summary = useMemo(() => {
    // 1. Calculate Spice Level
    // Logic: Look for 'sexual_content' category.
    // - Explicit/Graphic or Severe -> 3 chilis
    // - Moderate -> 2 chilis
    // - Mild -> 1 chili
    // - None -> 0 chilis
    let spiceLevel = 0
    const sexWarnings = warnings.filter(w => 
      w.category_id === 'sexual_content' || w.category === 'sexual_content'
    )
    
    if (sexWarnings.length > 0) {
      const hasSevere = sexWarnings.some(w => w.severity === 'severe')
      const hasExplicit = sexWarnings.some(w => w.subcategory_id?.includes('explicit'))
      const hasModerate = sexWarnings.some(w => w.severity === 'moderate')
      
      if (hasSevere || hasExplicit) spiceLevel = 3
      else if (hasModerate) spiceLevel = 2
      else spiceLevel = 1
    }

    // 2. Extract Top Triggers (Severe/Moderate, excluding tropes & spice)
    const triggers = warnings.filter(w => {
      const isTrope = w.category_id === 'tropes' || w.category === 'tropes'
      const isSpice = w.category_id === 'sexual_content' || w.category === 'sexual_content'
      // Include severe/moderate items that aren't tropes or just "mild spice"
      return !isTrope && !isSpice && (w.severity === 'severe' || w.severity === 'moderate')
    }).sort((a, b) => {
      // Sort severe first
      if (a.severity === 'severe' && b.severity !== 'severe') return -1
      if (a.severity !== 'severe' && b.severity === 'severe') return 1
      return 0
    }).slice(0, 5) // Top 5 only

    // 3. Extract Tropes
    const tropes = warnings.filter(w => 
      w.category_id === 'tropes' || w.category === 'tropes'
    )

    return { spiceLevel, triggers, tropes }
  }, [warnings])

  // Don't render if empty (though rare for this app)
  if (summary.spiceLevel === 0 && summary.triggers.length === 0 && summary.tropes.length === 0) {
    return null
  }

  return (
    <div className="bg-muted/30 border border-border rounded-xl p-5 mb-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold font-serif tracking-tight flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-primary" />
          Quick Glance
        </h3>
        
        {/* Spice Meter */}
        <div className="flex items-center gap-1.5 bg-background/50 px-3 py-1.5 rounded-full border border-border/50">
          <span className="text-xs font-semibold uppercase text-muted-foreground mr-1">Spice</span>
          {[1, 2, 3].map((level) => (
            <Flame
              key={level}
              className={cn(
                "h-4 w-4 transition-all",
                level <= summary.spiceLevel 
                  ? "fill-orange-500 text-orange-500" 
                  : "text-muted-foreground/20"
              )}
            />
          ))}
        </div>
      </div>

      {/* Triggers Section */}
      {summary.triggers.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase tracking-wider">
            <AlertTriangle className="h-3.5 w-3.5" />
            <span>Key Triggers</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {summary.triggers.map((w, i) => (
              <Badge 
                key={i} 
                variant={w.severity === 'severe' ? "destructive" : "secondary"}
                className={cn(
                  "px-2.5 py-0.5 text-xs font-medium border-transparent",
                  w.severity === 'severe' ? "bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-300" : ""
                )}
              >
                {/* Basic cleanup of subcategory_id for display if needed, or use a helper */}
                {formatLabel(w)}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Tropes Section */}
      {summary.tropes.length > 0 && (
        <div className="space-y-2">
           <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase tracking-wider">
            <Heart className="h-3.5 w-3.5" />
            <span>Tropes & Themes</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {summary.tropes.map((w, i) => (
              <Badge 
                key={i} 
                variant="outline"
                className="px-2.5 py-0.5 text-xs font-medium bg-background hover:bg-accent transition-colors"
              >
                {formatLabel(w)}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// Simple helper to format labels from IDs or descriptions if label missing
// (In a real app, you'd use your taxonomy helper here)
function formatLabel(w: Warning): string {
    if (w.subcategory_id) {
        const parts = w.subcategory_id.split('.')
        // Convert "enemy_to_lovers" -> "Enemy To Lovers"
        return parts[parts.length-1].split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
    }
    return "Unknown"
}
