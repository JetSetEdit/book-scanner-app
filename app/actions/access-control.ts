'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { supabaseAdmin } from '@/lib/supabase/admin'

/**
 * Redeem an invite code (VIP). Same logic as GET /api/invite/[code].
 * Use from the welcome page "Enter your invite code" form.
 */
export async function redeemInviteCode(formData: FormData): Promise<{ error?: string }> {
  const raw = formData.get('code')
  const code = typeof raw === 'string' ? raw.trim() : ''
  if (!code) {
    return { error: 'Please enter your invite code.' }
  }

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return { error: 'System configuration error. Please try again later.' }
  }

  try {
    const { data, error } = await supabaseAdmin
      .from('vip_codes')
      .select('code')
      .eq('code', code)
      .eq('is_used', false)
      .single()

    if (error || !data) {
      return { error: 'This invite code is invalid or has already been used.' }
    }

    const { error: updateError } = await supabaseAdmin
      .from('vip_codes')
      .update({ is_used: true })
      .eq('code', code)

    if (updateError) {
      return { error: 'Something went wrong. Please try again.' }
    }

    const cookieStore = await cookies()
    cookieStore.set('subtext_vip', 'true', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 365,
      path: '/',
    })

    redirect('/')
  } catch (err: any) {
    if (err?.digest?.startsWith('NEXT_REDIRECT')) throw err
    console.error('redeemInviteCode error:', err)
    return { error: err?.message || 'Something went wrong. Please try again.' }
  }
}
