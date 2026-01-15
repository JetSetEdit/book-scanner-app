'use client'

import { useState } from 'react'
import { useFormStatus } from 'react-dom'
import { grantAccess } from '@/app/actions/access-control'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2, Globe } from 'lucide-react'
import { toast } from 'sonner'

interface Country {
  country_code: string
  country_name: string
  allowed_count: number
}

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
        'Enter Subtext'
      )}
    </Button>
  )
}

export function AccessGateForm({ countries }: { countries: Country[] }) {
  const [selectedCountry, setSelectedCountry] = useState<string>('')

  async function clientAction(formData: FormData) {
    const country = formData.get('country') as string
    if (!country) {
      toast.error('Please select your country.')
      return
    }

    const result = await grantAccess(country)
    if (result?.error) {
      toast.error(result.error)
    }
  }

  return (
    <form action={clientAction} className="space-y-6 mt-8">
      <div className="space-y-2 text-left">
        <label htmlFor="country" className="text-sm font-medium text-[#4A4A4A]">
          Select your location
        </label>
        <Select name="country" onValueChange={setSelectedCountry} required>
          <SelectTrigger className="w-full bg-white border-[#E8E5DF]">
            <SelectValue placeholder="Select a country..." />
          </SelectTrigger>
          <SelectContent>
            {countries.map((c) => (
              <SelectItem key={c.country_code} value={c.country_code}>
                {c.country_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-[#6B6B6B]">
          Limited beta spots available per region.
        </p>
      </div>

      <SubmitButton />
    </form>
  )
}
