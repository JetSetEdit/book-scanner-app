import { cookies } from 'next/headers'
import { Shield, Users, ScanBarcode, Search, Brain } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { BookSpineLogo } from "@/components/book-spine-logo"
import { RecentScans } from "@/components/recent-scans"
import { getVariantConfig } from "@/lib/config/variants"
import { HomepageGate } from "@/components/homepage-gate"

export default async function HomePage() {
  const cookieStore = await cookies()
  const hasAccess = cookieStore.has('subtext_vip') || cookieStore.has('subtext_access_granted')

  if (!hasAccess) {
    return <HomepageGate />
  }

  const v = getVariantConfig()
  return (
    <main className="min-h-screen bg-background flex flex-col">
      {/* Hero Section */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-24 md:py-32 text-center">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="flex flex-col items-center justify-center mb-12">
            <div className="mb-6">
              <BookSpineLogo className="h-48 w-48 md:h-64 md:w-64 text-foreground" />
            </div>
            <span className="text-5xl md:text-7xl font-serif font-normal tracking-tight text-foreground" style={{ fontFamily: 'var(--font-serif)' }}>{v.name}</span>
          </div>

          <h1 className="font-serif text-4xl md:text-6xl font-bold tracking-tight text-foreground leading-[1.1]">
            {v.homepage.headline} <br className="hidden md:block" />
            <span className="text-muted-foreground italic">{v.homepage.headlineItalic}</span>
          </h1>

          <p className="mx-auto max-w-2xl text-xl text-muted-foreground leading-relaxed font-light">
            {v.homepage.subhead}
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link href="/scan">
              <Button size="lg" className="h-14 px-8 text-lg rounded-full bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all hover:scale-105">
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
        </div>
      </div>

      {/* Recent Scans Section */}
      <RecentScans />

      {/* Features Grid */}
      <div className="border-t border-border/50 bg-card/60">
        <div className="container mx-auto px-4 py-24">
          <div className="grid md:grid-cols-3 gap-12">
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
                <span className="inline-flex items-center rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground border border-border">
                  Coming Soon
                </span>
              </div>
              <div className="h-12 w-12 rounded-full bg-emerald-100/50 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-700 dark:text-emerald-400 opacity-60">
                <Users className="h-6 w-6" />
              </div>
              <h3 className="font-serif text-2xl font-bold text-foreground text-muted-foreground">{v.features.community.title}</h3>
              <p className="text-muted-foreground leading-relaxed">
                {v.features.community.description}
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
