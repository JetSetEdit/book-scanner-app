import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

export const runtime = 'nodejs'

const VALID_ROLES = ['parent', 'teacher', 'librarian', 'bookseller', 'other'] as const

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, role } = body

    // Validate email
    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { ok: false, error: { code: 'MISSING_EMAIL', message: 'Email is required.' } },
        { status: 400 }
      )
    }

    const trimmedEmail = email.trim().toLowerCase()

    if (!isValidEmail(trimmedEmail)) {
      return NextResponse.json(
        { ok: false, error: { code: 'INVALID_EMAIL', message: 'Please enter a valid email address.' } },
        { status: 400 }
      )
    }

    // Validate role (optional)
    const trimmedRole = role ? String(role).trim().toLowerCase() : null
    if (trimmedRole && !VALID_ROLES.includes(trimmedRole as typeof VALID_ROLES[number])) {
      return NextResponse.json(
        { ok: false, error: { code: 'INVALID_ROLE', message: 'Invalid role selected.' } },
        { status: 400 }
      )
    }

    // Insert into waitlist
    const { error } = await supabaseAdmin
      .from('waitlist')
      .insert({
        email: trimmedEmail,
        role: trimmedRole,
      })

    if (error) {
      // Handle duplicate email (unique constraint violation)
      if (error.code === '23505') {
        return NextResponse.json(
          { ok: true, message: "You're already on the list! We'll be in touch soon." },
          { status: 200 }
        )
      }

      console.error('Waitlist insert error:', error)
      return NextResponse.json(
        { ok: false, error: { code: 'INSERT_FAILED', message: 'Something went wrong. Please try again.' } },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { ok: true, message: "You're on the list! We'll let you know when your invite is ready." },
      { status: 201 }
    )
  } catch (err) {
    console.error('Waitlist API error:', err)
    return NextResponse.json(
      { ok: false, error: { code: 'SERVER_ERROR', message: 'Something went wrong. Please try again.' } },
      { status: 500 }
    )
  }
}
