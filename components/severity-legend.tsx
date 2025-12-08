"use client"

import { SeverityMild, SeverityModerate, SeveritySevere } from "@/components/severity-icons"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

export function SeverityLegend() {
  return (
    <TooltipProvider>
      <div className="flex items-center justify-center gap-6 font-sans text-sm">
        {/* Mild */}
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center gap-2 cursor-help">
              <div className="p-0.5 rounded-full bg-yellow-50 text-yellow-600 shrink-0">
                <SeverityMild className="h-3 w-3" />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-yellow-600">
                Mild
              </span>
            </div>
          </TooltipTrigger>
          <TooltipContent className="max-w-xs">
            <p className="text-sm font-medium mb-1">Mild</p>
            <p className="text-xs text-muted-foreground mb-2">
              Content appears occasionally or is presented in a less intense manner. Suitable for most readers with minor sensitivity to the topic.
            </p>
            <p className="text-[10px] text-muted-foreground/70 italic">
              Note: Severity is subjective and varies based on individual sensitivity and the specific subject matter.
            </p>
          </TooltipContent>
        </Tooltip>

        <div className="h-4 w-px bg-slate-200"></div>

        {/* Moderate */}
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center gap-2 cursor-help">
              <div className="p-0.5 rounded-full bg-orange-50 text-orange-600 shrink-0">
                <SeverityModerate className="h-3 w-3" />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-orange-600">
                Moderate
              </span>
            </div>
          </TooltipTrigger>
          <TooltipContent className="max-w-xs">
            <p className="text-sm font-medium mb-1">Moderate</p>
            <p className="text-xs text-muted-foreground mb-2">
              Content appears regularly or with moderate intensity. May require some emotional preparation before reading.
            </p>
            <p className="text-[10px] text-muted-foreground/70 italic">
              Note: Severity is subjective and varies based on individual sensitivity and the specific subject matter.
            </p>
          </TooltipContent>
        </Tooltip>

        <div className="h-4 w-px bg-slate-200"></div>

        {/* Severe */}
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center gap-2 cursor-help">
              <div className="p-0.5 rounded-full bg-red-50 text-red-600 shrink-0">
                <SeveritySevere className="h-3 w-3" />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-red-600">
                Severe
              </span>
            </div>
          </TooltipTrigger>
          <TooltipContent className="max-w-xs">
            <p className="text-sm font-medium mb-1">Severe</p>
            <p className="text-xs text-muted-foreground mb-2">
              Intense, graphic, or pervasive content that appears frequently throughout the book. May be deeply distressing for some readers.
            </p>
            <p className="text-[10px] text-muted-foreground/70 italic">
              Note: Severity is subjective and varies based on individual sensitivity and the specific subject matter.
            </p>
          </TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  )
}

