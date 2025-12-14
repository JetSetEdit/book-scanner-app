import { BookOpen, Shield, Users, ScanBarcode, Search, AlertTriangle } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"

export default function HomePage() {
  return (
    <main className="min-h-screen bg-background flex flex-col">
      {/* Hero Section */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-24 md:py-32 text-center">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="flex flex-col items-center justify-center mb-12">
            <div className="mb-6">
              <img src="/logo_var_2.png" alt="Subtext Logo" className="h-48 w-48 md:h-64 md:w-64 object-contain" />
            </div>
            <span className="text-5xl md:text-7xl font-serif font-normal tracking-tight text-foreground" style={{ fontFamily: 'var(--font-serif)' }}>Subtext</span>
          </div>

          <div className="inline-flex items-center rounded-full border border-border px-4 py-1.5 text-sm font-medium text-muted-foreground bg-card">
            <span className="flex h-2 w-2 rounded-full bg-emerald-500 mr-2"></span>
            v1.0 Now Available
          </div>

          <h1 className="font-serif text-4xl md:text-6xl font-bold tracking-tight text-foreground leading-[1.1]">
            The hidden context <br className="hidden md:block" />
            <span className="text-muted-foreground italic">of every story.</span>
          </h1>

          <p className="mx-auto max-w-2xl text-xl text-muted-foreground leading-relaxed font-light">
            Subtext analyzes books to reveal content warnings, age ratings, and thematic depth—so you can read with confidence. Scan a barcode or enter an ISBN to get started.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link href="/scan-test">
              <Button size="lg" className="h-14 px-8 text-lg rounded-full bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all hover:scale-105">
                <ScanBarcode className="mr-2 h-5 w-5" />
                Start Scanning
              </Button>
            </Link>
            <Link href="/collection">
              <Button size="lg" variant="outline" className="h-14 px-8 text-lg rounded-full border-border text-foreground hover:bg-accent hover:text-accent-foreground">
                <Search className="mr-2 h-5 w-5" />
                Browse Bookshelf
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Features Grid */}
      <div className="border-t border-border/50 bg-card/60">
        <div className="container mx-auto px-4 py-24">
          <div className="grid md:grid-cols-3 gap-12">
            <div className="space-y-4">
              <div className="h-12 w-12 rounded-full bg-amber-100/50 dark:bg-amber-900/30 flex items-center justify-center text-amber-700 dark:text-amber-400">
                <Shield className="h-6 w-6" />
              </div>
              <h3 className="font-serif text-2xl font-bold text-foreground">Content Warnings</h3>
              <p className="text-muted-foreground leading-relaxed">
                Detailed, AI-generated alerts for sensitive topics. We verify against author notes and community feedback for maximum accuracy.
              </p>
            </div>

            <div className="space-y-4">
              <div className="h-12 w-12 rounded-full bg-blue-100/50 dark:bg-blue-900/30 flex items-center justify-center text-blue-700 dark:text-blue-400">
                <Search className="h-6 w-6" />
              </div>
              <h3 className="font-serif text-2xl font-bold text-foreground">Deep Analysis</h3>
              <p className="text-muted-foreground leading-relaxed">
                Beyond just warnings. Understand the themes, tone, and emotional weight of a book before you commit to reading it.
              </p>
            </div>

            <div className="space-y-4">
              <div className="h-12 w-12 rounded-full bg-emerald-100/50 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-700 dark:text-emerald-400">
                <Users className="h-6 w-6" />
              </div>
              <h3 className="font-serif text-2xl font-bold text-foreground">Community Verified</h3>
              <p className="text-muted-foreground leading-relaxed">
                Real readers contribute to our database, ensuring that our AI's analysis is grounded in actual reading experiences.
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
