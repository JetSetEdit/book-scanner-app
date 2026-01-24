import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { getClientIP } from '@/lib/utils/rate-limiter';

export const runtime = 'nodejs';

/**
 * POST /api/feedback
 * Allows users to provide general feedback about the application
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { feedbackType, message, email, pageUrl, context, userAgent, appVersion } = body;
    const clientIP = getClientIP(req);

    // Extract book info from context or pageUrl
    let bookId: string | null = null
    let bookTitle: string | null = null
    let bookAuthor: string | null = null
    let bookIsbn: string | null = null

    if (context) {
      bookId = context.bookId || null
      bookTitle = context.bookTitle || null
      bookAuthor = context.bookAuthor || null
      bookIsbn = context.bookIsbn || null
    }

    // If we have ISBN from context but no bookId, try to find the book
    if (bookIsbn && !bookId) {
      const { data: bookData } = await supabaseAdmin
        .from('books')
        .select('id, title, author')
        .eq('isbn', bookIsbn)
        .single()
      
      if (bookData) {
        bookId = bookData.id
        if (!bookTitle) bookTitle = bookData.title
        if (!bookAuthor) bookAuthor = bookData.author
      }
    }

    // Extract ISBN from pageUrl if it's a book page
    if (!bookIsbn && pageUrl) {
      try {
        const bookPageMatch = pageUrl.match(/\/book\/([0-9X-]+)/)
        if (bookPageMatch) {
          bookIsbn = bookPageMatch[1].replace(/-/g, '')
          // Try to find book (but keep ISBN even if book doesn't exist)
          const { data: bookData } = await supabaseAdmin
            .from('books')
            .select('id, title, author')
            .eq('isbn', bookIsbn)
            .single()
          
          if (bookData) {
            bookId = bookData.id
            bookTitle = bookData.title
            bookAuthor = bookData.author
          }
          // Note: bookIsbn is kept even if book doesn't exist yet
        }
      } catch (error) {
        // Ignore URL parsing errors
        console.warn('Error parsing pageUrl for book info:', error)
      }
    }

    // Validate required fields
    if (!feedbackType || !message) {
      return NextResponse.json(
        { error: 'Feedback type and message are required' },
        { status: 400 }
      );
    }

    // Validate feedbackType
    const validTypes = [
      'feature_request',
      'bug_report',
      'general_feedback',
      'content_issue',
      'metadata_issue',
      'warning_accuracy',
      'performance_issue',
      'ui_ux_feedback',
      'accessibility_issue',
      'data_quality',
      'other'
    ];
    if (!validTypes.includes(feedbackType)) {
      return NextResponse.json(
        { error: 'Invalid feedback type' },
        { status: 400 }
      );
    }

    // Check if a similar feedback already exists from this IP in the last hour (to prevent spam)
    const oneHourAgo = new Date();
    oneHourAgo.setHours(oneHourAgo.getHours() - 1);

    const { data: recentFeedbacks } = await supabaseAdmin
      .from('manual_handling_scans')
      .select('id, metadata')
      .eq('reason', 'user_feedback')
      .gte('created_at', oneHourAgo.toISOString());

    // Filter by IP address in metadata
    const recentFeedback = recentFeedbacks?.find(
      (fb: any) => fb.metadata?.ip_address === clientIP
    );

    if (recentFeedback) {
      // Update existing feedback instead of creating duplicate
      const { error: updateError } = await supabaseAdmin
        .from('manual_handling_scans')
        .update({
          book_id: bookId,
          book_title: bookTitle,
          book_author: bookAuthor,
          isbn: bookIsbn || 'N/A',
          user_agent: userAgent || null,
          app_version: appVersion || null,
          metadata: {
            feedback_type: feedbackType,
            message: message,
            email: email || null,
            page_url: pageUrl || null,
            ip_address: clientIP,
            updated_at: new Date().toISOString(),
            submission_count: (recentFeedback as any).metadata?.submission_count 
              ? (recentFeedback as any).metadata.submission_count + 1 
              : 1,
            context: context || null
          },
          context_data: {
            warnings_count: context?.warningsCount || null,
            analysis_status: context?.analysisStatus || null,
            metadata_issues: context?.metadataIssues || null,
            pathname: pageUrl ? (() => {
              try {
                return new URL(pageUrl).pathname
              } catch {
                return pageUrl.split('?')[0] // Fallback: just get path before query
              }
            })() : null
          },
          error_message: `User feedback: ${feedbackType}`,
          updated_at: new Date().toISOString()
        })
        .eq('id', recentFeedback.id);

      if (updateError) {
        console.error('Error updating existing feedback:', updateError);
        return NextResponse.json(
          { error: 'Failed to update feedback' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: 'Thank you! Your feedback has been updated. We\'ll review it soon.',
        feedbackId: recentFeedback.id
      });
    }

    // Create new feedback entry
    const { data: newFeedback, error: insertError } = await supabaseAdmin
      .from('manual_handling_scans')
      .insert({
        isbn: bookIsbn || 'N/A',
        book_id: bookId,
        book_title: bookTitle,
        book_author: bookAuthor,
        reason: 'user_feedback',
        status: 'pending',
        user_agent: userAgent || null,
        app_version: appVersion || null,
        error_message: `User feedback: ${feedbackType}`,
        metadata: {
          feedback_type: feedbackType,
          message: message,
          email: email || null,
          page_url: pageUrl || null,
          ip_address: clientIP,
          created_at: new Date().toISOString(),
          submission_count: 1,
          source: 'user_feedback',
          context: context || null
        },
        context_data: {
          warnings_count: context?.warningsCount || null,
          analysis_status: context?.analysisStatus || null,
          metadata_issues: context?.metadataIssues || null,
          pathname: pageUrl ? (() => {
            try {
              return new URL(pageUrl).pathname
            } catch {
              return pageUrl.split('?')[0] // Fallback: just get path before query
            }
          })() : null
        }
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error creating feedback:', insertError);
      return NextResponse.json(
        { error: 'Failed to submit feedback' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Thank you! Your feedback has been submitted. We\'ll review it soon.',
      feedbackId: newFeedback.id
    });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

