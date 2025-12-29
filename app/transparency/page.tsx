import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight, BookOpen, Search, Sparkles, CheckCircle, Shield, ExternalLink } from "lucide-react"

export default function TransparencyPage() {
  return (
    <main className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-16 max-w-4xl">
        {/* Header */}
        <div className="mb-16 text-center">
          <h1 className="font-serif text-4xl md:text-5xl font-medium tracking-tight text-foreground mb-4">
            How We Work
          </h1>
          <p className="text-lg text-muted-foreground font-serif italic max-w-2xl mx-auto">
            Transparency is fundamental to how we analyze books and generate content warnings.
          </p>
        </div>

        {/* Process Flow */}
        <div className="mb-20">
          <h2 className="font-serif text-2xl text-foreground mb-8 text-center">Our Process</h2>
          
          <div className="space-y-8">
            {/* Step 1 */}
            <div className="flex gap-6 items-start">
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                <BookOpen className="h-6 w-6 text-muted-foreground" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-foreground mb-2 uppercase tracking-wider text-sm">Book Identification</h3>
                <p className="text-muted-foreground leading-relaxed">
                  We start with an ISBN or barcode scan. Our system fetches book metadata from multiple trusted sources—including Open Library and Google Books—to ensure comprehensive information.
                </p>
              </div>
            </div>

            {/* Arrow */}
            <div className="flex justify-center">
              <ArrowRight className="h-6 w-6 text-muted-foreground/50" />
            </div>

            {/* Step 2 */}
            <div className="flex gap-6 items-start">
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                <Search className="h-6 w-6 text-muted-foreground" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-foreground mb-2 uppercase tracking-wider text-sm">Deep Research</h3>
                <p className="text-muted-foreground leading-relaxed">
                  When book descriptions are limited, we search book databases and use search engines to find author-provided content warnings. We prioritize official author-provided content warnings above all other sources when we can verify them.
                </p>
              </div>
            </div>

            {/* Arrow */}
            <div className="flex justify-center">
              <ArrowRight className="h-6 w-6 text-muted-foreground/50" />
            </div>

            {/* Step 3 */}
            <div className="flex gap-6 items-start">
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                <Sparkles className="h-6 w-6 text-muted-foreground" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-foreground mb-2 uppercase tracking-wider text-sm">AI Analysis</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Our AI analyzes the book's content using established content warning taxonomies. For each potential warning, it assigns a severity score and provides detailed reasoning. Every analysis includes source citations so you can verify the information yourself.
                </p>
              </div>
            </div>

            {/* Arrow */}
            <div className="flex justify-center">
              <ArrowRight className="h-6 w-6 text-muted-foreground/50" />
            </div>

            {/* Step 4 */}
            <div className="flex gap-6 items-start">
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-muted-foreground" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-foreground mb-2 uppercase tracking-wider text-sm">Verification & Prioritization</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Author-provided warnings are always displayed first and treated as the highest authority. AI-generated warnings use information from multiple sources, and community feedback helps refine accuracy over time.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Visual Flow Diagram */}
        <div className="mb-20 border-t-2 border-border pt-12">
          <h2 className="font-serif text-2xl text-foreground mb-8 text-center">The Flow</h2>
          <div className="relative">
            {/* Simple flow diagram */}
            <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-8">
              <div className="flex flex-col items-center">
                <div className="w-20 h-20 rounded-lg bg-muted flex items-center justify-center mb-3">
                  <BookOpen className="h-10 w-10 text-muted-foreground" />
                </div>
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">ISBN Scan</p>
              </div>
              
              <ArrowRight className="h-6 w-6 text-muted-foreground/50 rotate-90 md:rotate-0" />
              
              <div className="flex flex-col items-center">
                <div className="w-20 h-20 rounded-lg bg-muted flex items-center justify-center mb-3">
                  <Search className="h-10 w-10 text-muted-foreground" />
                </div>
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Research</p>
              </div>
              
              <ArrowRight className="h-6 w-6 text-muted-foreground/50 rotate-90 md:rotate-0" />
              
              <div className="flex flex-col items-center">
                <div className="w-20 h-20 rounded-lg bg-muted flex items-center justify-center mb-3">
                  <Sparkles className="h-10 w-10 text-muted-foreground" />
                </div>
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Analysis</p>
              </div>
              
              <ArrowRight className="h-6 w-6 text-muted-foreground/50 rotate-90 md:rotate-0" />
              
              <div className="flex flex-col items-center">
                <div className="w-20 h-20 rounded-lg bg-muted flex items-center justify-center mb-3">
                  <Shield className="h-10 w-10 text-muted-foreground" />
                </div>
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Warnings</p>
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
                AI-generated warnings include detailed reasoning; author warnings include source URLs. You can see exactly where information came from and how it was analyzed.
              </p>
            </div>
            
            <div className="space-y-3">
              <h3 className="font-bold text-foreground uppercase tracking-wider text-sm">Author Authority</h3>
              <p className="text-muted-foreground leading-relaxed text-sm">
                When authors provide their own content notes, we prioritize those above all other sources. They know their work best.
              </p>
            </div>
            
            <div className="space-y-3">
              <h3 className="font-bold text-foreground uppercase tracking-wider text-sm">Multiple Verification</h3>
              <p className="text-muted-foreground leading-relaxed text-sm">
                We gather information from multiple sources (Google Books, Apple Books, author sites, book databases) and use community feedback to refine accuracy over time.
              </p>
            </div>
            
            <div className="space-y-3">
              <h3 className="font-bold text-foreground uppercase tracking-wider text-sm">Subjective Severity</h3>
              <p className="text-muted-foreground leading-relaxed text-sm">
                Severity ratings are subjective—they vary by individual sensitivity and the nature of the content. We provide guidance, not absolutes.
              </p>
            </div>
          </div>
        </div>

        {/* What We Don't Share */}
        <div className="mb-12 border-t-2 border-border pt-12">
          <h2 className="font-serif text-2xl text-foreground mb-6 text-center">What You Can Verify</h2>
          <div className="bg-card p-8 rounded-lg">
            <p className="text-muted-foreground leading-relaxed mb-4">
              For every book, you can see:
            </p>
            <ul className="space-y-2 text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="text-muted-foreground/70 mt-1">•</span>
                <span>The source of each warning (author site, publisher page, book database, etc.)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-muted-foreground/70 mt-1">•</span>
                <span>The AI's reasoning for each severity rating</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-muted-foreground/70 mt-1">•</span>
                <span>Which warnings came from authors versus AI analysis</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-muted-foreground/70 mt-1">•</span>
                <span>Community feedback on warning accuracy</span>
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

