'use client'

import { useState } from 'react'
import { useFormStatus } from 'react-dom'
import Link from 'next/link'
import { redeemInviteCode } from '@/app/actions/access-control'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button
      type="submit"
      className="w-full bg-[#2C2416] text-[#F9F7F1] hover:bg-[#4A3B26]"
      disabled={pending}
    >
      {pending ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Verifying...
        </>
      ) : (
        'Log in'
      )}
    </Button>
  )
}

export function InviteCodeForm() {
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(formData: FormData) {
    setError(null)
    const result = await redeemInviteCode(formData)
    if (result?.error) {
      setError(result.error)
      toast.error(result.error)
    }
  }

  return (
    <form action={handleSubmit} className="space-y-4 mt-6">
      <div className="space-y-2 text-left">
        <label htmlFor="invite-code" className="text-sm font-medium text-[#4A4A4A]">
          Invite code
        </label>
        <Input
          id="invite-code"
          name="code"
          type="text"
          placeholder="Enter your code"
          className="w-full bg-white border-[#E8E5DF]"
          autoComplete="off"
        />
        <p className="text-xs text-[#6B6B6B]">
          Got a code from a friend or post? Enter it here.
        </p>
      </div>
      {error && (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
      <SubmitButton />
    </form>
  )
}
