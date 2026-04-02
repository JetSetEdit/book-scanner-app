import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"

export const metadata = {
  title: 'Content Warning SLA & Update Policy | Subtext',
  description: 'Appeals process, resolution SLA, and update/notification policy for institutions and committees.',
}

export default function PolicyPage() {
  return (
    <main className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-16 max-w-3xl">
        <Link href="/">
          <Button variant="ghost" className="mb-8 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        </Link>

        <h1 className="text-2xl font-bold mb-2">Subtext — Content Warning SLA and Update Policy</h1>
        <p className="text-sm text-muted-foreground mb-10">
          For institutional and committee use. This page is intended to be cited in submissions (stable URL).
        </p>

        <section className="space-y-6 mb-12">
          <h2 className="text-lg font-semibold">1. Appeals and corrections</h2>
          <ul className="list-disc pl-6 space-y-2 text-sm">
            <li><strong>How to report:</strong> One &quot;Report a mistake&quot; action on every book page and on every content warning. Use it when a warning is factually wrong (e.g. a book flagged for content it does not contain).</li>
            <li><strong>Acknowledgment:</strong> We will acknowledge receipt and provide a ticket number within <strong>one business day</strong>.</li>
            <li><strong>Resolution:</strong> We will resolve factually wrong warnings within <strong>five business days</strong>.</li>
            <li><strong>While under review:</strong> The disputed warning(s) are <strong>suppressed</strong> on that book until the review is complete. The book remains in the system; only the disputed warning(s) are hidden. We will then either remove or correct the warning, or restore it with an explanation.</li>
          </ul>
        </section>

        <section className="space-y-6 mb-12">
          <h2 className="text-lg font-semibold">2. Updates to records and notifications</h2>
          <ul className="list-disc pl-6 space-y-2 text-sm">
            <li><strong>New editions:</strong> We update from standard bibliographic sources on a regular schedule. New editions are added or linked so that updates are reflected.</li>
            <li><strong>Author or publisher content notes:</strong> We accept author or publisher content notes (e.g. sensitivity updates) via a defined process. When we have them, they <strong>override</strong> AI-generated warnings for that edition.</li>
            <li><strong>When a record changes:</strong> We do not change recommendations without transparency. A <strong>notification feed</strong> and <strong>audit trail</strong> are in development so that libraries can see which titles changed and when. Until those are available in the product, we will provide change information on request. Target availability for the notification feed and audit trail will be published on this page when confirmed.</li>
          </ul>
        </section>

        <p className="text-xs text-muted-foreground">
          Last updated: March 2026. For methodology on how we determine severity, see our <a href="/transparency" className="underline hover:text-foreground">How we work</a> and severity methodology documentation.
        </p>
      </div>
    </main>
  )
}
