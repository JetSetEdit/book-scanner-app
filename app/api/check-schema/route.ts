import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

export async function GET() {
  try {
    // Check the content_warnings table schema
    const { data, error } = await supabaseAdmin
      .from('content_warnings')
      .select('*')
      .limit(1)

    if (error) {
      return NextResponse.json({
        error: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint
      })
    }

    // Get table info
    const { data: tableInfo, error: tableError } = await supabaseAdmin
      .rpc('get_table_columns', { table_name: 'content_warnings' })
      .single()

    return NextResponse.json({
      success: true,
      sampleData: data,
      tableInfo: tableInfo || 'Could not get table info',
      tableError: tableError?.message
    })

  } catch (error) {
    return NextResponse.json({
      error: 'Failed to check schema',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

