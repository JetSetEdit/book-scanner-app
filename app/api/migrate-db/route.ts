import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Add StoryGraph rating column
    const { error } = await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE public.books ADD COLUMN IF NOT EXISTS storygraph_rating DECIMAL(3,2);'
    })
    
    if (error) {
      console.error('Migration error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    
    return NextResponse.json({ success: true, message: 'Migration completed' })
  } catch (error) {
    console.error('Migration failed:', error)
    return NextResponse.json({ error: 'Migration failed' }, { status: 500 })
  }
}
