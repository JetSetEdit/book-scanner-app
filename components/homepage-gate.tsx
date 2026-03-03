import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { BookSpineLogo } from '@/components/book-spine-logo'

/** Demo content for Subtext LIVE card (rotates or use one static example) */
const DEMO_BOOK = {
  title: 'The Long Game',
  author: 'Rachel Reid',
  coverUrl: 'https://covers.openlibrary.org/b/isbn/9780369707932-M.jpg',
  warnings: [
    { label: 'Homophobia', severity: 'severe' },
    { label: 'Deception Or Secrets', severity: 'moderate' },
    { label: 'Explicit Sexual Content', severity: 'moderate' },
    { label: 'Anxiety', severity: 'moderate' },
  ],
  context:
    'Strong themes of discrimination, implicitly related to homophobia and societal pressure impacting a hidden relationship and professional careers.',
}

export function HomepageGate() {
  return (
    <main className="min-h-screen bg-[#F9F7F1] flex flex-col md:flex-row">
      {/* Left: Gate form */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 md:py-24">
        <div className="w-full max-w-md space-y-8">
          <div className="flex justify-center md:justify-start">
            <BookSpineLogo className="h-16 w-16 md:h-20 md:w-20 text-[#2C2416]" />
          </div>
          <div>
            <h1 className="font-serif text-2xl md:text-3xl font-bold text-[#2C2416]">
              Subtext BETA
            </h1>
            <p className="mt-2 text-[#4A4A4A] leading-relaxed">
              Know what&apos;s really in a book before you assign, recommend, or buy it.
            </p>
          </div>

          <div className="space-y-4">
            <p className="text-sm font-medium text-[#2C2416]">Join the beta</p>
            <Input
              type="email"
              placeholder="your@email.com"
              className="w-full bg-white border-[#E8E5DF]"
              disabled
              aria-label="Email (coming soon)"
            />
            <select
              className="flex h-9 w-full rounded-md border border-[#E8E5DF] bg-white px-3 py-1 text-sm text-muted-foreground"
              disabled
              aria-label="I am (coming soon)"
            >
              <option>I am a — select one</option>
            </select>
            <Button
              className="w-full bg-[#2C2416] text-[#F9F7F1] hover:bg-[#4A3B26]"
              disabled
            >
              Join the beta
            </Button>
            <p className="text-center text-sm text-[#4A4A4A]">
              Already have an invite?{' '}
              <Link href="/welcome" className="font-medium text-[#2C2416] underline hover:no-underline">
                Log in
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* Right: Subtext LIVE preview */}
      <div className="flex-1 flex items-center justify-center p-6 md:p-12 bg-[#F9F7F1]">
        <div className="w-full max-w-sm rounded-xl border border-[#E8E5DF] bg-white p-5 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wider text-[#6B6B6B] mb-3">
            $ Subtext
          </p>
          <p className="text-[10px] uppercase tracking-wider text-[#6B6B6B] mb-2">
            Subtext LIVE
          </p>
          <div className="flex gap-3 mb-4">
            <img
              src={DEMO_BOOK.coverUrl}
              alt=""
              className="h-24 w-16 rounded object-cover bg-muted"
            />
            <div>
              <p className="font-semibold text-[#2C2416]">{DEMO_BOOK.title}</p>
              <p className="text-sm text-[#6B6B6B]">{DEMO_BOOK.author}</p>
            </div>
          </div>
          <p className="text-xs font-semibold uppercase tracking-wider text-[#6B6B6B] mb-2">
            Content warnings
          </p>
          <ul className="space-y-1 mb-3">
            {DEMO_BOOK.warnings.map((w) => (
              <li key={w.label} className="text-sm flex items-center gap-2">
                <span
                  className={
                    w.severity === 'severe'
                      ? 'text-pink-600 font-medium'
                      : 'text-amber-600'
                  }
                >
                  {w.label}: <span className="lowercase">{w.severity}</span>
                </span>
              </li>
            ))}
          </ul>
          <p className="text-xs font-semibold uppercase tracking-wider text-[#6B6B6B] mb-1">
            Context
          </p>
          <p className="text-sm text-[#4A4A4A] leading-snug">
            {DEMO_BOOK.context}
          </p>
          <p className="mt-3 text-[10px] text-[#6B6B6B]">
            Real result — different book on each visit.
          </p>
        </div>
      </div>
    </main>
  )
}
