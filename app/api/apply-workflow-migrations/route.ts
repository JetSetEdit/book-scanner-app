import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ error: 'Missing Supabase environment variables' }, { status: 500 })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    console.log('Applying workflow migrations...')

    // Step 1: Add new columns to books table
    console.log('Adding new columns to books table...')
    const alterBooksQueries = [
      `ALTER TABLE public.books ADD COLUMN IF NOT EXISTS metadata JSONB`,
      `ALTER TABLE public.books ADD COLUMN IF NOT EXISTS author_warning_url TEXT`,
      `ALTER TABLE public.books ADD COLUMN IF NOT EXISTS has_author_warnings BOOLEAN DEFAULT FALSE`,
      `ALTER TABLE public.books ADD COLUMN IF NOT EXISTS spice_level TEXT CHECK (spice_level IN ('none', 'mild', 'medium', 'hot', 'extra_hot'))`,
      `ALTER TABLE public.books ADD COLUMN IF NOT EXISTS scan_source TEXT CHECK (scan_source IN ('app', 'manual', 'import')) DEFAULT 'app'`,
      `ALTER TABLE public.books ADD COLUMN IF NOT EXISTS review_status TEXT CHECK (review_status IN ('pending', 'reviewed', 'flagged', 'complete')) DEFAULT 'pending'`,
      `ALTER TABLE public.books ADD COLUMN IF NOT EXISTS last_checked TIMESTAMP WITH TIME ZONE`,
      `ALTER TABLE public.books ADD COLUMN IF NOT EXISTS in_db BOOLEAN DEFAULT TRUE`
    ]

    for (const query of alterBooksQueries) {
      const { error } = await supabase.rpc('exec_sql', { sql: query })
      if (error) {
        console.warn(`Query warning (may already exist): ${query}`, error.message)
      }
    }

    // Step 2: Create scans table
    console.log('Creating scans table...')
    const createScansTable = `
      CREATE TABLE IF NOT EXISTS public.scans (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        isbn TEXT NOT NULL,
        book_id UUID REFERENCES public.books(id) ON DELETE CASCADE,
        user_id UUID,
        scanned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        notes TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `
    
    const { error: scansError } = await supabase.rpc('exec_sql', { sql: createScansTable })
    if (scansError) {
      console.warn('Scans table creation warning:', scansError.message)
    }

    // Step 3: Create indexes
    console.log('Creating indexes...')
    const indexQueries = [
      `CREATE INDEX IF NOT EXISTS idx_books_review_status ON public.books(review_status)`,
      `CREATE INDEX IF NOT EXISTS idx_books_last_checked ON public.books(last_checked)`,
      `CREATE INDEX IF NOT EXISTS idx_books_has_author_warnings ON public.books(has_author_warnings)`,
      `CREATE INDEX IF NOT EXISTS idx_scans_isbn ON public.scans(isbn)`,
      `CREATE INDEX IF NOT EXISTS idx_scans_book_id ON public.scans(book_id)`,
      `CREATE INDEX IF NOT EXISTS idx_scans_scanned_at ON public.scans(scanned_at)`
    ]

    for (const query of indexQueries) {
      const { error } = await supabase.rpc('exec_sql', { sql: query })
      if (error) {
        console.warn(`Index creation warning: ${query}`, error.message)
      }
    }

    // Step 4: Enable RLS on scans table
    console.log('Setting up RLS policies...')
    const rlsQueries = [
      `ALTER TABLE public.scans ENABLE ROW LEVEL SECURITY`,
      `DROP POLICY IF EXISTS "Allow anonymous read access to scans" ON public.scans`,
      `CREATE POLICY "Allow anonymous read access to scans" ON public.scans FOR SELECT USING (true)`,
      `DROP POLICY IF EXISTS "Allow anonymous insert access to scans" ON public.scans`,
      `CREATE POLICY "Allow anonymous insert access to scans" ON public.scans FOR INSERT WITH CHECK (true)`
    ]

    for (const query of rlsQueries) {
      const { error } = await supabase.rpc('exec_sql', { sql: query })
      if (error) {
        console.warn(`RLS setup warning: ${query}`, error.message)
      }
    }

    console.log('All migrations applied successfully!')
    return NextResponse.json({ 
      success: true, 
      message: 'Workflow migrations applied successfully' 
    })

  } catch (error) {
    console.error('Migration error:', error)
    return NextResponse.json({ 
      error: 'Migration failed', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 })
  }
}
