import Link from "next/link"
import Image from "next/image"
import { BookSpineLogo } from "@/components/book-spine-logo"
import { WaitlistForm } from "@/components/waitlist-form"
import { BookOpen, Shield, Users, ScanBarcode, ListChecks, CheckCircle2, Sparkles, ChevronDown } from "lucide-react"
import { supabaseAdmin } from "@/lib/supabase/admin"

const SSS_LABELS: Record<string, { label: string; color: string }> = {
  S1_GENTLE: { label: "S1 — Gentle", color: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300" },
  S2_MILD: { label: "S2 — Mild", color: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300" },
  S3_MODERATE: { label: "S3 — Moderate", color: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300" },
  S4_INTENSE: { label: "S4 — Intense", color: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300" },
}

const SEVERITY_COLORS: Record<string, string> = {
  severe: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
  moderate: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
  mild: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
}

/** Fetch a random book with 3+ warnings to showcase on the homepage */
async function getFeaturedBook() {
  try {
    // Get books that have at least 3 warnings and a cover image
    const { data: books } = await supabaseAdmin
      .from('books')
      .select('id, title, author, cover_url, sss_level')
      .not('title', 'is', null)
      .not('author', 'is', null)
      .not('sss_level', 'is', null)
      .not('cover_url', 'is', null)

    if (!books || books.length === 0) return null

    // Pick a random book, then check it has enough warnings
    const shuffled = books.sort(() => Math.random() - 0.5)

    for (const book of shuffled) {
      const { data: warnings } = await supabaseAdmin
        .from('content_warnings')
        .select('category, subcategory_id, severity, description')
        .eq('book_id', book.id)
        .order('severity', { ascending: true }) // severe first (alphabetical: mild > moderate > severe... we'll sort manually)
        .limit(5)

      if (warnings && warnings.length >= 3) {
        // Sort: severe first, then moderate, then mild
        const sorted = warnings.sort((a, b) => {
          const order = { severe: 0, moderate: 1, mild: 2 }
          return (order[a.severity as keyof typeof order] ?? 3) - (order[b.severity as keyof typeof order] ?? 3)
        })

        return {
          title: book.title,
          author: book.author,
          cover_url: book.cover_url,
          sss_level: book.sss_level,
          warnings: sorted.slice(0, 4), // Show up to 4
        }
      }
    }

    return null
  } catch {
    return null
  }
}

/** Format subcategory_id into a readable label */
function formatWarningLabel(subcategory: string | null, category: string): string {
  if (subcategory) {
    return subcategory
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase())
  }
  return category.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

export default async function HomePage() {
  const featured = await getFeaturedBook()

  return (
    <main className="min-h-screen bg-background flex flex-col">
      {/* Hero — 2 column: signup left, live book preview right */}
      <section className="relative px-6 md:px-10 min-h-screen flex flex-col items-center justify-center">
        <div className="container max-w-7xl mx-auto grid md:grid-cols-2 gap-10 md:gap-16 items-center">
          {/* Left: Branding + copy + waitlist form */}
          <div className="flex flex-col items-center text-center space-y-6">
            <div className="flex items-center gap-3">
              <BookSpineLogo className="h-14 w-14 md:h-16 md:w-16 text-foreground" />
              <span
                className="text-3xl md:text-4xl font-serif font-normal tracking-tight text-foreground"
                style={{ fontFamily: "var(--font-serif)" }}
              >
                Subtext
              </span>
              <span className="inline-flex items-center rounded-full border border-border bg-muted/60 px-2.5 py-0.5 text-[10px] font-medium text-muted-foreground tracking-wide uppercase">
                Beta
              </span>
            </div>

            <h1 className="font-serif text-2xl md:text-3xl font-medium tracking-tight text-foreground leading-snug">
              Know what&apos;s really in a book before you assign, recommend, or buy it.
            </h1>

            <p className="text-base text-muted-foreground">
              Content warnings? Clear. Age guidance? Sorted. Context notes? Covered.
            </p>

            <p className="text-sm font-medium text-foreground/70">
              Be the first in when we open the doors.
            </p>

            <div className="w-full">
              <WaitlistForm />
            </div>

            <p className="text-sm text-muted-foreground">
              Already have an invite?{" "}
              <Link href="/login" className="text-foreground underline underline-offset-4 hover:text-primary transition-colors">
                Log in
              </Link>
            </p>
          </div>

          {/* Right: Live book preview */}
          <div className="flex flex-col items-center md:items-end">
            <div className="rounded-xl border border-border bg-card shadow-lg overflow-hidden w-full">
              {/* App header bar */}
              <div className="bg-muted/50 border-b border-border px-5 py-2.5 flex items-center gap-2">
                <BookSpineLogo className="h-5 w-5 text-foreground/70" />
                <span className="text-xs font-medium text-foreground/70" style={{ fontFamily: "var(--font-serif)" }}>Subtext</span>
                <span className="ml-auto text-[10px] text-muted-foreground/60 font-mono">LIVE</span>
              </div>

              {/* Scan result */}
              <div className="p-5">
                {featured ? (
                  <div className="space-y-4">
                    {/* Cover + info */}
                    <div className="flex gap-4">
                      <div className="w-28 h-40 rounded-lg bg-muted/60 border border-border/50 overflow-hidden shadow-md shrink-0">
                        {featured.cover_url ? (
                          <Image
                            src={featured.cover_url}
                            alt={featured.title}
                            width={112}
                            height={160}
                            className="w-full h-full object-cover"
                            unoptimized
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <BookOpen className="h-8 w-8 text-muted-foreground/40" strokeWidth={1} />
                          </div>
                        )}
                      </div>
                      <div className="space-y-1.5 text-left min-w-0 pt-1">
                        <p className="text-base font-semibold text-foreground leading-tight">{featured.title}</p>
                        <p className="text-sm text-muted-foreground">{featured.author}</p>
                        {featured.sss_level && SSS_LABELS[featured.sss_level] && (
                          <span className={`inline-block mt-2 text-xs font-medium px-2.5 py-1 rounded-full ${SSS_LABELS[featured.sss_level].color}`}>
                            {SSS_LABELS[featured.sss_level].label}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Warnings */}
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-foreground/70 uppercase tracking-wider">Content Warnings</p>
                      {featured.warnings.map((w, i) => (
                        <div key={i} className="flex items-center justify-between text-sm px-3 py-2.5 rounded-lg bg-muted/40 border border-border/40">
                          <span className="text-foreground/90 truncate mr-3">{formatWarningLabel(w.subcategory_id, w.category)}</span>
                          <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full shrink-0 ${SEVERITY_COLORS[w.severity] || ""}`}>
                            {w.severity}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Context */}
                    {featured.warnings[0]?.description && (
                      <div className="text-sm text-muted-foreground bg-muted/30 rounded-lg px-3 py-2.5 border border-border/30 text-left leading-relaxed">
                        <span className="font-medium text-foreground/70">Context:</span>{" "}
                        {featured.warnings[0].description}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="py-12 text-center">
                    <BookOpen className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" strokeWidth={1} />
                    <p className="text-sm text-muted-foreground">Scan any book to see warnings like this.</p>
                  </div>
                )}
              </div>
            </div>

            <p className="text-xs text-muted-foreground text-center mt-3 italic">
              {featured
                ? `Real result — different book on each visit.`
                : "Real analysis takes 15–90 seconds."}
            </p>
          </div>
        </div>

        {/* Scroll indicator — hidden on mobile where content stacks, visible on desktop */}
        <div className="hidden md:flex absolute bottom-6 left-1/2 -translate-x-1/2 flex-col items-center gap-1 animate-pulse">
          <span className="text-[10px] text-muted-foreground/50 tracking-wide uppercase">Learn more</span>
          <ChevronDown className="h-4 w-4 text-muted-foreground/40" />
        </div>
      </section>

      {/* How it Works — visual steps */}
      <section className="border-t border-border/50 bg-muted/30 py-12 px-4">
        <div className="container max-w-4xl mx-auto">
          <h2 className="text-lg font-semibold text-foreground text-center mb-6">How It Works</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                step: "1",
                icon: ScanBarcode,
                title: "Scan or Search",
                body: "Enter an ISBN, scan a barcode, or search by title. We handle the rest.",
              },
              {
                step: "2",
                icon: ListChecks,
                title: "Get Clear Warnings",
                body: "AI analyses the book and returns content warnings with severity, context, and reasoning.",
              },
              {
                step: "3",
                icon: CheckCircle2,
                title: "Decide with Confidence",
                body: "Assign it, recommend it, buy it, or skip it — now you know what\u2019s really inside.",
              },
            ].map((item) => (
              <div key={item.step} className="relative rounded-lg border border-border bg-card p-6 shadow-sm text-center space-y-3">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 h-6 w-6 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center">
                  {item.step}
                </div>
                <div className="flex items-center justify-center h-12 w-12 rounded-full bg-primary/10 mx-auto mt-2">
                  <item.icon className="h-5 w-5 text-primary" strokeWidth={1.5} />
                </div>
                <h3 className="font-medium text-foreground text-sm">{item.title}</h3>
                <p className="text-[15px] text-muted-foreground leading-relaxed">{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Subtext? — value prop cards */}
      <section className="border-t border-border/50 py-12 px-4">
        <div className="container max-w-4xl mx-auto">
          <h2 className="text-lg font-semibold text-foreground text-center mb-6">Why Subtext?</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: Sparkles,
                title: "60-Second Suitability Check",
                body: "Scan any title and get clear content warnings, age guidance, and context \u2014 fast enough for real decisions.",
              },
              {
                icon: Shield,
                title: "Transparent, Not Prescriptive",
                body: "Every warning includes a reason. We inform your judgment \u2014 we never replace it.",
              },
              {
                icon: Users,
                title: "Built for the People Who Care",
                body: "Teachers vetting class reads. Parents navigating BookTok. Librarians making shelf decisions.",
              },
            ].map((item) => (
              <div key={item.title} className="rounded-lg border border-border bg-card p-6 shadow-sm text-center space-y-3">
                <div className="flex items-center justify-center h-12 w-12 rounded-full bg-primary/10 mx-auto">
                  <item.icon className="h-5 w-5 text-primary" strokeWidth={1.5} />
                </div>
                <h3 className="font-medium text-foreground text-sm">{item.title}</h3>
                <p className="text-[15px] text-muted-foreground leading-relaxed">{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust strip */}
      <section className="border-t border-border/50 bg-muted/30 py-6 px-4">
        <div className="container max-w-3xl mx-auto">
          <div className="flex flex-wrap justify-center gap-x-8 gap-y-3 text-sm text-muted-foreground">
            {[
              "Privacy-first",
              "No account required",
              "Transparent methodology",
              "AI + human review",
            ].map((item) => (
              <span key={item} className="flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-primary/70 shrink-0" />
                {item}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Branded tagline footer */}
      <section className="py-8 px-4 text-center">
        <p className="text-base text-muted-foreground">
          Read informed. Recommend confidently. That&apos;s{" "}
          <span className="font-serif italic font-medium text-foreground" style={{ fontFamily: "var(--font-serif)" }}>
            Subtext
          </span>.
        </p>
      </section>
    </main>
  )
}
