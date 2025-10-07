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
    
    console.log('Fetching scan statistics...');

    // Get total scans count
    const { count: totalScans, error: scansError } = await supabase
      .from('scans')
      .select('*', { count: 'exact', head: true });

    if (scansError) {
      console.error('Error fetching scans count:', scansError);
    }

    // Get book statistics by review status
    const { data: bookStats, error: booksError } = await supabase
      .from('books')
      .select('review_status')
      .in('review_status', ['pending', 'reviewed', 'flagged', 'complete']);

    if (booksError) {
      console.error('Error fetching book statistics:', booksError);
      return NextResponse.json({ 
        error: 'Failed to fetch book statistics', 
        details: booksError.message 
      }, { status: 500 });
    }

    // Count books by status
    const stats = {
      total_scans: totalScans || 0,
      pending_books: bookStats?.filter(b => b.review_status === 'pending').length || 0,
      reviewed_books: bookStats?.filter(b => b.review_status === 'reviewed').length || 0,
      flagged_books: bookStats?.filter(b => b.review_status === 'flagged').length || 0,
      complete_books: bookStats?.filter(b => b.review_status === 'complete').length || 0,
    };

    console.log('Scan statistics:', stats);
    return NextResponse.json({ 
      success: true, 
      stats 
    });

  } catch (error) {
    console.error('Unexpected error in scan-statistics API:', error);
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}

