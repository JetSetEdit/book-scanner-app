'use client'

import { Info } from 'lucide-react'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { getGlossaryDefinition, hasGlossaryDefinition } from "@/lib/glossary"
import { cn } from "@/lib/utils"

interface TagWithTooltipProps {
  label: string
  className?: string
  showIcon?: boolean
}

export function TagWithTooltip({ label, className, showIcon = true }: TagWithTooltipProps) {
  // Safety check: ensure label is a valid string
  if (!label || typeof label !== 'string') {
    return <span className={className}>{label || 'Unknown'}</span>
  }

  const definition = getGlossaryDefinition(label)
  const hasDefinition = hasGlossaryDefinition(label)

  // If no definition exists, just render the label without tooltip
  if (!hasDefinition || !definition) {
    return <span className={className}>{label}</span>
  }

  return (
    <Tooltip delayDuration={300}>
      <TooltipTrigger asChild>
        <span className={cn("inline-flex items-center gap-1.5 cursor-help", className)}>
          <span>{label}</span>
          {showIcon && (
            <Info className="h-3 w-3 text-muted-foreground opacity-60 hover:opacity-100 transition-opacity flex-shrink-0" />
          )}
          <span className="sr-only">Definition available</span>
        </span>
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-xs text-xs bg-popover border-border">
        <p>{definition}</p>
      </TooltipContent>
    </Tooltip>
  )
}
