import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

export async function POST(request: NextRequest) {
  try {
    console.log('🔄 Adding missing columns to content_warnings table...')

    // Try to add the source column
    try {
      const { error: sourceError } = await supabaseAdmin
        .from('content_warnings')
        .select('source')
        .limit(1)
      
      if (sourceError && sourceError.code === '42703') {
        // Column doesn't exist, we need to add it
        console.log('📝 Source column does not exist, adding it...')
        // We can't add columns via the client, so we'll handle this differently
        return NextResponse.json({
          success: false,
          message: 'Source column does not exist. Please run the migration SQL manually.',
          migration_sql: `
-- Run this in your Supabase SQL editor:
ALTER TABLE content_warnings ADD COLUMN IF NOT EXISTS source VARCHAR(50) DEFAULT 'ai_generated';
ALTER TABLE content_warnings ADD COLUMN IF NOT EXISTS is_author_approved BOOLEAN DEFAULT FALSE;
UPDATE content_warnings SET 
    source = CASE 
        WHEN user_id IS NULL THEN 'ai_generated'
        ELSE 'user_submitted'
    END,
    is_author_approved = FALSE 
WHERE source IS NULL OR source = '';
CREATE INDEX IF NOT EXISTS idx_content_warnings_source ON content_warnings(source);
CREATE INDEX IF NOT EXISTS idx_content_warnings_author_approved ON content_warnings(is_author_approved);
          `
        })
      }
    } catch (error) {
      console.log('📝 Source column does not exist, adding it...')
      return NextResponse.json({
        success: false,
        message: 'Source column does not exist. Please run the migration SQL manually.',
        migration_sql: `
-- Run this in your Supabase SQL editor:
ALTER TABLE content_warnings ADD COLUMN IF NOT EXISTS source VARCHAR(50) DEFAULT 'ai_generated';
ALTER TABLE content_warnings ADD COLUMN IF NOT EXISTS is_author_approved BOOLEAN DEFAULT FALSE;
UPDATE content_warnings SET 
    source = CASE 
        WHEN user_id IS NULL THEN 'ai_generated'
        ELSE 'user_submitted'
    END,
    is_author_approved = FALSE 
WHERE source IS NULL OR source = '';
CREATE INDEX IF NOT EXISTS idx_content_warnings_source ON content_warnings(source);
CREATE INDEX IF NOT EXISTS idx_content_warnings_author_approved ON content_warnings(is_author_approved);
        `
      })
    }

    // If we get here, the columns exist, so let's update the existing warnings
    console.log('✅ Columns exist, updating existing warnings...')
    
    const { data: warnings, error: fetchError } = await supabaseAdmin
      .from('content_warnings')
      .select('id, user_id, source, is_author_approved')

    if (fetchError) {
      throw new Error(`Failed to fetch warnings: ${fetchError.message}`)
    }

    // Update warnings that don't have source set
    const warningsToUpdate = warnings.filter(w => !w.source || w.source === '')
    
    for (const warning of warningsToUpdate) {
      const { error: updateError } = await supabaseAdmin
        .from('content_warnings')
        .update({
          source: warning.user_id === null ? 'ai_generated' : 'user_submitted',
          is_author_approved: false
        })
        .eq('id', warning.id)

      if (updateError) {
        console.error(`Error updating warning ${warning.id}:`, updateError)
      }
    }

    // Get final stats
    const { data: finalWarnings, error: finalError } = await supabaseAdmin
      .from('content_warnings')
      .select('source, is_author_approved, user_id')

    if (finalError) {
      throw new Error(`Failed to fetch final stats: ${finalError.message}`)
    }

    const stats = {
      total_warnings: finalWarnings.length,
      ai_generated: finalWarnings.filter(w => w.source === 'ai_generated').length,
      user_submitted: finalWarnings.filter(w => w.source === 'user_submitted').length,
      author_approved: finalWarnings.filter(w => w.is_author_approved === true).length,
    }

    console.log('🎉 Migration completed successfully!')
    console.log('📊 Final stats:', stats)

    return NextResponse.json({
      success: true,
      message: 'Migration completed successfully',
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
