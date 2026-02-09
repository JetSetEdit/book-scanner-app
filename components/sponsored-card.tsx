"use client"

import type { SponsoredItem } from "@/lib/config/monetization"

interface SponsoredCardProps {
  item: SponsoredItem
  compact?: boolean
}

/**
 * Trust-safe sponsored card: clear "Sponsored" label, no animation/audio.
 * One slot per surface. See OpenSpec add-positioning-and-monetization-strategy.
 */
export function SponsoredCard({ item, compact = false }: SponsoredCardProps) {
  return (
    <aside
      className="rounded-xl border border-border bg-card/60 p-4"
      aria-label="Sponsored"
      data-testid="sponsored-card"
    >
      <p className="mb-2 text-[11px] uppercase tracking-wider text-muted-foreground">
        Sponsored
      </p>
      <div className={compact ? "space-y-1" : "space-y-2"}>
        <h3 className="text-sm font-semibold text-foreground">{item.title}</h3>
        <p className="text-xs text-muted-foreground">{item.description}</p>
        <a
          href={item.ctaUrl}
          target="_blank"
          rel="noreferrer noopener sponsored"
          className="inline-flex rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90"
        >
          {item.ctaLabel}
        </a>
      </div>
      <p className="mt-3 text-[10px] text-muted-foreground/80">
        Sponsored content never affects warning outcomes or age recommendations.
      </p>
    </aside>
  )
}
