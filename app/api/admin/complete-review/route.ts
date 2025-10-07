import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase environment variables');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(request: NextRequest) {
  try {
    const { bookId } = await request.json();

    if (!bookId) {
      return NextResponse.json({ error: 'Book ID is required' }, { status: 400 });
    }

    console.log(`Marking book ${bookId} as complete...`);

    // Update the book's review status to 'complete'
    const { data, error: updateError } = await supabase
      .from('books')
      .update({ 
        review_status: 'complete',
        in_db: true,
        last_checked: new Date().toISOString()
      })
      .eq('id', bookId)
      .select('id, title, review_status');

    if (updateError) {
      console.error('Error updating book review status:', updateError);
      return NextResponse.json({ 
        error: 'Failed to update book review status', 
        details: updateError.message 
      }, { status: 500 });
    }

    if (!data || data.length === 0) {
      return NextResponse.json({ 
        error: 'Book not found' 
      }, { status: 404 });
    }

    console.log(`Successfully marked book ${bookId} as complete`);
    return NextResponse.json({ 
      success: true, 
      message: 'Book review marked as complete',
      book: data[0]
    });

  } catch (error) {
    console.error('Unexpected error in complete-review API:', error);
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}

