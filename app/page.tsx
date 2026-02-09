import { Shield, Brain, Zap, CheckCircle2 } from "lucide-react"
import Link from "next/link"
import { Suspense } from "react"
import { BookSpineLogo } from "@/components/book-spine-logo"
import { RecentScans } from "@/components/recent-scans"
import { SearchComponent } from "@/components/search"
import { ReferralWelcomeModalWrapper } from "@/components/referral-welcome-modal-wrapper"
import { homepageCopy } from "@/lib/config/homepage-copy"
import { Button } from "@/components/ui/button"

export default function HomePage() {
  const { hero, problem, solution, trust, howItWorks, proof, faq, finalCta } = homepageCopy

  return (
    <main className="min-h-screen bg-background flex flex-col">
      <Suspense fallback={null}>
        <ReferralWelcomeModalWrapper />
      </Suspense>

      {/* Hero */}
      <section className="flex-1 flex flex-col items-center justify-center px-4 py-24 md:py-32 text-center">
        <div className="w-full max-w-3xl mx-auto space-y-6 flex flex-col items-center">
          <div className="mb-4">
            <BookSpineLogo className="h-40 w-40 md:h-56 md:w-56 text-foreground" />
          </div>
          <span className="text-3xl md:text-4xl font-serif font-normal tracking-tight text-foreground" style={{ fontFamily: "var(--font-serif)" }}>
            Subtext
          </span>
          <h1 className="font-serif text-2xl md:text-3xl font-bold tracking-tight text-foreground max-w-2xl">
            {hero.headline}
          </h1>
          <p className="text-base md:text-lg text-muted-foreground max-w-xl">
            {hero.subhead}
          </p>
          <div className="relative z-10 w-full max-w-2xl pt-2 pb-2">
            <Suspense>
              <SearchComponent className="w-full max-w-full h-auto text-lg [&_input]:h-12 [&_input]:text-base [&_input]:px-10 [&_svg]:h-5 [&_svg]:w-5 [&_svg]:left-4 [&_input]:!bg-white" />
            </Suspense>
          </div>
          <div className="flex flex-wrap gap-3 justify-center">
            <Button asChild size="lg">
              <Link href="/scan">{hero.ctaPrimary}</Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/book/9780141036144">{hero.ctaSecondary}</Link>
            </Button>
          </div>
          <p className="text-sm text-muted-foreground max-w-md">
            {hero.microcopy}
          </p>
        </div>
      </section>

      {/* Problem */}
      <section className="border-t border-border/50 bg-muted/30 py-16 px-4">
        <div className="container max-w-3xl mx-auto text-center">
          <h2 className="text-xl font-semibold text-foreground mb-10">{problem.title}</h2>
          <ul className="space-y-8 text-left">
            {problem.points.map((p, i) => (
              <li key={i}>
                <h3 className="font-medium text-foreground">{p.title}</h3>
                <p className="text-muted-foreground text-sm mt-1">{p.body}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Recent Scans */}
      <RecentScans />

      {/* Solution */}
      <section className="border-t border-border/50 bg-card/30 py-16 px-4">
        <div className="container max-w-4xl mx-auto">
          <h2 className="text-xl font-semibold text-foreground text-center mb-10">{solution.title}</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {solution.items.map((item, i) => (
              <div key={i} className="flex flex-col items-center gap-2 text-center">
                {i === 0 && <Zap className="h-8 w-8 text-foreground/90 stroke-[1.5]" />}
                {i === 1 && <Brain className="h-8 w-8 text-foreground/90 stroke-[1.5]" />}
                {i === 2 && <Shield className="h-8 w-8 text-foreground/90 stroke-[1.5]" />}
                <h3 className="font-medium text-foreground">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust strip */}
      <section className="border-t border-border/50 py-12 px-4">
        <div className="container max-w-3xl mx-auto">
          <ul className="flex flex-wrap justify-center gap-6 text-sm text-muted-foreground">
            {trust.badges.map((badge, i) => (
              <li key={i} className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-foreground/70 shrink-0" />
                {badge}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* How it works */}
      <section className="border-t border-border/50 bg-muted/30 py-16 px-4">
        <div className="container max-w-2xl mx-auto text-center">
          <h2 className="text-xl font-semibold text-foreground mb-10">{howItWorks.title}</h2>
          <ol className="space-y-4 text-left list-decimal list-inside">
            {howItWorks.steps.map((step, i) => (
              <li key={i} className="text-foreground">{step}</li>
            ))}
          </ol>
        </div>
      </section>

      {/* Proof: Why people use Subtext */}
      <section className="border-t border-border/50 py-16 px-4">
        <div className="container max-w-4xl mx-auto">
          <h2 className="text-xl font-semibold text-foreground text-center mb-10">{proof.title}</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {proof.cards.map((card, i) => (
              <div key={i} className="rounded-lg border border-border bg-card p-5 text-center">
                <h3 className="font-medium text-foreground mb-2">{card.title}</h3>
                <p className="text-sm text-muted-foreground">{card.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="border-t border-border/50 bg-muted/30 py-16 px-4">
        <div className="container max-w-2xl mx-auto">
          <h2 className="text-xl font-semibold text-foreground text-center mb-10">{faq.title}</h2>
          <dl className="space-y-6">
            {faq.items.map((item, i) => (
              <div key={i}>
                <dt className="font-medium text-foreground">{item.q}</dt>
                <dd className="mt-1 text-sm text-muted-foreground">{item.a}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* Final CTA */}
      <section className="border-t border-border/50 py-16 px-4">
        <div className="container max-w-xl mx-auto text-center space-y-4">
          <p className="text-lg font-medium text-foreground">{finalCta.prompt}</p>
          <Button asChild size="lg">
            <Link href="/scan">{finalCta.cta}</Link>
          </Button>
          <p className="text-sm text-muted-foreground">{finalCta.tagline}</p>
        </div>
      </section>
    </main>
  )
}
