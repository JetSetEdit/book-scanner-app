import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { getClientIP } from '@/lib/utils/rate-limiter';

export const runtime = 'nodejs';

/**
 * POST /api/request-analysis
 * Allows users to request analysis for a book that hasn't been analyzed yet
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { isbn, email, pageUrl } = body;
    const clientIP = getClientIP(req);

    // Validate required fields
    if (!isbn) {
      return NextResponse.json(
        { error: 'ISBN is required' },
        { status: 400 }
      );
    }

    // Check if book exists
    const { data: book, error: bookError } = await supabaseAdmin
      .from('books')
      .select('id, title, author, isbn')
      .eq('isbn', isbn)
      .single();

    if (bookError || !book) {
      return NextResponse.json(
        { error: 'Book not found. Please scan the book first.' },
        { status: 404 }
      );
    }

    // Check if book already has analysis (has audit log)
    const { data: existingAuditLog } = await supabaseAdmin
      .from('ai_audit_logs')
      .select('id')
      .eq('book_id', book.id)
      .in('decision_type', ['warnings_generated', 'no_warnings'])
      .limit(1);

    if (existingAuditLog && existingAuditLog.length > 0) {
      return NextResponse.json(
        { 
          error: 'This book has already been analyzed.',
          alreadyAnalyzed: true
        },
        { status: 400 }
      );
    }

    // Check if a request already exists for this book in the last 24 hours
    const oneDayAgo = new Date();
    oneDayAgo.setHours(oneDayAgo.getHours() - 24);

    const { data: existingRequests } = await supabaseAdmin
      .from('manual_handling_scans')
      .select('id, metadata')
      .eq('reason', 'analysis_request')
      .eq('isbn', isbn)
      .gte('created_at', oneDayAgo.toISOString());

    // Filter by IP address in metadata
    const existingRequest = existingRequests?.find(
      (req: any) => req.metadata?.ip_address === clientIP
    );

    if (existingRequest) {
      // Update existing request instead of creating duplicate
      const { error: updateError } = await supabaseAdmin
        .from('manual_handling_scans')
        .update({
          metadata: {
            email: email || null,
            page_url: pageUrl || null,
            ip_address: clientIP,
            updated_at: new Date().toISOString(),
            request_count: (existingRequest as any).metadata?.request_count 
              ? (existingRequest as any).metadata.request_count + 1 
              : 1
          },
          updated_at: new Date().toISOString()
        })
        .eq('id', existingRequest.id);

      if (updateError) {
        console.error('Error updating existing analysis request:', updateError);
        return NextResponse.json(
          { error: 'Failed to update request' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: 'Your analysis request has been updated. We\'ll prioritize this book.',
        requestId: existingRequest.id,
        bookTitle: book.title
      });
    }

    // Create new analysis request
    const { data: newRequest, error: insertError } = await supabaseAdmin
      .from('manual_handling_scans')
      .insert({
        isbn: isbn,
        reason: 'analysis_request',
        status: 'pending',
        error_message: `Analysis requested for: ${book.title} by ${book.author || 'Unknown'}`,
        metadata: {
          book_id: book.id,
          book_title: book.title,
          book_author: book.author || null,
          email: email || null,
          page_url: pageUrl || null,
          ip_address: clientIP,
          created_at: new Date().toISOString(),
          request_count: 1,
          source: 'user_request'
        }
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error creating analysis request:', insertError);
      return NextResponse.json(
        { error: 'Failed to submit analysis request' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Thank you! We\'ve added this book to our priority queue for analysis.',
      requestId: newRequest.id,
      bookTitle: book.title
    });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

