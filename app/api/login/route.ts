import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { code } = body

    if (!code || typeof code !== 'string') {
      return NextResponse.json(
        { ok: false, error: { code: 'MISSING_CODE', message: 'Please enter an invite code.' } },
        { status: 400 }
      )
    }

    const trimmedCode = code.trim()

    // Check the code against vip_codes table
    const { data, error } = await supabaseAdmin
      .from('vip_codes')
      .select('code, is_used, reusable')
      .eq('code', trimmedCode)
      .single()

    if (error || !data) {
      return NextResponse.json(
        { ok: false, error: { code: 'INVALID_CODE', message: 'That invite code isn\'t valid. Double-check and try again.' } },
        { status: 401 }
      )
    }

    const reusable = data.reusable === true
    const valid = !data.is_used || reusable
    if (!valid) {
      return NextResponse.json(
        { ok: false, error: { code: 'CODE_USED', message: 'This invite code has already been used.' } },
        { status: 401 }
      )
    }

    // Mark code as used only if not reusable (master codes never burn)
    if (!reusable) {
      await supabaseAdmin
        .from('vip_codes')
        .update({ is_used: true })
        .eq('code', trimmedCode)
    }

    // Set VIP cookie (same cookie the middleware already checks)
    const response = NextResponse.json(
      { ok: true, message: 'Welcome to Subtext!' },
      { status: 200 }
    )

    response.cookies.set('subtext_vip', 'true', {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 365, // 1 year
    })

    return response
  } catch (err) {
    console.error('Login API error:', err)
    return NextResponse.json(
      { ok: false, error: { code: 'SERVER_ERROR', message: 'Something went wrong. Please try again.' } },
      { status: 500 }
    )
  }
}
