import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"

export const metadata = {
  title: 'FAQ | Subtext',
  description: 'Common questions about AI, bias, content warnings, and privacy.',
}

export default function FAQPage() {
  return (
    <main className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-16 max-w-4xl">
        <div className="mb-12">
          <Link href="/help">
            <Button variant="ghost" className="mb-6 text-muted-foreground hover:text-foreground">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Knowledge base
            </Button>
          </Link>
          <h1 className="font-serif text-4xl md:text-5xl font-medium tracking-tight text-foreground mb-4">
            Frequently asked questions
          </h1>
          <p className="text-muted-foreground leading-relaxed">
            Common concerns about AI, content warnings, and how Subtext works.
          </p>
        </div>

        <div className="space-y-10 text-muted-foreground leading-relaxed">
          <section>
            <h2 className="font-serif text-2xl text-foreground mb-4">How Subtext uses AI</h2>
            <div className="space-y-6">
              <div>
                <h3 className="font-semibold text-foreground mb-2">How does Subtext use AI in the app?</h3>
                <p>When you search for a book or scan its barcode, Subtext looks up public information about that book (like publisher descriptions and subject tags). The AI then classifies potential content warnings into a fixed set of categories, estimates a severity level for each, and shows those warnings on the book&apos;s page so you can make an informed choice.</p>
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-2">What exactly does the AI see and analyze?</h3>
                <p>The AI only sees public book information such as titles, authors, publisher descriptions, subject headings, and classification data from catalogues and retailers. It does not see who you are, what you have read before, or anything else from your device or account.</p>
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-2">Do you use my data to train AI models?</h3>
                <p>No. We do not use your personal data or reading behavior to train our models. Our analyses are based on public book information and controlled internal testing data.</p>
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-2">Why might two similar books get different warnings or severities?</h3>
                <p>Warnings depend on the evidence available for each specific book, not on genre or author reputation. If one book has a detailed description that clearly mentions certain themes, and another has very vague metadata, they may receive different warnings or severity levels even if the stories feel similar when you read them. For a small set of well-known classics and a few named titles we may use established literary or genre context when descriptions are vague, so the general rule has limited exceptions.</p>
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-2">Are these warnings generated once, or do they change over time?</h3>
                <p>Warnings are generated from the current public information we can find about a book and the latest version of our classification system. As we improve our models, refine our taxonomy, or get better metadata, we may re-run analyses so warnings and severities can be updated over time.</p>
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-2">Are these AI warnings facts about the book?</h3>
                <p>They are best-effort, evidence-based predictions drawn from public descriptions, not statements from the author or publisher. They are meant to surface possible concerns quickly, but they can be incomplete or sometimes wrong, so we recommend using them alongside your own judgment, reviews, and any other information you trust. Our warnings are decision-support; parents, teachers, and readers still make the final call.</p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="font-serif text-2xl text-foreground mb-4">AI &amp; transparency</h2>
            <div className="space-y-6">
              <div>
                <h3 className="font-semibold text-foreground mb-2">Isn&apos;t this just a black-box AI making decisions?</h3>
                <p>We use AI, but we&apos;ve built it so <em>how</em> we use it is what matters. Subtext doesn&apos;t hide behind the model: every warning includes <strong>reasoning</strong> so you can see how it was determined. Warnings are <strong>evidence-based</strong> (tied to the specific book&apos;s metadata and descriptions, not author or genre), mapped to a <strong>fixed taxonomy</strong> (the system can&apos;t invent categories), and <strong>severity is computed</strong> from signals—not a single model&apos;s opinion. So it&apos;s AI in service of transparency and evidence, not black-box judgment.</p>
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-2">How can I trust automated analysis?</h3>
                <p>We don&apos;t ask you to &quot;trust the AI.&quot; We show you the reasoning behind each warning and we constrain the system: no inference from author reputation or genre, no free-form categories, and severity derived from multiple signals. We also say clearly that severity is subjective and that Subtext is a <strong>tool for information, not a substitute for your own judgment</strong>. If something looks wrong, you can use the feedback option to report it.</p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="font-serif text-2xl text-foreground mb-4">Bias &amp; accuracy</h2>
            <div className="space-y-6">
              <div>
                <h3 className="font-semibold text-foreground mb-2">Does the AI have bias?</h3>
                <p>We reduce bias through design: <strong>one book, one analysis</strong> (no guessing from &quot;authors like this&quot; or &quot;this genre usually has X&quot;), a <strong>fixed taxonomy</strong> so the model can&apos;t invent or over-apply categories, and <strong>multiple models</strong> with conservative combination (we don&apos;t hide behind one model&apos;s call). We don&apos;t claim zero bias—we&apos;re working on a formal bias-mitigation process—but the pipeline is built to avoid the most common failure modes (genre/author assumptions, scope creep, single-model overconfidence).</p>
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-2">What if a warning is wrong or missing?</h3>
                <p>Warnings are based on the book&apos;s description and other verified information; they can be wrong or incomplete. You can <strong>report issues</strong> via the Feedback link. We use that input to improve the system. We don&apos;t remove or alter books—we only surface information so you can choose.</p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="font-serif text-2xl text-foreground mb-4">Content warnings vs censorship</h2>
            <div className="space-y-6">
              <div>
                <h3 className="font-semibold text-foreground mb-2">Aren&apos;t content warnings a form of censorship?</h3>
                <p>No. <strong>Censorship removes or restricts access.</strong> Subtext doesn&apos;t remove, alter, or block any book. We only surface information about themes and severity so <strong>you</strong> can decide. Content warnings give you more agency, not less—you can choose to read anyway, avoid certain topics, or prepare. The book stays exactly as it is.</p>
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-2">Don&apos;t warnings coddle readers or spoil stories?</h3>
                <p>We describe <strong>types of content</strong> (e.g. &quot;themes of discrimination,&quot; &quot;depictions of violence&quot;), not plot events or character outcomes. Our guidelines explicitly avoid spoilers. As for &quot;coddling&quot;: many readers need this information for real reasons—trauma, phobias, parenting, or classroom use. Subtext doesn&apos;t tell anyone what they should read; it helps people make informed choices.</p>
              </div>
            </div>
          </section>

          <section id="age-appropriateness" aria-labelledby="age-appropriateness-heading">
            <h2 id="age-appropriateness-heading" className="font-serif text-2xl text-foreground mb-4">Age and appropriateness</h2>
            <div className="space-y-6">
              <div>
                <h3 className="font-semibold text-foreground mb-2">Who decides what&apos;s &quot;age-appropriate&quot;?</h3>
                <p><strong>You do.</strong> Subtext doesn&apos;t block or recommend; it informs. We provide <strong>Australian Classification Board–aligned</strong> age ratings (G, PG, M, MA15+, R18+) and content descriptors as a consistent reference. Parents, teachers, and librarians can use that plus the warning list and reasoning to make their own decisions. We&apos;re a tool, not the decider.</p>
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-2">How do you determine the age rating?</h3>
                <p>We follow Australian Classification Board methodology, assessing the six classifiable elements (themes, violence, sex, language, drug use, nudity) using impact factors such as emphasis, tone, frequency, context, and detail. Severity scores for each content warning feed into the rating. This is an <strong>indicative rating only</strong>; we have no association with the Australian Classification Board and this is not an official rating.</p>
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-2">Why do you warn about [X]? Not everything needs a warning.</h3>
                <p>Our <strong>taxonomy</strong> covers a wide range of sensitive themes (violence, abuse, discrimination, mental health, sexual content, etc.) because different readers care about different things. One person may need to know about phobias; another about sexual content or self-harm. We surface what&apos;s there and let you decide what matters for you. If you disagree with a warning&apos;s severity or presence, you can say so via feedback.</p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="font-serif text-2xl text-foreground mb-4">Privacy &amp; data</h2>
            <div className="space-y-6">
              <div>
                <h3 className="font-semibold text-foreground mb-2">Do you store what I scan or build a profile?</h3>
                <p>No. We don&apos;t store personal reading histories or build user profiles. Our <Link href="/privacy" className="text-primary hover:underline underline-offset-2">Privacy Policy</Link> and <Link href="/transparency" className="text-primary hover:underline underline-offset-2">transparency page</Link> explain what we do and don&apos;t collect.</p>
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-2">Where does the book information come from?</h3>
                <p>Metadata and descriptions come from <strong>public sources</strong> (e.g. Google Books, Open Library) and sometimes <strong>web search</strong> when descriptions are thin. We don&apos;t use the text of the book itself; we analyze publicly available information about the book. Source citations on warnings are being improved so you can see where information came from.</p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="font-serif text-2xl text-foreground mb-4">Summary</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse border border-border">
                <thead>
                  <tr className="bg-muted/50">
                    <th className="border border-border p-3 text-left font-semibold text-foreground">Question</th>
                    <th className="border border-border p-3 text-left font-semibold text-foreground">Short answer</th>
                  </tr>
                </thead>
                <tbody>
                  <tr><td className="border border-border p-3">How does Subtext use AI?</td><td className="border border-border p-3">We look up public book info; the AI classifies content warnings into fixed categories and severity; we show them on the book page.</td></tr>
                  <tr><td className="border border-border p-3">What does the AI see?</td><td className="border border-border p-3">Only public book info (titles, descriptions, subject tags). Not your identity, reading history, or device data.</td></tr>
                  <tr><td className="border border-border p-3">Do you train on my data?</td><td className="border border-border p-3">No. Analyses use public book information and controlled internal data only.</td></tr>
                  <tr><td className="border border-border p-3">Why do similar books get different warnings?</td><td className="border border-border p-3">Warnings follow evidence per book, not genre or author. Different metadata → different results.</td></tr>
                  <tr><td className="border border-border p-3">Do warnings change over time?</td><td className="border border-border p-3">Yes. We may re-run analyses as we improve the system or get better metadata.</td></tr>
                  <tr><td className="border border-border p-3">Are warnings &quot;facts&quot;?</td><td className="border border-border p-3">Best-effort predictions from public descriptions, not author/publisher labels. Use with your own judgment.</td></tr>
                  <tr><td className="border border-border p-3">Black-box AI?</td><td className="border border-border p-3">We show reasoning and constrain the system (evidence-only, fixed taxonomy, computed severity).</td></tr>
                  <tr><td className="border border-border p-3">Bias?</td><td className="border border-border p-3">We reduce it by design (no author/genre inference, fixed taxonomy, multi-model). We&apos;re improving formal bias processes.</td></tr>
                  <tr><td className="border border-border p-3">Censorship?</td><td className="border border-border p-3">No. We don&apos;t remove or block books; we only surface information so you can choose.</td></tr>
                  <tr><td className="border border-border p-3">Coddling / spoilers?</td><td className="border border-border p-3">We describe types of content, not plot. Many readers need this info; we don&apos;t tell anyone what to read.</td></tr>
                  <tr><td className="border border-border p-3">Who decides appropriateness?</td><td className="border border-border p-3">You. We provide ACB-aligned ratings and warnings as information, not as a gate.</td></tr>
                  <tr><td className="border border-border p-3">Wrong or missing warning?</td><td className="border border-border p-3">Use Feedback. We use it to improve; we don&apos;t alter the book.</td></tr>
                  <tr><td className="border border-border p-3">Privacy?</td><td className="border border-border p-3">We don&apos;t store reading history or build profiles.</td></tr>
                </tbody>
              </table>
            </div>
            <p className="mt-4">
              For more detail, see <Link href="/transparency" className="text-primary hover:underline underline-offset-2">How we work</Link> and the <Link href="/press" className="text-primary hover:underline underline-offset-2">Press kit</Link>.
            </p>
          </section>
        </div>
      </div>
    </main>
  )
}
