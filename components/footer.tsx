import Link from "next/link"
import { APP_VERSION_LABEL, APP_VERSION, APP_BUILD_DATE } from "@/lib/config/version"

export function Footer() {
  return (
    <footer className="border-t border-border bg-card/30 mt-auto pb-20 md:pb-8">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <p className="text-xs text-muted-foreground text-center leading-relaxed max-w-2xl mx-auto mb-4">
            Subtext provides transparent content analysis: every AI-generated warning includes source citations and reasoning so you can verify how it was determined. When authors provide their own content notes, we prioritize those above all else. While no system is perfect, we've built multiple verification layers and clear reasoning trails to ensure accuracy. Severity ratings are subjective—they vary by individual sensitivity and the nature of the content. Subtext is a tool for information, not a substitute for your own judgment.
          </p>
          <p className="text-xs text-muted-foreground text-center leading-relaxed max-w-2xl mx-auto mb-4">
            Subtext is a participant in the Amazon Services LLC Associates Program. As an Amazon Associate, we earn from qualifying purchases.
          </p>
          <div className="text-center space-y-2">
            <div className="flex flex-wrap items-center justify-center gap-4 text-xs">
              <Link href="/transparency" className="text-muted-foreground hover:text-foreground transition-colors underline underline-offset-2">
                Learn how we work
              </Link>
              <span className="text-muted-foreground/40">•</span>
              <Link href="/terms" className="text-muted-foreground hover:text-foreground transition-colors underline underline-offset-2">
                Terms of Service
              </Link>
              <span className="text-muted-foreground/40">•</span>
              <Link href="/privacy" className="text-muted-foreground hover:text-foreground transition-colors underline underline-offset-2">
                Privacy Policy
              </Link>
            </div>
            <div className="text-xs text-muted-foreground/60">
              {APP_VERSION_LABEL} (v{APP_VERSION}) • Updated {APP_BUILD_DATE}
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}

