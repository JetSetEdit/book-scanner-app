import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

export async function POST(request: NextRequest) {
  try {
    console.log('🔄 Starting database migration...')

    // Step 1: Add source and is_author_approved columns if they don't exist
    console.log('📝 Adding new columns...')
    
    // Add source column
    const { error: sourceError } = await supabaseAdmin.rpc('exec_sql', {
      sql: `ALTER TABLE content_warnings ADD COLUMN IF NOT EXISTS source VARCHAR(50) DEFAULT 'ai_generated';`
    })
    
    if (sourceError) {
      console.error('Error adding source column:', sourceError)
      // Try alternative approach
      try {
        await supabaseAdmin.from('content_warnings').select('source').limit(1)
      } catch (e) {
        // Column doesn't exist, add it manually
        const { error: altError } = await supabaseAdmin.rpc('exec_sql', {
          sql: `ALTER TABLE content_warnings ADD COLUMN source VARCHAR(50) DEFAULT 'ai_generated';`
        })
        if (altError) {
          throw new Error(`Failed to add source column: ${altError.message}`)
        }
      }
    }

    // Add is_author_approved column
    const { error: approvedError } = await supabaseAdmin.rpc('exec_sql', {
      sql: `ALTER TABLE content_warnings ADD COLUMN IF NOT EXISTS is_author_approved BOOLEAN DEFAULT FALSE;`
    })
    
    if (approvedError) {
      console.error('Error adding is_author_approved column:', approvedError)
      // Try alternative approach
      try {
        await supabaseAdmin.from('content_warnings').select('is_author_approved').limit(1)
      } catch (e) {
        // Column doesn't exist, add it manually
        const { error: altError } = await supabaseAdmin.rpc('exec_sql', {
          sql: `ALTER TABLE content_warnings ADD COLUMN is_author_approved BOOLEAN DEFAULT FALSE;`
        })
        if (altError) {
          throw new Error(`Failed to add is_author_approved column: ${altError.message}`)
        }
      }
    }

    // Step 2: Update existing warnings to have proper source tracking
    console.log('🔄 Updating existing warnings...')
    const { error: updateError } = await supabaseAdmin.rpc('exec_sql', {
      sql: `
        UPDATE content_warnings 
        SET 
            source = CASE 
                WHEN user_id IS NULL THEN 'ai_generated'
                ELSE 'user_submitted'
            END,
            is_author_approved = FALSE
        WHERE source IS NULL OR source = '';
      `
    })

    if (updateError) {
      console.error('Error updating warnings:', updateError)
      // Try alternative approach - update via direct queries
      const { data: warnings } = await supabaseAdmin
        .from('content_warnings')
        .select('id, user_id')
        .is('source', null)

      if (warnings && warnings.length > 0) {
        for (const warning of warnings) {
          const { error: updateSingleError } = await supabaseAdmin
            .from('content_warnings')
            .update({
              source: warning.user_id === null ? 'ai_generated' : 'user_submitted',
              is_author_approved: false
            })
            .eq('id', warning.id)

          if (updateSingleError) {
            console.error(`Error updating warning ${warning.id}:`, updateSingleError)
          }
        }
      }
    }

    // Step 3: Create indexes
    console.log('📊 Creating indexes...')
    const { error: index1Error } = await supabaseAdmin.rpc('exec_sql', {
      sql: `CREATE INDEX IF NOT EXISTS idx_content_warnings_source ON content_warnings(source);`
    })
    
    const { error: index2Error } = await supabaseAdmin.rpc('exec_sql', {
      sql: `CREATE INDEX IF NOT EXISTS idx_content_warnings_author_approved ON content_warnings(is_author_approved);`
    })

    if (index1Error) console.warn('Warning creating source index:', index1Error)
    if (index2Error) console.warn('Warning creating author_approved index:', index2Error)

    // Step 4: Verify migration results
    console.log('✅ Verifying migration results...')
    const { data: warnings, error: fetchError } = await supabaseAdmin
      .from('content_warnings')
      .select('source, is_author_approved, user_id')

    if (fetchError) {
      throw new Error(`Failed to verify migration: ${fetchError.message}`)
    }

    const stats = {
      total_warnings: warnings.length,
      ai_generated: warnings.filter(w => w.source === 'ai_generated').length,
      user_submitted: warnings.filter(w => w.source === 'user_submitted').length,
      author_approved: warnings.filter(w => w.is_author_approved === true).length,
    }

    console.log('🎉 Migration completed successfully!')
    console.log('📊 Migration results:', stats)

    return NextResponse.json({
      success: true,
      message: 'Database migration completed successfully',
      stats,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('❌ Migration failed:', error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Unknown error',
      details: error
    }, { status: 500 })
  }
}
