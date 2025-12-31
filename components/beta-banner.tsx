"use client"

import { useState } from "react"
import { Sparkles, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { APP_VERSION_LABEL } from "@/lib/config/version"

export function BetaBanner() {
  const [isVisible, setIsVisible] = useState(true)

  if (!isVisible) {
    return null
  }

  return (
    <div className="relative w-full bg-primary/10 border-b border-primary/20 py-2.5 px-4">
      <div className="container mx-auto flex items-center justify-center gap-3 text-sm">
        <Sparkles className="h-4 w-4 text-primary flex-shrink-0" />
        <div className="flex items-center gap-2 flex-wrap justify-center">
          <span className="font-semibold text-primary">{APP_VERSION_LABEL}</span>
          <span className="hidden sm:inline text-muted-foreground">—</span>
          <span className="text-muted-foreground text-center">
            AI analysis is actively being improved. Results may vary.
          </span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsVisible(false)}
          className="absolute right-4 h-6 w-6 p-0 text-muted-foreground hover:text-foreground hover:bg-transparent"
          aria-label="Dismiss banner"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}











