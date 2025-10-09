import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

export async function POST() {
  try {
    // Try to insert a test record with only basic columns
    const testData = {
      book_id: 'a89b3ac9-369f-4a35-b1f7-aae47699042f', // To Kill a Mockingbird
      category: 'violence',
      description: 'Test warning',
      severity: 'mild'
    }

    const { data, error } = await supabaseAdmin
      .from('content_warnings')
      .insert(testData)
      .select()

    if (error) {
      return NextResponse.json({
        error: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint
      })
    }

    return NextResponse.json({
      success: true,
      insertedData: data
    })

  } catch (error) {
    return NextResponse.json({
      error: 'Failed to test insert',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
