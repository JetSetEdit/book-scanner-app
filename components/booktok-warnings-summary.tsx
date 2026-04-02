"use client"

import { useMemo } from "react"
import { Badge } from "@/components/ui/badge"
import { AlertTriangle, BookOpen, Heart, Info } from "lucide-react"
import { cn } from "@/lib/utils"
import { isSexualContentWarning } from "@/lib/utils/spice-level"
import { getSubcategoryById } from "@/lib/config/taxonomy-v2"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

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

/**
 * Themes beyond the left-column severity & spice summary: key triggers + tropes only.
 * Avoids duplicating the severity bar and counts shown under the cover.
 */
export function BooktokWarningsSummary({ warnings, onWarningClick }: BooktokWarningsSummaryProps) {
  const summary = useMemo(() => {
    const triggers = warnings.filter((w) => {
      const isTrope = w.category_id === "tropes" || w.category === "tropes"
      const isSpice = isSexualContentWarning(w)
      return !isTrope && !isSpice && (w.severity === "severe" || w.severity === "moderate")
    }).sort((a, b) => {
      if (a.severity === "severe" && b.severity !== "severe") return -1
      if (a.severity !== "severe" && b.severity === "severe") return 1
      return 0
    }).slice(0, 5)

    const tropes = warnings.filter((w) => w.category_id === "tropes" || w.category === "tropes")

    return { triggers, tropes }
  }, [warnings])

  if (warnings.length === 0) return null
  if (summary.triggers.length === 0 && summary.tropes.length === 0) return null

  const handleKeyDown = (e: React.KeyboardEvent, w: Warning) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault()
      onWarningClick?.(w)
    }
  }

  const subsectionLabel = "text-[10px] font-bold uppercase tracking-widest text-muted-foreground"

  return (
    <div
      className="max-w-2xl mx-auto mb-8 rounded-2xl border border-border/60 bg-muted/15 shadow-sm overflow-hidden"
      role="region"
      aria-label="Key themes: standout triggers and story patterns"
    >
      <div className="px-5 pt-4 pb-3 flex flex-col gap-0.5 border-b border-border/50 bg-muted/10 sm:flex-row sm:items-center sm:gap-2">
        <div className="flex items-center gap-2">
          <BookOpen className="h-4 w-4 text-primary shrink-0" />
          <h3 className="text-sm font-bold font-serif tracking-tight text-foreground">Key themes</h3>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  className="inline-flex p-0.5 rounded text-muted-foreground hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  aria-label="What Key triggers and Tropes and themes mean"
                >
                  <Info className="h-3.5 w-3.5" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="max-w-xs text-xs">
                <p>
                  <strong>Severity, spice, and age rating</strong> are in the panel under the cover. This section only
                  lists <strong>moderate or severe triggers</strong> (if any) and <strong>tropes</strong>—not another
                  copy of the severity breakdown.
                </p>
                <p className="mt-1.5">
                  <strong>Key triggers</strong> are distressing content readers often want to avoid or prepare for.
                </p>
                <p className="mt-1.5">
                  <strong>Tropes and themes</strong> are story patterns (e.g. enemies to lovers)—genre signals, not
                  necessarily warnings.
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <p className="text-[10px] text-muted-foreground sm:ml-auto sm:text-right pl-6 sm:pl-0">
          Standout triggers &amp; tropes — see cover panel for severity
        </p>
      </div>

      <div className="p-5 space-y-4">
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
                  variant={w.severity === "severe" ? "destructive" : "secondary"}
                  className={cn(
                    "px-2.5 py-0.5 text-xs font-medium rounded-full",
                    w.severity === "severe" && "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
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

function formatLabel(w: Warning): string {
  if (w.subcategory_id) {
    const parts = w.subcategory_id.split(".")
    if (parts.length === 2) {
      const sub = getSubcategoryById(parts[0], parts[1])
      if (sub) return sub.userLabel
    }

    return parts[parts.length - 1]
      .split("_")
      .map((word) => {
        if (word.toUpperCase() === word && word.length <= 5) return word.toUpperCase()
        return word.charAt(0).toUpperCase() + word.slice(1)
      })
      .join(" ")
      .replace(/\bPtsd\b/gi, "PTSD")
  }
  return w.description?.split(".")[0] || "Unknown"
}
