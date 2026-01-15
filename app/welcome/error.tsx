'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Welcome page error:', error)
  }, [error])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-[#F9F7F1] text-[#2C2416] font-sans">
      <div className="max-w-md w-full text-center bg-white p-8 rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.05)] border border-[#E8E5DF]">
        <h1 className="font-serif text-2xl mb-4 text-[#2C2416]">Welcome to Subtext</h1>
        <p className="text-[#4A4A4A] mb-6">
          We're currently setting up access for international users. Please try again in a moment.
        </p>
        <div className="space-y-3">
          <Button
            onClick={reset}
            className="w-full bg-[#2C2416] text-[#F9F7F1] hover:bg-[#4A3B26]"
          >
            Try Again
          </Button>
          <p className="text-xs text-[#6B6B6B]">
            If you're in Australia, you should have automatic access. Please try refreshing the page.
          </p>
        </div>
      </div>
    </div>
  )
}
