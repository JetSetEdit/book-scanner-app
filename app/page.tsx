import { Shield, Users, Brain } from "lucide-react"
import { Suspense } from "react"
import { BookSpineLogo } from "@/components/book-spine-logo"
import { RecentScans } from "@/components/recent-scans"
import { SearchComponent } from "@/components/search"
import { getVariantConfig } from "@/lib/config/variants"
import { ReferralWelcomeModalWrapper } from "@/components/referral-welcome-modal-wrapper"

export default function HomePage() {
  const v = getVariantConfig()

  return (
    <main className="min-h-screen bg-background flex flex-col">
      {/* Referral Welcome Modal Wrapper (client component) */}
      <Suspense fallback={null}>
        <ReferralWelcomeModalWrapper />
      </Suspense>

      {/* Hero Section */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-24 md:py-32 text-center">
        <div className="w-full max-w-3xl mx-auto space-y-8 flex flex-col items-center">

          {/* 1. Big “S” mark */}
          <div className="mb-6">
            <BookSpineLogo className="h-48 w-48 md:h-64 md:w-64 text-foreground" />
          </div>

          {/* 2. “Subtext” wordmark */}
          <span className="text-4xl md:text-5xl font-serif font-normal tracking-tight text-foreground animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100" style={{ fontFamily: 'var(--font-serif)' }}>
            Subtext
          </span>

          {/* 3. Large centered search bar */}
          <div className="relative z-10 w-full max-w-2xl pt-6 pb-2 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200">
            <Suspense>
              <SearchComponent className="w-full max-w-full h-auto text-lg [&_input]:h-14 [&_input]:text-lg [&_input]:px-12 [&_svg]:h-6 [&_svg]:w-6 [&_svg]:left-4 [&_input]:!bg-white" />
            </Suspense>
          </div>

          {/* 4. Tagline */}
          <h1 className="font-serif text-3xl md:text-4xl font-bold tracking-tight text-foreground animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300">
            The hidden context of every story.
          </h1>

          {/* 5. Sub-line */}
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground leading-relaxed font-light animate-in fade-in slide-in-from-bottom-4 duration-700 delay-400">
            Instant book content warnings and age guidance. Scan a barcode or search a title to see Mild / Moderate / Severe warnings with explanations.
          </p>

        </div>
      </div>

      {/* Recent Scans Section */}
      <RecentScans />

      {/* Features Grid (hidden in lite) */}
      {/* Feature Row - concise version */}
      <div className="border-t border-border/50 bg-card/30">
        <div className="container mx-auto px-4 py-16">
          <div className="grid md:grid-cols-3 gap-8 text-center">

            <div className="flex flex-col items-center gap-3">
              <Shield className="h-8 w-8 text-foreground/90 stroke-[1.5]" />
              <p className="font-medium text-foreground">
                Content warnings with severity <br />
                <span className="text-muted-foreground text-sm font-normal">(Mild / Moderate / Severe)</span>
              </p>
            </div>

            <div className="flex flex-col items-center gap-3">
              <Brain className="h-8 w-8 text-foreground/90 stroke-[1.5]" />
              <p className="font-medium text-foreground">
                Age ratings based on real‑world standards
              </p>
            </div>

            <div className="flex flex-col items-center gap-3">
              <Users className="h-8 w-8 text-foreground/90 stroke-[1.5]" />
              <p className="font-medium text-foreground">
                Clear “Why?” explanations for every warning
              </p>
            </div>

          </div>
        </div>
      </div>
    </main>
  )
}
