import { cookies, headers } from 'next/headers'
import { Shield, Users, ScanBarcode, Search, Brain, Sparkles, Eye, Scale } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { BookSpineLogo } from "@/components/book-spine-logo"
import { RecentScans } from "@/components/recent-scans"
import { getVariantConfig } from "@/lib/config/variants"
import { HomepageGate } from "@/components/homepage-gate"
import { isIpAllowlisted } from '@/lib/utils/rate-limiter'
import { FeedbackDialog } from '@/components/feedback-dialog'

export default async function HomePage() {
  const cookieStore = await cookies()
  const hasAccess = cookieStore.has('subtext_vip') || cookieStore.has('subtext_access_granted')

  if (!hasAccess) {
    return <HomepageGate />
  }

  const headerList = await headers()
  const forwarded = headerList.get('x-forwarded-for')
  const ip = forwarded ? forwarded.split(',')[0].trim() : 'unknown'
  const isAdmin = isIpAllowlisted(ip)
  const isVip = cookieStore.has('subtext_vip')
  const showHomeFooterStrip = !isVip && !isAdmin

  const v = getVariantConfig()
  return (
    <main className="min-h-screen bg-background flex flex-col">
      {/* Hero: distinct marketing band */}
      <section className="relative overflow-hidden border-b border-border/30">
        <div
          className="pointer-events-none absolute inset-0 bg-gradient-to-b from-primary/[0.07] via-background to-background"
          aria-hidden
        />
        <div className="relative flex flex-col items-center px-4 pt-20 pb-16 md:pt-28 md:pb-20 text-center">
          <div className="max-w-4xl mx-auto space-y-8">
            <div className="flex flex-col items-center justify-center">
              <div className="mb-6">
                <BookSpineLogo className="h-40 w-40 md:h-52 md:w-52 text-foreground" />
              </div>
              <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground font-medium mb-3">
                Content awareness for books
              </p>
              <span className="text-4xl md:text-6xl font-serif font-normal tracking-tight text-foreground" style={{ fontFamily: 'var(--font-serif)' }}>{v.name}</span>
            </div>

            <h1 className="font-serif text-4xl md:text-6xl font-bold tracking-tight text-foreground leading-[1.1]">
              {v.homepage.headline} <br className="hidden md:block" />
              <span className="text-muted-foreground italic">{v.homepage.headlineItalic}</span>
            </h1>

            <p className="mx-auto max-w-2xl text-lg md:text-xl text-muted-foreground leading-relaxed">
              {v.homepage.subhead}
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
              <Link href="/scan">
                <Button size="lg" className="h-14 px-8 text-lg rounded-full bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all hover:scale-[1.02]">
                  <ScanBarcode className="mr-2 h-5 w-5" />
                  {v.homepage.ctaPrimary}
                </Button>
              </Link>
              <Link href="/bookshelf">
                <Button size="lg" variant="outline" className="h-14 px-8 text-lg rounded-full border-border text-foreground hover:bg-accent hover:text-accent-foreground">
                  <Search className="mr-2 h-5 w-5" />
                  {v.homepage.ctaSecondary}
                </Button>
              </Link>
            </div>

            {/* Trust: how to read Subtext (near top, low jargon) */}
            <div className="pt-10 md:pt-14 max-w-3xl mx-auto">
              <ul className="grid sm:grid-cols-3 gap-6 text-left rounded-2xl border border-border/50 bg-card/40 dark:bg-card/20 px-5 py-6 md:px-8 md:py-8 shadow-sm">
                <li className="space-y-2">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Sparkles className="h-5 w-5" aria-hidden />
                  </div>
                  <h2 className="font-serif text-base font-semibold text-foreground">Automated analysis</h2>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Warnings are generated from verified book metadata and sources, then mapped to a fixed taxonomy—so you get consistent labels, not random adjectives.
                  </p>
                </li>
                <li className="space-y-2">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Eye className="h-5 w-5" aria-hidden />
                  </div>
                  <h2 className="font-serif text-base font-semibold text-foreground">Honest about evidence</h2>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    We aim to be clear when something is strongly supported versus thinly described. Subtext is a guide to what is known publicly—not a guarantee about every page.
                  </p>
                </li>
                <li className="space-y-2 sm:col-span-1">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Scale className="h-5 w-5" aria-hidden />
                  </div>
                  <h2 className="font-serif text-base font-semibold text-foreground">Your judgment</h2>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Built for parents, educators, booksellers, and readers who want a head start—never a substitute for your own standards or context.
                  </p>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <RecentScans variant="showcase" />

      {/* Features: clear section break from proof */}
      <section className="border-t border-border/50 bg-muted/20 dark:bg-muted/10">
        <div className="container mx-auto px-4 py-20 md:py-28">
          <div className="max-w-3xl mx-auto text-center mb-14 md:mb-16 space-y-3">
            <p className="text-xs md:text-sm uppercase tracking-[0.2em] text-muted-foreground font-medium">
              What you get
            </p>
            <h2 className="font-serif text-3xl md:text-4xl font-bold text-foreground tracking-tight">
              Warnings, ratings, and a path to verify
            </h2>
            <p className="text-muted-foreground text-base md:text-lg leading-relaxed">
              Everything in Subtext is designed to be scannable first and detailed when you need it.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-12 max-w-6xl mx-auto">
            <div className="space-y-4">
              <div className="h-12 w-12 rounded-full bg-amber-100/50 dark:bg-amber-900/30 flex items-center justify-center text-amber-700 dark:text-amber-400">
                <Shield className="h-6 w-6" />
              </div>
              <h3 className="font-serif text-2xl font-bold text-foreground">{v.features.contentWarnings.title}</h3>
              <p className="text-muted-foreground leading-relaxed">
                {v.features.contentWarnings.description}
              </p>
            </div>

            <div className="space-y-4">
              <div className="h-12 w-12 rounded-full bg-blue-100/50 dark:bg-blue-900/30 flex items-center justify-center text-blue-700 dark:text-blue-400">
                <Brain className="h-6 w-6" />
              </div>
              <h3 className="font-serif text-2xl font-bold text-foreground">{v.features.ageRatings.title}</h3>
              <p className="text-muted-foreground leading-relaxed">
                {v.features.ageRatings.description}
              </p>
            </div>

            <div className="space-y-4 relative">
              <div className="absolute -top-2 -right-2">
                <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary border border-primary/20">
                  Coming Soon
                </span>
              </div>
              <div className="h-12 w-12 rounded-full bg-emerald-100/50 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-700 dark:text-emerald-400 opacity-60">
                <Users className="h-6 w-6" />
              </div>
              <h3 className="font-serif text-2xl font-bold text-muted-foreground">{v.features.community.title}</h3>
              <p className="text-muted-foreground leading-relaxed">
                {v.features.community.description}
              </p>
            </div>
          </div>
        </div>
      </section>

      {showHomeFooterStrip && (
        <footer className="border-t border-border/40 bg-card/30 mt-auto">
          <div className="container mx-auto px-4 py-10 max-w-2xl text-center space-y-4">
            <nav aria-label="Policies" className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-sm">
              <Link href="/help" className="text-muted-foreground hover:text-foreground underline underline-offset-2 transition-colors">
                Help &amp; policies
              </Link>
              <span className="text-muted-foreground/40 hidden sm:inline">·</span>
              <FeedbackDialog />
            </nav>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Subtext is in public beta—warnings are automated with human review in progress. Use your own judgment and tell us if something looks off.
            </p>
          </div>
        </footer>
      )}
    </main>
  )
}
