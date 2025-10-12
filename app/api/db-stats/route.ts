import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

export async function GET(request: NextRequest) {
  try {
    // First check if the new columns exist
    const { data: testData, error: testError } = await supabaseAdmin
      .from('content_warnings')
      .select('source, is_author_approved, user_id')
      .limit(1)

    if (testError && testError.code === '42703') {
      // Columns don't exist, get basic stats without new columns
      const { data: warnings, error: warningsError } = await supabaseAdmin
        .from('content_warnings')
        .select('user_id')

      if (warningsError) {
        console.error('Error fetching warnings:', warningsError)
        return NextResponse.json({ error: 'Failed to fetch warnings' }, { status: 500 })
      }

      return NextResponse.json({
        success: true,
        migration_required: true,
        stats: {
          total_warnings: warnings.length,
          by_user: {
            with_user_id: warnings.filter(w => w.user_id !== null).length,
            without_user_id: warnings.filter(w => w.user_id === null).length
          },
          message: 'Database migration required - new columns missing'
        },
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
        `,
        timestamp: new Date().toISOString()
      })
    }

    // Get content warnings statistics with new columns
    const { data: warnings, error: warningsError } = await supabaseAdmin
      .from('content_warnings')
      .select('source, is_author_approved, user_id')

    if (warningsError) {
      console.error('Error fetching warnings:', warningsError)
      return NextResponse.json({ error: 'Failed to fetch warnings' }, { status: 500 })
    }

    // Calculate statistics
    const stats = {
      total_warnings: warnings.length,
      by_source: {
        ai_generated: warnings.filter(w => w.source === 'ai_generated').length,
        user_submitted: warnings.filter(w => w.source === 'user_submitted').length,
        author_website: warnings.filter(w => w.source === 'author_website').length,
        publisher: warnings.filter(w => w.source === 'publisher').length,
        null_or_undefined: warnings.filter(w => !w.source || w.source === null).length
      },
      by_approval: {
        author_approved: warnings.filter(w => w.is_author_approved === true).length,
        not_author_approved: warnings.filter(w => w.is_author_approved === false).length,
        null_or_undefined: warnings.filter(w => w.is_author_approved === null || w.is_author_approved === undefined).length
      },
      by_user: {
        with_user_id: warnings.filter(w => w.user_id !== null).length,
        without_user_id: warnings.filter(w => w.user_id === null).length
      }
    }

    // Get book count
    const { data: books, error: booksError } = await supabaseAdmin
      .from('books')
      .select('id')

    if (booksError) {
      console.error('Error fetching books:', booksError)
    } else {
      stats.total_books = books.length
    }

    return NextResponse.json({
      success: true,
      stats,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Database stats error:', error)
    return NextResponse.json({
      error: 'Database stats failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
