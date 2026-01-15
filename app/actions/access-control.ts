'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { headers } from 'next/headers'

export async function grantAccess(countryCode: string) {
  // 1. Get IP address for rate limiting / uniqueness
  const headersList = headers()
  const ip = headersList.get('x-forwarded-for') || 'unknown'
  const userAgent = headersList.get('user-agent') || 'unknown'

  // 2. Check Quota
  // First get the limit
  const { data: quotaData, error: quotaError } = await supabaseAdmin
    .from('country_quotas')
    .select('allowed_count, is_enabled')
    .eq('country_code', countryCode)
    .single()

  if (quotaError || !quotaData) {
    // If country not found in explicit quota list, maybe allow with default strict limit?
    // Or return error. For now, strict: only allow supported countries.
    return { error: 'Country not supported for beta access yet.' }
  }

  if (!quotaData.is_enabled) {
    return { error: 'Access for this country is currently paused.' }
  }

  // Count current grants
  const { count, error: countError } = await supabaseAdmin
    .from('access_grants')
    .select('*', { count: 'exact', head: true })
    .eq('country_code', countryCode)

  if (countError) {
    return { error: 'System error checking capacity.' }
  }

  const currentCount = count || 0

  if (currentCount >= quotaData.allowed_count) {
    return { error: `Beta capacity for ${countryCode} is full (${currentCount}/${quotaData.allowed_count}). Please try again later.` }
  }

  // 3. Grant Access
  const { error: insertError } = await supabaseAdmin
    .from('access_grants')
    .insert({
      country_code: countryCode,
      ip_address: ip,
      user_agent: userAgent
    })

  if (insertError) {
    console.error('Error granting access:', insertError)
    return { error: 'Failed to register access.' }
  }

  // 4. Set Cookie
  // Set a long-lived cookie
  cookies().set('subtext_access_granted', 'true', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24 * 30, // 30 days
    path: '/',
  })
  
  // Also set a country cookie for personalization
  cookies().set('subtext_user_country', countryCode, {
    maxAge: 60 * 60 * 24 * 30,
    path: '/',
  })

  // 5. Redirect
  redirect('/')
}

export async function getSupportedCountries() {
  const { data } = await supabaseAdmin
    .from('country_quotas')
    .select('country_code, country_name, allowed_count')
    .eq('is_enabled', true)
    .neq('country_code', 'AU') // Don't show AU in the list as they skip this page
    .order('country_name')
  
  return data || []
}
