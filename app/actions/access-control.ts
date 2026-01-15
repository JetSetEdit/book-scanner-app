'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { headers } from 'next/headers'

export async function grantAccess(countryCode: string) {
  try {
    // Validate input
    if (!countryCode || typeof countryCode !== 'string') {
      return { error: 'Invalid country code provided.' }
    }

    // 1. Get IP address for rate limiting / uniqueness
    let ip = 'unknown'
    let userAgent = 'unknown'
    try {
      const headersList = headers()
      ip = headersList.get('x-forwarded-for') || 'unknown'
      userAgent = headersList.get('user-agent') || 'unknown'
    } catch (err) {
      console.warn('Could not read headers:', err)
      // Continue with defaults
    }

    // Check if Supabase is configured
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error('Supabase not configured, cannot grant access')
      return { error: 'System configuration error. Please try again later.' }
    }

    // 2. Check Quota
    // First get the limit
    const { data: quotaData, error: quotaError } = await supabaseAdmin
      .from('country_quotas')
      .select('allowed_count, is_enabled')
      .eq('country_code', countryCode)
      .single()

    if (quotaError || !quotaData) {
      console.error('Quota check error:', quotaError)
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
      console.error('Count error:', countError)
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
      // Check if it's a duplicate (user already has access)
      if (insertError.code === '23505') { // PostgreSQL unique constraint violation
        // User already has access, just set the cookie and redirect
        try {
          cookies().set('subtext_access_granted', 'true', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 60 * 60 * 24 * 30,
            path: '/',
          })
          cookies().set('subtext_user_country', countryCode, {
            maxAge: 60 * 60 * 24 * 30,
            path: '/',
          })
          redirect('/')
        } catch (redirectErr) {
          return { error: 'Access already granted. Please refresh the page.' }
        }
      }
      return { error: 'Failed to register access. Please try again.' }
    }

    // 4. Set Cookie
    try {
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
    } catch (cookieErr) {
      console.error('Error setting cookies:', cookieErr)
      // Continue anyway - access was granted in DB
    }

    // 5. Redirect (this throws NEXT_REDIRECT to perform redirect - don't catch it)
    redirect('/')
  } catch (err: any) {
    // Catch any unexpected errors
    console.error('Unexpected error in grantAccess:', err)
    return { error: 'An unexpected error occurred. Please try again later.' }
  }
}

// Fallback countries data - always available
const FALLBACK_COUNTRIES = [
  { country_code: 'US', country_name: 'United States', allowed_count: 100 },
  { country_code: 'GB', country_name: 'United Kingdom', allowed_count: 50 },
  { country_code: 'CA', country_name: 'Canada', allowed_count: 50 },
  { country_code: 'NZ', country_name: 'New Zealand', allowed_count: 50 },
] as const

export async function getSupportedCountries() {
  // Always return fallback immediately if Supabase is not configured
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.warn('Supabase environment variables not configured, using fallback countries')
    return [...FALLBACK_COUNTRIES]
  }

  try {
    // Try to fetch from database
    const { data, error } = await supabaseAdmin
      .from('country_quotas')
      .select('country_code, country_name, allowed_count')
      .eq('is_enabled', true)
      .neq('country_code', 'AU') // Don't show AU in the list as they skip this page
      .order('country_name')
    
    if (error) {
      console.error('Error fetching supported countries:', error)
      return [...FALLBACK_COUNTRIES]
    }
    
    // If no data returned, use fallback
    if (!data || data.length === 0) {
      console.warn('No countries found in database, using fallback')
      return [...FALLBACK_COUNTRIES]
    }
    
    return data
  } catch (err: any) {
    // Catch any error including timeouts, network errors, etc.
    console.error('Unexpected error in getSupportedCountries:', err?.message || err)
    // Always return fallback data on any error
    return [...FALLBACK_COUNTRIES]
  }
}
