import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"

export const metadata = {
  title: 'Press | Subtext',
  description: 'Press kit and media resources for Subtext.',
}

const BASE_URL = 'https://www.subtextscanner.com.au'

export default function PressPage() {
  return (
    <main className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-16 max-w-4xl">
        {/* Header */}
        <div className="mb-12">
          <Link href="/help">
            <Button variant="ghost" className="mb-6 text-muted-foreground hover:text-foreground">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Knowledge base
            </Button>
          </Link>
          <h1 className="font-serif text-4xl md:text-5xl font-medium tracking-tight text-foreground mb-4">
            Press
          </h1>
          <p className="text-sm text-muted-foreground italic">
            Media resources and boilerplate for Subtext.
          </p>
        </div>

        {/* About */}
        <div className="space-y-8 text-muted-foreground leading-relaxed">
          <section>
            <h2 className="font-serif text-2xl text-foreground mb-4">About Subtext</h2>
            <p className="mb-4">
              Subtext is a book-scanning app that reveals content warnings and age guidance so readers can choose with confidence. Scan an ISBN or barcode to see sensitive themes, severity, and reasoning—no account required.
            </p>
            <p>
              Subtext analyses publicly available book descriptions and metadata to identify common sensitive themes (such as violence, abuse, or discrimination). It uses evidence-based automated analysis: warnings are tied to the specific book (no inference from author or genre), mapped to a fixed taxonomy, and severity is computed from signals—not guessed. Every warning includes detailed reasoning so you can understand how it was determined. Subtext does not store personal reading histories or profiles. We provide transparent content analysis with multiple verification layers; severity ratings are subjective and vary by individual sensitivity. Subtext is a tool for information, not a substitute for your own judgment.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-2xl text-foreground mb-4">Key Facts</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Evidence-based only</strong> — Warnings are based on verified information about the specific book (metadata, descriptions); we never infer from author reputation, genre, or similar books.</li>
              <li><strong>Taxonomy-based</strong> — All warnings map to a fixed set of categories and subcategories; the system cannot invent new ones.</li>
              <li><strong>Severity from signals</strong> — Mild/moderate/severe is computed from multiple signals (frequency, explicitness, centrality), not from a single model&apos;s opinion.</li>
              <li><strong>Multi-source metadata</strong> — Book information from Google Books, Open Library, with web search when descriptions are limited.</li>
              <li><strong>No personal reading history</strong> — We do not store what you scan or build profiles.</li>
              <li><strong>Australian Classification Board–aligned</strong> — Age ratings (G, PG, M, MA15+, R18+) and content descriptors align with ACB standards.</li>
              <li><strong>Informational, not judgmental</strong> — Content warnings help readers make informed choices; they are not judgments about books or readers.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-serif text-2xl text-foreground mb-4">Logo &amp; Assets</h2>
            <p className="mb-4 text-sm">Use the logo on light or dark backgrounds; do not distort or change colors.</p>
            <ul className="space-y-2">
              <li><a href="/logo.png" download className="text-primary hover:underline underline-offset-2">Logo (PNG)</a></li>
              <li><a href="/logo-lockup.png" download className="text-primary hover:underline underline-offset-2">Logo lockup (PNG)</a></li>
              <li><a href="/logo_var_2.png" download className="text-primary hover:underline underline-offset-2">Logo variant 2 (PNG)</a></li>
              <li><a href="/logo_variant.jpeg" download className="text-primary hover:underline underline-offset-2">Logo variant (JPEG)</a></li>
              <li><a href="/icon-512.png" download className="text-primary hover:underline underline-offset-2">Icon 512px (PNG)</a></li>
              <li className="pt-2">Marketing slides: <a href="/marketing/slide-01.png" download className="text-primary hover:underline underline-offset-2">1</a>, <a href="/marketing/slide-02.png" download className="text-primary hover:underline underline-offset-2">2</a>, <a href="/marketing/slide-03.png" download className="text-primary hover:underline underline-offset-2">3</a>, <a href="/marketing/slide-04.png" download className="text-primary hover:underline underline-offset-2">4</a>, <a href="/marketing/slide-05.png" download className="text-primary hover:underline underline-offset-2">5</a>, <a href="/marketing/slide-06.png" download className="text-primary hover:underline underline-offset-2">6</a>, <a href="/marketing/slide-07.png" download className="text-primary hover:underline underline-offset-2">7</a>, <a href="/marketing/slide-08.png" download className="text-primary hover:underline underline-offset-2">8</a>, <a href="/marketing/slide-09.png" download className="text-primary hover:underline underline-offset-2">9</a>, <a href="/marketing/slide-10.png" download className="text-primary hover:underline underline-offset-2">10</a>, <a href="/marketing/slide-11.png" download className="text-primary hover:underline underline-offset-2">11</a>, <a href="/marketing/slide-12.png" download className="text-primary hover:underline underline-offset-2">12</a></li>
            </ul>
          </section>

          <section>
            <h2 className="font-serif text-2xl text-foreground mb-4">Links</h2>
            <ul className="space-y-2">
              <li><a href={BASE_URL} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline underline-offset-2">App — {BASE_URL}</a></li>
              <li><Link href="/transparency" className="text-primary hover:underline underline-offset-2">Transparency (how we work)</Link></li>
              <li><Link href="/privacy" className="text-primary hover:underline underline-offset-2">Privacy Policy</Link></li>
              <li><Link href="/terms" className="text-primary hover:underline underline-offset-2">Terms of Service</Link></li>
              <li><Link href="/press" className="text-primary hover:underline underline-offset-2">Press kit (this page)</Link></li>
            </ul>
          </section>

          <section>
            <h2 className="font-serif text-2xl text-foreground mb-4">Press contact</h2>
            <p>
              For press and media inquiries: <a href="mailto:social@subtextscanner.com.au" className="text-primary hover:underline underline-offset-2">social@subtextscanner.com.au</a>
            </p>
          </section>

          <p className="text-xs text-muted-foreground/80 pt-8 border-t border-border">
            Part of our <Link href="/help" className="text-primary hover:underline underline-offset-2">knowledge base</Link>. Full press kit (markdown) is in the repo at <code className="bg-muted px-1 rounded">docs/PRESS_KIT.md</code>.
          </p>
        </div>
      </div>
    </main>
  )
}
