import { BookSpineLogo } from '@/components/book-spine-logo'
import { InviteCodeForm } from '@/components/invite-code-form'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScanPreviewCard } from '@/components/scan-preview-card'

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
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-[#E8E5DF]" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-[#F9F7F1] px-3 text-[#6B6B6B]">Already have an invite code?</span>
            </div>
          </div>

          <InviteCodeForm />
        </div>
      </div>

      {/* Right: Subtext LIVE preview */}
      <div className="flex-1 flex items-center justify-center p-6 md:p-12 bg-[#F9F7F1]">
        <ScanPreviewCard />
      </div>
    </main>
  )
}
