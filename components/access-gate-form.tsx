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

    try {
      const result = await grantAccess(country)
      if (result?.error) {
        console.error('grantAccess returned error:', result.error)
        toast.error(result.error)
      } else if (result?.success) {
        // Access granted but redirect didn't work, refresh the page
        toast.success(result.message || 'Access granted!')
        setTimeout(() => {
          window.location.href = '/'
        }, 1000)
      } else {
        // If no error and no explicit success, assume redirect happened
        // (redirect() throws, so we won't reach here normally)
        // But if we do, the redirect should have happened
        console.log('grantAccess completed without error or success - redirect should have happened')
      }
    } catch (err: any) {
      console.error('Form submission error:', {
        message: err?.message,
        stack: err?.stack,
        name: err?.name,
        digest: err?.digest,
        fullError: err
      })
      
      // Check if it's a redirect error (which is actually success)
      if (err?.digest?.startsWith('NEXT_REDIRECT')) {
        // This is actually a redirect - it's working!
        console.log('Redirect error caught (this is normal):', err.digest)
        // The redirect will happen automatically, no need to show error
        return
      }
      
      toast.error(`An error occurred: ${err?.message || 'Unknown error'}. Please check the console for details.`)
    }
  }

  // If no countries available, show a message
  if (!countries || countries.length === 0) {
    return (
      <div className="space-y-4 mt-8">
        <p className="text-sm text-[#6B6B6B]">
          We're currently setting up access for international users. Please check back soon.
        </p>
        <p className="text-xs text-[#6B6B6B]">
          If you're in Australia, you should have automatic access. Please try refreshing the page.
        </p>
      </div>
    )
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
