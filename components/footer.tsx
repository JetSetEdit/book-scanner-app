"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { APP_VERSION_LABEL, APP_VERSION, APP_BUILD_DATE, APP_BUILD_ID } from "@/lib/config/version"
import { getVariantConfig } from "@/lib/config/variants"
import { FeedbackDialog } from "@/components/feedback-dialog"

export function Footer() {
  const pathname = usePathname()
  const isHome = pathname === "/"
  const v = getVariantConfig()

  return (
    <footer className="border-t border-border bg-card/30 mt-auto pb-20 md:pb-8">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Single link to knowledge hub (how we work, FAQ, press, privacy, terms all live there) */}
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-1 text-xs">
            <nav aria-label="Footer">
              <Link href="/help" className="text-muted-foreground hover:text-foreground transition-colors underline underline-offset-2">
                Help &amp; policies
              </Link>
              <span className="text-muted-foreground/40 mx-2">·</span>
              <FeedbackDialog />
            </nav>
          </div>

          <p className="text-xs text-muted-foreground text-center leading-relaxed max-w-2xl mx-auto">
            Subtext is in public beta—warnings are automated with human review in progress. Use your own judgment and let us know if something looks off.
          </p>

          {v.flags?.showAffiliate !== false && (
            <p className="text-xs text-muted-foreground/70 text-center max-w-2xl mx-auto">
              Subtext is a participant in the Amazon Services LLC Associates Program. As an Amazon Associate, we earn from qualifying purchases.
            </p>
          )}

          {isHome ? (
            <p className="text-xs text-muted-foreground/50 text-center">
              {APP_VERSION_LABEL} (v{APP_VERSION})
            </p>
          ) : (
            <p className="text-xs text-muted-foreground/60 text-center">
              {APP_VERSION_LABEL} (v{APP_VERSION}) · Build {APP_BUILD_ID} · {APP_BUILD_DATE}
            </p>
          )}
        </div>
      </div>
    </footer>
  )
}
