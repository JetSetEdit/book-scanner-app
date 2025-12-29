import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

/**
 * Check if user is authenticated or in dev mode
 */
async function checkAuth(): Promise<{ authorized: boolean; userId?: string }> {
  // Allow in dev mode
  if (process.env.NODE_ENV === 'development') {
    return { authorized: true }
  }

  // Check authentication
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return { authorized: false }
  }

  return { authorized: true, userId: user.id }
}

/**
 * GET /api/rlhf/examples
 * Get two random warning examples for comparison
 * Requires authentication (or dev mode)
 */
export async function GET() {
  const auth = await checkAuth()
  if (!auth.authorized) {
    return NextResponse.json(
      { error: 'Unauthorized. Please sign in.' },
      { status: 401 }
    )
  }

  try {
    // Get random warnings with book context
    const { data: warnings } = await supabaseAdmin
      .from('content_warnings')
      .select(`
        id,
        severity,
        category_id,
        category,
        description,
        book_id,
        books!inner (
          id,
          title,
          author,
          isbn
        )
      `)
      .limit(200) // Get a pool

    if (!warnings || warnings.length < 2) {
      return NextResponse.json(
        { error: 'Not enough warnings in database' },
        { status: 404 }
      )
    }

    // Filter to warnings with descriptions
    const warningsWithDescriptions = warnings.filter(
      (w: any) => w.description && w.description.length > 20
    )

    if (warningsWithDescriptions.length < 2) {
      return NextResponse.json(
        { error: 'Not enough warnings with descriptions' },
        { status: 404 }
      )
    }

    // Shuffle and pick 2 random warnings
    const shuffled = [...warningsWithDescriptions].sort(() => Math.random() - 0.5)
    const warningA = shuffled[0]
    const warningB = shuffled[1]

    return NextResponse.json({
      success: true,
      warningA: {
        id: warningA.id,
        severity: warningA.severity,
        category: warningA.category_id || warningA.category,
        description: warningA.description,
        book: {
          title: warningA.books.title,
          author: warningA.books.author,
          isbn: warningA.books.isbn
        }
      },
      warningB: {
        id: warningB.id,
        severity: warningB.severity,
        category: warningB.category_id || warningB.category,
        description: warningB.description,
        book: {
          title: warningB.books.title,
          author: warningB.books.author,
          isbn: warningB.books.isbn
        }
      }
    })
  } catch (error) {
    console.error('RLHF examples error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch examples' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/rlhf/examples
 * Save a warning example comparison choice
 * Requires authentication (or dev mode)
 */
export async function POST(request: NextRequest) {
  const auth = await checkAuth()
  if (!auth.authorized) {
    return NextResponse.json(
      { error: 'Unauthorized. Please sign in.' },
      { status: 401 }
    )
  }

  try {
    const { warningAId, warningBId, userChoice } = await request.json()

    if (!warningAId || !warningBId || !userChoice) {
      return NextResponse.json(
        { error: 'Missing required fields: warningAId, warningBId, userChoice' },
        { status: 400 }
      )
    }

    if (!['A', 'B', 'equal'].includes(userChoice)) {
      return NextResponse.json(
        { error: 'Invalid userChoice. Must be A, B, or equal' },
        { status: 400 }
      )
    }

    // Get warning details
    const { data: warningA } = await supabaseAdmin
      .from('content_warnings')
      .select('severity, category_id, category')
      .eq('id', warningAId)
      .single()

    const { data: warningB } = await supabaseAdmin
      .from('content_warnings')
      .select('severity, category_id, category')
      .eq('id', warningBId)
      .single()

    if (!warningA || !warningB) {
      return NextResponse.json(
        { error: 'One or both warnings not found' },
        { status: 404 }
      )
    }

    // Save comparison (handle duplicate gracefully)
    const { data, error } = await supabaseAdmin
      .from('rlhf_warning_examples')
      .insert({
        warning_a_id: warningAId,
        warning_b_id: warningBId,
        user_choice: userChoice,
        warning_a_severity: warningA.severity,
        warning_b_severity: warningB.severity,
        warning_a_category: warningA.category_id || warningA.category,
        warning_b_category: warningB.category_id || warningB.category
      })
      .select()
      .single()

    if (error) {
      // If duplicate, return existing
      if (error.code === '23505') {
        const { data: existing } = await supabaseAdmin
          .from('rlhf_warning_examples')
          .select('*')
          .eq('warning_a_id', warningAId)
          .eq('warning_b_id', warningBId)
          .single()

        return NextResponse.json({
          success: true,
          comparison: existing,
          message: 'Comparison already exists'
        })
      }
      throw error
    }

    return NextResponse.json({
      success: true,
      comparison: data
    })
  } catch (error) {
    console.error('RLHF warning example comparison error:', error)
    return NextResponse.json(
      { error: 'Failed to save comparison' },
      { status: 500 }
    )
  }
}

