import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import fs from 'fs'
import path from 'path'

export async function POST(request: NextRequest) {
  try {
    console.log('🔄 Adding reasoning column to content_warnings table...')

    // Read the migration script
    const migrationPath = path.join(process.cwd(), 'scripts', '016_add_reasoning_column.sql')
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8')

    // Execute the migration script
    const { error: migrationError } = await supabaseAdmin.rpc('exec_sql', { sql: migrationSQL })

    if (migrationError) {
      console.error('Migration script error:', migrationError)
      throw new Error(`Failed to execute migration script: ${migrationError.message}`)
    }

    console.log('✅ Reasoning column migration completed successfully')

    return NextResponse.json({
      success: true,
      message: 'Reasoning column migration completed successfully',
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error in add-reasoning-column API:', error)
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 })
  }
}
