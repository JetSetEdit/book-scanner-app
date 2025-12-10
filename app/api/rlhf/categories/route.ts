import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { CATEGORY_WEIGHTS } from '@/lib/utils/severity-scoring'

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
 * GET /api/rlhf/categories
 * Get two random categories for comparison
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
    const categories = Object.keys(CATEGORY_WEIGHTS)
    
    if (categories.length < 2) {
      return NextResponse.json(
        { error: 'Not enough categories' },
        { status: 404 }
      )
    }

    // Shuffle and pick 2 random categories
    const shuffled = [...categories].sort(() => Math.random() - 0.5)
    const categoryA = shuffled[0]
    const categoryB = shuffled[1]

    return NextResponse.json({
      success: true,
      categoryA: {
        id: categoryA,
        weight: CATEGORY_WEIGHTS[categoryA] || 1.0,
        label: formatCategoryLabel(categoryA)
      },
      categoryB: {
        id: categoryB,
        weight: CATEGORY_WEIGHTS[categoryB] || 1.0,
        label: formatCategoryLabel(categoryB)
      }
    })
  } catch (error) {
    console.error('RLHF categories error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch categories' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/rlhf/categories
 * Save a category comparison choice
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
    const { categoryA, categoryB, userChoice } = await request.json()

    if (!categoryA || !categoryB || !userChoice) {
      return NextResponse.json(
        { error: 'Missing required fields: categoryA, categoryB, userChoice' },
        { status: 400 }
      )
    }

    if (!['A', 'B', 'equal'].includes(userChoice)) {
      return NextResponse.json(
        { error: 'Invalid userChoice. Must be A, B, or equal' },
        { status: 400 }
      )
    }

    const weightA = CATEGORY_WEIGHTS[categoryA] || 1.0
    const weightB = CATEGORY_WEIGHTS[categoryB] || 1.0

    // Save comparison (handle duplicate gracefully)
    const { data, error } = await supabaseAdmin
      .from('rlhf_category_comparisons')
      .insert({
        category_a: categoryA,
        category_b: categoryB,
        user_choice: userChoice,
        current_weight_a: weightA,
        current_weight_b: weightB
      })
      .select()
      .single()

    if (error) {
      // If duplicate, return existing
      if (error.code === '23505') {
        const { data: existing } = await supabaseAdmin
          .from('rlhf_category_comparisons')
          .select('*')
          .eq('category_a', categoryA)
          .eq('category_b', categoryB)
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
    console.error('RLHF category comparison error:', error)
    return NextResponse.json(
      { error: 'Failed to save comparison' },
      { status: 500 }
    )
  }
}

function formatCategoryLabel(categoryId: string): string {
  const labels: Record<string, string> = {
    'sexual_content': 'Sexual Content',
    'self_harm_or_suicidal_ideation': 'Self-Harm / Suicidal Ideation',
    'emotional_abuse_or_toxic_relationships': 'Emotional Abuse / Toxic Relationships',
    'violence': 'Violence',
    'mental_health': 'Mental Health',
    'bullying_or_social_cruelty': 'Bullying / Social Cruelty',
    'death_or_grief': 'Death / Grief',
    'substance_use_or_alcohol': 'Substance Use / Alcohol',
    'discrimination': 'Discrimination',
    'language': 'Language',
    'other': 'Other'
  }
  return labels[categoryId] || categoryId.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
}

