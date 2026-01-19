import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight, BookOpen, Search, Sparkles, CheckCircle, Shield, ExternalLink, CheckCircle2, Clock, Users } from "lucide-react"
import { getVariantConfig } from "@/lib/config/variants"

export default function TransparencyPage() {
  const v = getVariantConfig()
  return (
    <main className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-16 max-w-4xl">
        {/* Header */}
        <div className="mb-16 text-center">
          <h1 className="font-serif text-4xl md:text-5xl font-medium tracking-tight text-foreground mb-4">
            Our Roadmap
          </h1>
          <p className="text-lg text-muted-foreground font-serif italic max-w-2xl mx-auto">
            Transparency is fundamental to how we analyze books. Here's what's available now and what's coming next.
          </p>
        </div>

        {/* How Subtext Works — plain-language, non-AI-framed */}
        <div className="mb-20 bg-card border border-border rounded-lg p-6">
          <h2 className="font-serif text-xl text-foreground mb-4">How Subtext Works</h2>
          <p className="text-muted-foreground leading-relaxed mb-3">
            Subtext analyses publicly available book text and metadata to identify common sensitive themes (such as violence, abuse, or discrimination).
          </p>
          <p className="text-muted-foreground leading-relaxed mb-3">
            It uses automated language analysis to surface patterns and provides severity and age guidance to help readers make informed choices.
          </p>
          <p className="text-muted-foreground leading-relaxed">
            Subtext does not store personal reading histories or profiles.
          </p>
        </div>

        {/* Roadmap: Phase 1 - Available Now */}
        <div className="mb-20">
          <div className="flex items-center gap-3 mb-8">
            <CheckCircle2 className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
            <h2 className="font-serif text-2xl text-foreground">Phase 1: Available Now</h2>
          </div>
          
          <div className="space-y-6">
            <div className="bg-card border border-border rounded-lg p-6">
              <div className="flex gap-4 items-start mb-3">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-emerald-100/50 dark:bg-emerald-900/30 flex items-center justify-center">
                  <Shield className="h-5 w-5 text-emerald-700 dark:text-emerald-400" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-foreground mb-2">{v.wording.analysisSourceTitleCase} Content Warnings</h3>
                  <p className="text-muted-foreground leading-relaxed text-sm">
                    Detailed, {v.wording.analysisSource} alerts for sensitive topics with severity ratings (mild, moderate, severe) and comprehensive reasoning. Every warning includes detailed explanations of how it was determined.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-card border border-border rounded-lg p-6">
              <div className="flex gap-4 items-start mb-3">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-100/50 dark:bg-blue-900/30 flex items-center justify-center">
                  <Sparkles className="h-5 w-5 text-blue-700 dark:text-blue-400" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-foreground mb-2">Age Ratings</h3>
                  <p className="text-muted-foreground leading-relaxed text-sm">
                    Australian Classification Board-based age ratings (G, PG, M, MA15+, R18+) with clear age recommendations and methodology explanations.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-card border border-border rounded-lg p-6">
              <div className="flex gap-4 items-start mb-3">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-purple-100/50 dark:bg-purple-900/30 flex items-center justify-center">
                  <BookOpen className="h-5 w-5 text-purple-700 dark:text-purple-400" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-foreground mb-2">Thematic Analysis</h3>
                  <p className="text-muted-foreground leading-relaxed text-sm">
                    Deep analysis of themes, tone, and emotional weight. Understand what a book explores beyond just content warnings.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-card border border-border rounded-lg p-6">
              <div className="flex gap-4 items-start mb-3">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-amber-100/50 dark:bg-amber-900/30 flex items-center justify-center">
                  <Search className="h-5 w-5 text-amber-700 dark:text-amber-400" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-foreground mb-2">Multi-Source Metadata</h3>
                  <p className="text-muted-foreground leading-relaxed text-sm">
                    Book information gathered from multiple trusted sources (Google Books, Open Library) with web search enrichment when descriptions are limited.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Roadmap: Phase 2 - Coming Next */}
        <div className="mb-20 border-t-2 border-border pt-12">
          <div className="flex items-center gap-3 mb-8">
            <Clock className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            <h2 className="font-serif text-2xl text-foreground">Phase 2: Coming Next</h2>
          </div>
          
          <div className="space-y-6">
            <div className="bg-muted/30 border border-border rounded-lg p-6 opacity-90">
              <div className="flex gap-4 items-start mb-3">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-100/50 dark:bg-blue-900/30 flex items-center justify-center opacity-70">
                  <ExternalLink className="h-5 w-5 text-blue-700 dark:text-blue-400" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-bold text-foreground">Source Citations</h3>
                    <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground border border-border">
                      Coming Soon
                    </span>
                  </div>
                  <p className="text-muted-foreground leading-relaxed text-sm">
                    Every warning will include source URLs so you can verify exactly where information came from—author sites, publisher pages, book databases, or community sources.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-muted/30 border border-border rounded-lg p-6 opacity-90">
              <div className="flex gap-4 items-start mb-3">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-emerald-100/50 dark:bg-emerald-900/30 flex items-center justify-center opacity-70">
                  <CheckCircle className="h-5 w-5 text-emerald-700 dark:text-emerald-400" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-bold text-foreground">Author-Verified Warnings</h3>
                    <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground border border-border">
                      Coming Soon
                    </span>
                  </div>
                  <p className="text-muted-foreground leading-relaxed text-sm">
                    When authors provide their own content notes, we'll prioritize those above all other sources. Author-verified warnings will be clearly marked and displayed first.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-muted/30 border border-border rounded-lg p-6 opacity-90">
              <div className="flex gap-4 items-start mb-3">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-purple-100/50 dark:bg-purple-900/30 flex items-center justify-center opacity-70">
                  <Users className="h-5 w-5 text-purple-700 dark:text-purple-400" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-bold text-foreground">Community Feedback</h3>
                    <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground border border-border">
                      Coming Soon
                    </span>
                  </div>
                  <p className="text-muted-foreground leading-relaxed text-sm">
                    Rate warnings as helpful or not helpful. Community feedback will help refine accuracy over time and surface the most reliable information.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Key Principles */}
        <div className="mb-20 border-t-2 border-border pt-12">
          <h2 className="font-serif text-2xl text-foreground mb-8 text-center">Our Principles</h2>
          
          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-3">
              <h3 className="font-bold text-foreground uppercase tracking-wider text-sm">Transparency First</h3>
              <p className="text-muted-foreground leading-relaxed text-sm">
                {v.wording.analysisSourceTitleCase} warnings include detailed reasoning so you can understand how each warning was determined. Source URLs coming in Phase 2.
              </p>
            </div>
            
            <div className="space-y-3">
              <h3 className="font-bold text-foreground uppercase tracking-wider text-sm">Author Authority</h3>
              <p className="text-muted-foreground leading-relaxed text-sm">
                When authors provide their own content notes (Phase 2), we'll prioritize those above all other sources. They know their work best.
              </p>
            </div>
            
            <div className="space-y-3">
              <h3 className="font-bold text-foreground uppercase tracking-wider text-sm">Multiple Verification</h3>
              <p className="text-muted-foreground leading-relaxed text-sm">
                We gather information from multiple sources (Google Books, Open Library, book databases). Community feedback in Phase 2 will help refine accuracy over time.
              </p>
            </div>
            
            <div className="space-y-3">
              <h3 className="font-bold text-foreground uppercase tracking-wider text-sm">Subjective Severity</h3>
              <p className="text-muted-foreground leading-relaxed text-sm">
                Severity ratings are subjective—they vary by individual sensitivity and the nature of the content. We provide guidance, not absolutes.
              </p>
            </div>

            <div className="space-y-3">
              <h3 className="font-bold text-foreground uppercase tracking-wider text-sm">User Privacy</h3>
              <p className="text-muted-foreground leading-relaxed text-sm">
                We don't sell your reading data. Your scans are anonymous, and we don't train models on individual user preferences.
              </p>
            </div>
          </div>
        </div>

        {/* What You Can Verify Now */}
        <div className="mb-12 border-t-2 border-border pt-12">
          <h2 className="font-serif text-2xl text-foreground mb-6 text-center">What You Can Verify Now</h2>
          <div className="bg-card p-8 rounded-lg border border-border">
            <p className="text-muted-foreground leading-relaxed mb-4">
              For every book, you can currently see:
            </p>
            <ul className="space-y-3 text-muted-foreground">
              <li className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400 mt-0.5 flex-shrink-0" />
                <span>{v.wording.reasoningSubject} detailed reasoning for each severity rating</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400 mt-0.5 flex-shrink-0" />
                <span>How severity is calculated based on frequency, explicitness, proximity, and context</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400 mt-0.5 flex-shrink-0" />
                <span>Age ratings with methodology explanations</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400 mt-0.5 flex-shrink-0" />
                <span>Thematic analysis and emotional weight assessments</span>
              </li>
            </ul>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center border-t-2 border-border pt-12">
          <p className="text-muted-foreground mb-6 font-serif italic">
            Ready to explore books with confidence?
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/scan">
              <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
                Start Scanning
              </Button>
            </Link>
            <Link href="/collection">
              <Button variant="outline" className="border-border">
                Browse Bookshelf
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </main>
  )
}

