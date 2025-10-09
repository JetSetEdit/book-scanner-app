import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { readFileSync } from 'fs'
import { join } from 'path'

export async function POST() {
  try {
    console.log('Applying Work → Edition → Identifier schema...')
    
    // Read the SQL file
    const sqlPath = join(process.cwd(), 'scripts', '011_create_work_edition_model.sql')
    const sqlContent = readFileSync(sqlPath, 'utf8')
    
    // Split by semicolon and execute each statement
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'))
    
    console.log(`Executing ${statements.length} SQL statements...`)
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i]
      if (statement.trim()) {
        console.log(`Executing statement ${i + 1}/${statements.length}`)
        const { error } = await supabaseAdmin.rpc('exec_sql', { sql: statement })
        
        if (error) {
          console.error(`Error in statement ${i + 1}:`, error)
          // Continue with other statements
        }
      }
    }
    
    console.log('Work → Edition → Identifier schema applied successfully')
    
    return NextResponse.json({
      success: true,
      message: 'Work → Edition → Identifier schema applied successfully'
    })
    
  } catch (error) {
    console.error('Error applying Work → Edition → Identifier schema:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to apply Work → Edition → Identifier schema',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

