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

  if (warnings.length === 0) return null

  const handleKeyDown = (e: React.KeyboardEvent, w: Warning) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      onWarningClick?.(w)
    }
  }

  const mildCount = warnings.filter(w => w.severity !== 'moderate' && w.severity !== 'severe').length
  const moderateCount = warnings.filter(w => w.severity === 'moderate').length
  const severeCount = warnings.filter(w => w.severity === 'severe').length

  const subsectionLabel = "text-[10px] font-bold uppercase tracking-widest text-muted-foreground"

  return (
    <div
      className="max-w-2xl mx-auto mb-8 rounded-2xl border border-border/60 bg-muted/15 shadow-sm overflow-hidden"
      role="region"
      aria-label="Quick glance: content overview and key themes"
    >
      {/* Single header for the whole block */}
      <div className="px-5 pt-4 pb-3 flex items-center gap-2 border-b border-border/50 bg-muted/10">
        <BookOpen className="h-4 w-4 text-primary shrink-0" />
        <h3 className="text-sm font-bold font-serif tracking-tight text-foreground">Quick Glance</h3>
      </div>

      <div className="p-5 space-y-4">
        {/* Row 1: Severity bar + legend and Spice on one line */}
        <div className="space-y-2">
          <div className="flex flex-wrap gap-0.5">
            {warnings.map((w, i) => {
              const severity = w.severity === 'severe' ? 'severe' : w.severity === 'moderate' ? 'moderate' : 'mild'
              const bg = severity === 'severe' ? 'bg-red-500' : severity === 'moderate' ? 'bg-orange-500' : 'bg-amber-500'
              const categoryLabel = (w.category_id || w.category || 'content').replace(/_/g, ' ')
              return (
                <span
                  key={w.id || i}
                  className={`inline-block h-4 min-w-[6px] flex-1 max-w-[18px] rounded-sm ${bg} border border-white/20 dark:border-black/20`}
                  style={{ flexBasis: '8px' }}
                  title={`${severity}: ${categoryLabel}`}
                  aria-hidden
                />
              )
            })}
          </div>
          <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
            <div className="flex flex-wrap items-center gap-x-4 text-[10px] text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <span className="inline-block w-2 h-2 rounded-sm bg-amber-500 border border-white/20" aria-hidden />
                Mild {mildCount}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="inline-block w-2 h-2 rounded-sm bg-orange-500 border border-white/20" aria-hidden />
                Moderate {moderateCount}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="inline-block w-2 h-2 rounded-sm bg-red-500 border border-white/20" aria-hidden />
                Severe {severeCount}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
              <span className="font-bold uppercase tracking-widest">Spice</span>
              <span className="flex items-center gap-0.5">
                {[1, 2, 3].map((level) => (
                  <Flame
                    key={level}
                    className={cn(
                      "h-3 w-3 transition-all",
                      level <= summary.spiceLevel ? "fill-orange-500 text-orange-500" : "text-muted-foreground/20"
                    )}
                  />
                ))}
              </span>
            </div>
          </div>
        </div>

        {/* Key Triggers — same subsection style */}
        {summary.triggers.length > 0 && (
          <div className="space-y-1.5">
            <div className={cn("flex items-center gap-2", subsectionLabel)}>
              <AlertTriangle className="h-3 w-3 shrink-0" />
              <span>Key triggers</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {summary.triggers.map((w, i) => (
                <Badge
                  key={i}
                  variant={w.severity === 'severe' ? "destructive" : "secondary"}
                  className={cn(
                    "px-2.5 py-0.5 text-xs font-medium rounded-full",
                    w.severity === 'severe' && "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
                    onWarningClick && "cursor-pointer hover:opacity-90"
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

        {/* Tropes & themes — same subsection style */}
        {summary.tropes.length > 0 && (
          <div className="space-y-1.5">
            <div className={cn("flex items-center gap-2", subsectionLabel)}>
              <Heart className="h-3 w-3 shrink-0" />
              <span>Tropes & themes</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {summary.tropes.map((w, i) => (
                <Badge
                  key={i}
                  variant="outline"
                  className={cn(
                    "px-2.5 py-0.5 text-xs font-medium rounded-full border-border/60 bg-background/60",
                    onWarningClick && "cursor-pointer hover:bg-muted/50"
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
