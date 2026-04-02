import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft, BookOpen, Shield, FileText, Megaphone, HelpCircle, FileCheck } from "lucide-react"

export const metadata = {
  title: 'Knowledge Base | Subtext',
  description: 'How we work, privacy, terms, press kit, and FAQ.',
}

const SECTIONS = [
  {
    title: 'Content warning SLA & update policy',
    href: '/policy',
    description: 'Appeals process, resolution SLA, and update/notification policy for institutions and committees. Stable URL for submissions.',
    icon: FileCheck,
  },
  {
    title: 'How we work',
    href: '/transparency',
    description: 'How Subtext analyzes books, what’s available now, and what’s coming next. Transparency and roadmap.',
    icon: BookOpen,
  },
  {
    title: 'Privacy Policy',
    href: '/privacy',
    description: 'What we collect, how we use it, and how we protect your data. We don’t store reading history or build profiles.',
    icon: Shield,
  },
  {
    title: 'Terms of Service',
    href: '/terms',
    description: 'Terms governing your use of Subtext.',
    icon: FileText,
  },
  {
    title: 'Press',
    href: '/press',
    description: 'Press kit, boilerplate, logo and assets, and links for media.',
    icon: Megaphone,
  },
  {
    title: 'FAQ',
    href: '/faq',
    description: 'Common questions about AI, bias, content warnings, censorship, age-appropriateness, and privacy.',
    icon: HelpCircle,
  },
]

export default function HelpPage() {
  return (
    <main className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-16 max-w-4xl">
        <div className="mb-12">
          <Link href="/">
            <Button variant="ghost" className="mb-6 text-muted-foreground hover:text-foreground">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Button>
          </Link>
          <h1 className="font-serif text-4xl md:text-5xl font-medium tracking-tight text-foreground mb-4">
            Knowledge base
          </h1>
          <p className="text-muted-foreground leading-relaxed">
            How we work, policies, press resources, and answers to common questions.
          </p>
        </div>

        <div className="space-y-4">
          {SECTIONS.map(({ title, href, description, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="block bg-card border border-border rounded-lg p-6 hover:border-primary/30 transition-colors"
            >
              <div className="flex gap-4 items-start">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                  <Icon className="h-5 w-5 text-muted-foreground" />
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="font-serif text-xl text-foreground mb-1">{title}</h2>
                  <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </main>
  )
}
