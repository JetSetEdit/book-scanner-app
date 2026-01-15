import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { supabaseAdmin } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: { code: string } }
) {
  const code = params.code

  if (!code) {
    return NextResponse.json({ error: 'Missing code' }, { status: 400 })
  }

  try {
    // 1. Check if code exists and is unused
    const { data, error } = await supabaseAdmin
      .from('vip_codes')
      .select('*')
      .eq('code', code)
      .eq('is_used', false)
      .single()

    if (error || !data) {
      console.error('VIP Invite Error:', error)
      return NextResponse.json(
        { error: 'This invite link is invalid or has already been used.' },
        { status: 403 }
      )
    }

    // 2. Mark code as used (Burn after reading)
    const { error: updateError } = await supabaseAdmin
      .from('vip_codes')
      .update({ is_used: true })
      .eq('code', code)

    if (updateError) {
      console.error('Failed to mark code as used:', updateError)
      return NextResponse.json(
        { error: 'System error processing invite.' },
        { status: 500 }
      )
    }

    // 3. Set the VIP cookie
    const cookieStore = cookies()
    // Using a simpler name "subtext_vip" as discussed
    cookieStore.set('subtext_vip', 'true', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax', // Lax is better for top-level navigation (clicking a link)
      maxAge: 60 * 60 * 24 * 365, // 1 year
      path: '/',
    })

    // 4. Redirect to home with a success flag
    const url = new URL('/', request.url)
    url.searchParams.set('vip_welcome', 'true')
    
    return NextResponse.redirect(url)

  } catch (err) {
    console.error('Unexpected error in VIP route:', err)
    return NextResponse.json(
      { error: 'An unexpected error occurred.' },
      { status: 500 }
    )
  }
}
