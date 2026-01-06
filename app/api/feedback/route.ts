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
    const { feedbackType, message, email, pageUrl } = body;
    const clientIP = getClientIP(req);

    // Validate required fields
    if (!feedbackType || !message) {
      return NextResponse.json(
        { error: 'Feedback type and message are required' },
        { status: 400 }
      );
    }

    // Validate feedbackType
    const validTypes = ['feature_request', 'bug_report', 'general_feedback', 'content_issue', 'other'];
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
          metadata: {
            feedback_type: feedbackType,
            message: message,
            email: email || null,
            page_url: pageUrl || null,
            ip_address: clientIP,
            updated_at: new Date().toISOString(),
            submission_count: (recentFeedback as any).metadata?.submission_count 
              ? (recentFeedback as any).metadata.submission_count + 1 
              : 1
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
        isbn: 'N/A', // Not applicable for general feedback
        reason: 'user_feedback',
        status: 'pending',
        error_message: `User feedback: ${feedbackType}`,
        metadata: {
          feedback_type: feedbackType,
          message: message,
          email: email || null,
          page_url: pageUrl || null,
          ip_address: clientIP,
          created_at: new Date().toISOString(),
          submission_count: 1,
          source: 'user_feedback'
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

