"use client"

import { useMemo } from "react"
import { Badge } from "@/components/ui/badge"
import { Flame, AlertTriangle, BookOpen, Heart } from "lucide-react"
import { cn } from "@/lib/utils"
import { getSubcategoryById } from "@/lib/config/taxonomy-v2"

interface Warning {
  category: string
  category_id?: string | null
  subcategory_id?: string | null
  description: string
  severity: "mild" | "moderate" | "severe"
  id?: string
}

interface BooktokWarningsSummaryProps {
  warnings: Warning[]
  onWarningClick?: (warning: Warning) => void
}

export function BooktokWarningsSummary({ warnings, onWarningClick }: BooktokWarningsSummaryProps) {
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

  const handleKeyDown = (e: React.KeyboardEvent, w: Warning) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      onWarningClick?.(w)
    }
  }

  return (
    <div className="bg-muted/20 border border-border/50 rounded-3xl p-6 mb-8 space-y-6 backdrop-blur-sm shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold font-serif tracking-tight flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-primary" />
          Quick Glance
        </h3>
        
        {/* Spice Meter */}
        <div className="flex items-center gap-1.5 bg-background/50 px-3 py-1.5 rounded-full border border-border/50 shadow-sm">
          <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mr-1">Spice</span>
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
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
            <AlertTriangle className="h-3 w-3" />
            <span>Key Triggers</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {summary.triggers.map((w, i) => (
              <Badge 
                key={i} 
                variant={w.severity === 'severe' ? "destructive" : "secondary"}
                className={cn(
                  "px-3 py-1 text-xs font-medium border-transparent rounded-full shadow-sm",
                  w.severity === 'severe' ? "bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-300" : "",
                  onWarningClick ? "cursor-pointer hover:opacity-80 transition-opacity hover:scale-105 active:scale-95" : ""
                )}
                onClick={() => onWarningClick?.(w)}
                role={onWarningClick ? "button" : undefined}
                tabIndex={onWarningClick ? 0 : undefined}
                onKeyDown={(e) => handleKeyDown(e, w)}
              >
                {formatLabel(w)}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Tropes Section */}
      {summary.tropes.length > 0 && (
        <div className="space-y-3">
           <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
            <Heart className="h-3 w-3" />
            <span>Tropes & Themes</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {summary.tropes.map((w, i) => (
              <Badge 
                key={i} 
                variant="outline"
                className={cn(
                  "px-3 py-1 text-xs font-medium bg-background/80 hover:bg-accent transition-all rounded-full border-border/60 shadow-sm",
                  onWarningClick ? "cursor-pointer hover:scale-105 active:scale-95" : ""
                )}
                onClick={() => onWarningClick?.(w)}
                role={onWarningClick ? "button" : undefined}
                tabIndex={onWarningClick ? 0 : undefined}
                onKeyDown={(e) => handleKeyDown(e, w)}
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

// Helper to format labels using the taxonomy source of truth
function formatLabel(w: Warning): string {
    if (w.subcategory_id) {
        // 1. Try to get official label from taxonomy
        const parts = w.subcategory_id.split('.')
        if (parts.length === 2) {
            const sub = getSubcategoryById(parts[0], parts[1])
            if (sub) return sub.userLabel
        }
        
        // 2. Fallback: formatted ID
        return parts[parts.length-1]
            .split('_')
            .map(word => {
                // Keep acronyms uppercase
                if (word.toUpperCase() === word && word.length <= 5) return word.toUpperCase()
                return word.charAt(0).toUpperCase() + word.slice(1)
            })
            .join(' ')
            .replace(/\bPtsd\b/gi, 'PTSD')
    }
    // 3. Fallback: description or ID
    return w.description?.split('.')[0] || "Unknown"
}
