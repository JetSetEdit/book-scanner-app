import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ error: 'Missing Supabase environment variables' }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    console.log('Fetching pending books for admin review...');

    // Fetch all books with their review status
    const { data: books, error: fetchError } = await supabase
      .from('books')
      .select('id, isbn, title, author, review_status, in_db, has_author_warnings, created_at, last_checked')
      .order('created_at', { ascending: false });

    if (fetchError) {
      console.error('Error fetching books:', fetchError);
      return NextResponse.json({ 
        error: 'Failed to fetch books', 
        details: fetchError.message 
      }, { status: 500 });
    }

    console.log(`Found ${books?.length || 0} books total`);
    return NextResponse.json({ 
      success: true, 
      books: books || [] 
    });

  } catch (error) {
    console.error('Unexpected error in pending-books API:', error);
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}

