import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { getUserIdentifier } from '@/lib/services/referral-bonus-service'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * GET /share/[code]
 * Handles referral link clicks
 * Sets referral cookie and redirects to homepage
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { code: string } }
) {
  const code = params.code

  if (!code) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  try {
    // Validate code exists
    const { data: referralLink, error } = await supabaseAdmin
      .from('referral_links')
      .select('code, referrer_user_id')
      .eq('code', code)
      .single()

    if (error || !referralLink) {
      // Invalid code, redirect anyway (don't show error to user)
      return NextResponse.redirect(new URL('/', request.url))
    }

    // Get user identifier
    const userId = getUserIdentifier(request)

    // Prevent self-referral
    if (userId === referralLink.referrer_user_id) {
      // Self-referral, redirect without setting cookie
      return NextResponse.redirect(new URL('/', request.url))
    }

    // Record click event
    await supabaseAdmin.from('referral_events').insert({
      event_type: 'click',
      user_id: userId,
      referrer_code: code,
      referrer_user_id: referralLink.referrer_user_id,
      metadata: {
        ip: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
      },
    })

    // Set referral cookie (expires in 30 days)
    const cookieStore = cookies()
    cookieStore.set('subtext_ref', code, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: '/',
    })

    // Redirect to homepage with query param to trigger welcome modal
    // The homepage will detect the query param and show the welcome modal
    const url = new URL('/', request.url)
    url.searchParams.set('ref', code)
    return NextResponse.redirect(url)
  } catch (error) {
    console.error('Error processing referral link:', error)
    // Redirect anyway, don't show error
    return NextResponse.redirect(new URL('/', request.url))
  }
}
