import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { calculateSeverityScore } from '@/lib/utils/severity-scoring'

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
 * POST /api/rlhf/compare
 * Save a user's RLHF comparison choice
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
    const { bookAId, bookBId, userChoice } = await request.json()

    if (!bookAId || !bookBId || !userChoice) {
      return NextResponse.json(
        { error: 'Missing required fields: bookAId, bookBId, userChoice' },
        { status: 400 }
      )
    }

    if (!['A', 'B', 'equal'].includes(userChoice)) {
      return NextResponse.json(
        { error: 'Invalid userChoice. Must be A, B, or equal' },
        { status: 400 }
      )
    }

    // Get both books with warnings
    const { data: bookA } = await supabaseAdmin
      .from('books')
      .select(`
        id,
        content_warnings (
          severity,
          category_id,
          category
        )
      `)
      .eq('id', bookAId)
      .single()

    const { data: bookB } = await supabaseAdmin
      .from('books')
      .select(`
        id,
        content_warnings (
          severity,
          category_id,
          category
        )
      `)
      .eq('id', bookBId)
      .single()

    if (!bookA || !bookB) {
      return NextResponse.json(
        { error: 'One or both books not found' },
        { status: 404 }
      )
    }

    // Calculate scores
    const scoreA = calculateSeverityScore(
      (bookA.content_warnings || []).map((w: any) => ({
        severity: w.severity as 'mild' | 'moderate' | 'severe',
        category_id: w.category_id || undefined,
        category: w.category_id || undefined
      }))
    )

    const scoreB = calculateSeverityScore(
      (bookB.content_warnings || []).map((w: any) => ({
        severity: w.severity as 'mild' | 'moderate' | 'severe',
        category_id: w.category_id || undefined,
        category: w.category_id || undefined
      }))
    )

    // Determine system prediction
    let systemPrediction: 'A' | 'B' | 'equal' = 'equal'
    if (scoreA > scoreB) systemPrediction = 'A'
    else if (scoreB > scoreA) systemPrediction = 'B'

    // Check if user choice matches system prediction
    const match = userChoice === systemPrediction

    // Save comparison (handle duplicate key error gracefully)
    const { data, error } = await supabaseAdmin
      .from('rlhf_comparisons')
      .insert({
        book_a_id: bookAId,
        book_b_id: bookBId,
        user_choice: userChoice,
        system_prediction: systemPrediction,
        book_a_score: scoreA,
        book_b_score: scoreB,
        match
      })
      .select()
      .single()

    if (error) {
      // If duplicate, return existing comparison
      if (error.code === '23505') {
        const { data: existing } = await supabaseAdmin
          .from('rlhf_comparisons')
          .select('*')
          .eq('book_a_id', bookAId)
          .eq('book_b_id', bookBId)
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
      comparison: data,
      match,
      systemPrediction,
      scores: {
        bookA: scoreA,
        bookB: scoreB
      }
    })
  } catch (error) {
    console.error('RLHF comparison error:', error)
    return NextResponse.json(
      { error: 'Failed to save comparison' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/rlhf/compare
 * Get two random books for comparison
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
    // Get random books (limit to books with warnings)
    const { data: books } = await supabaseAdmin
      .from('books')
      .select(`
        id,
        title,
        author,
        isbn,
        content_warnings (
          severity,
          category_id,
          description
        )
      `)
      .limit(100)

    if (!books || books.length < 2) {
      return NextResponse.json(
        { error: 'Not enough books in database' },
        { status: 404 }
      )
    }

    // Filter to books with warnings
    const booksWithWarnings = books.filter(
      book => book.content_warnings && (book.content_warnings as any[]).length > 0
    )

    if (booksWithWarnings.length < 2) {
      return NextResponse.json(
        { error: 'Not enough books with warnings' },
        { status: 404 }
      )
    }

    // Shuffle and pick 2 random books
    const shuffled = [...booksWithWarnings].sort(() => Math.random() - 0.5)
    const bookA = shuffled[0]
    const bookB = shuffled[1]

    // Calculate scores
    const scoreA = calculateSeverityScore(
      ((bookA.content_warnings || []) as any[]).map(w => ({
        severity: w.severity,
        category_id: w.category_id || undefined,
        category: w.category_id || undefined
      }))
    )

    const scoreB = calculateSeverityScore(
      ((bookB.content_warnings || []) as any[]).map(w => ({
        severity: w.severity,
        category_id: w.category_id || undefined,
        category: w.category_id || undefined
      }))
    )

    return NextResponse.json({
      success: true,
      bookA: {
        id: bookA.id,
        title: bookA.title,
        author: bookA.author,
        isbn: bookA.isbn,
        score: scoreA,
        warnings: bookA.content_warnings || []
      },
      bookB: {
        id: bookB.id,
        title: bookB.title,
        author: bookB.author,
        isbn: bookB.isbn,
        score: scoreB,
        warnings: bookB.content_warnings || []
      }
    })
  } catch (error) {
    console.error('RLHF get books error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch books' },
      { status: 500 }
    )
  }
}

