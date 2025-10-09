import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

export async function POST() {
  try {
    console.log('Creating Work → Edition → Identifier tables...')
    
    // Create works table
    const { error: worksError } = await supabaseAdmin.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS works (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          canonical_title TEXT NOT NULL,
          title_norm TEXT NOT NULL,
          language_work TEXT DEFAULT 'en',
          primary_contributors JSONB NOT NULL DEFAULT '[]',
          original_pub_year INTEGER,
          external_ids JSONB DEFAULT '{}',
          work_fp TEXT UNIQUE NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    })
    
    if (worksError) {
      console.error('Error creating works table:', worksError)
      return NextResponse.json({
        success: false,
        error: 'Failed to create works table',
        details: worksError.message
      }, { status: 500 })
    }
    
    // Create editions table
    const { error: editionsError } = await supabaseAdmin.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS editions (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          work_id UUID NOT NULL REFERENCES works(id) ON DELETE CASCADE,
          publisher TEXT,
          imprint TEXT,
          pub_year INTEGER,
          binding TEXT CHECK (binding IN ('paperback', 'hardcover', 'ebook', 'audiobook', 'other')),
          language_edition TEXT DEFAULT 'en',
          edition_stmt TEXT,
          page_count INTEGER,
          cover_url TEXT,
          description TEXT,
          categories TEXT[],
          external_ids JSONB DEFAULT '{}',
          edition_fp TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    })
    
    if (editionsError) {
      console.error('Error creating editions table:', editionsError)
      return NextResponse.json({
        success: false,
        error: 'Failed to create editions table',
        details: editionsError.message
      }, { status: 500 })
    }
    
    // Create identifiers table
    const { error: identifiersError } = await supabaseAdmin.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS identifiers (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          edition_id UUID NOT NULL REFERENCES editions(id) ON DELETE CASCADE,
          id_type TEXT NOT NULL CHECK (id_type IN ('isbn13','isbn10','ean','asin','ol_ed','oclc')),
          value TEXT NOT NULL,
          is_primary BOOLEAN DEFAULT FALSE,
          source TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          UNIQUE (id_type, value)
        );
      `
    })
    
    if (identifiersError) {
      console.error('Error creating identifiers table:', identifiersError)
      return NextResponse.json({
        success: false,
        error: 'Failed to create identifiers table',
        details: identifiersError.message
      }, { status: 500 })
    }
    
    // Create indexes
    const { error: indexesError } = await supabaseAdmin.rpc('exec_sql', {
      sql: `
        CREATE INDEX IF NOT EXISTS idx_works_fp ON works(work_fp);
        CREATE INDEX IF NOT EXISTS idx_works_title_norm ON works(title_norm);
        CREATE INDEX IF NOT EXISTS idx_editions_work_id ON editions(work_id);
        CREATE INDEX IF NOT EXISTS idx_identifiers_edition_id ON identifiers(edition_id);
        CREATE INDEX IF NOT EXISTS idx_identifiers_value ON identifiers(value);
      `
    })
    
    if (indexesError) {
      console.error('Error creating indexes:', indexesError)
      // Don't fail the whole operation for index errors
    }
    
    console.log('Work → Edition → Identifier tables created successfully')
    
    return NextResponse.json({
      success: true,
      message: 'Work → Edition → Identifier tables created successfully'
    })
    
  } catch (error) {
    console.error('Error creating Work → Edition → Identifier tables:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to create Work → Edition → Identifier tables',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

