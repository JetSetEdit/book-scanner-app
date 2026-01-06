import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { getClientIP } from '@/lib/utils/rate-limiter';

export const runtime = 'nodejs';

/**
 * POST /api/rate-limit-feedback
 * Allows users to provide feedback or request access when hitting rate limits
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { feedbackType, message, email, useCase } = body;
    const clientIP = getClientIP(req);

    // Validate required fields
    if (!feedbackType || !message) {
      return NextResponse.json(
        { error: 'Feedback type and message are required' },
        { status: 400 }
      );
    }

    // Validate feedbackType
    const validTypes = ['request_access', 'general_feedback', 'report_issue'];
    if (!validTypes.includes(feedbackType)) {
      return NextResponse.json(
        { error: 'Invalid feedback type' },
        { status: 400 }
      );
    }

    // Check if a similar feedback already exists from this IP in the last 24 hours
    const oneDayAgo = new Date();
    oneDayAgo.setHours(oneDayAgo.getHours() - 24);

    const { data: existingFeedbacks } = await supabaseAdmin
      .from('manual_handling_scans')
      .select('id, metadata')
      .eq('reason', 'rate_limit_feedback')
      .gte('created_at', oneDayAgo.toISOString());

    // Filter by IP address in metadata (can't use JSONB operator in single query easily)
    const existingFeedback = existingFeedbacks?.find(
      (fb: any) => fb.metadata?.ip_address === clientIP
    ) || null;

    if (existingFeedback) {
      // Update existing feedback instead of creating duplicate
      const { error: updateError } = await supabaseAdmin
        .from('manual_handling_scans')
        .update({
          metadata: {
            feedback_type: feedbackType,
            message: message,
            email: email || null,
            use_case: useCase || null,
            ip_address: clientIP,
            updated_at: new Date().toISOString(),
            submission_count: (existingFeedback as any).metadata?.submission_count 
              ? (existingFeedback as any).metadata.submission_count + 1 
              : 1
          },
          error_message: `Rate limit feedback: ${feedbackType}`,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingFeedback.id);

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
        feedbackId: existingFeedback.id
      });
    }

    // Create new feedback entry
    const { data: newFeedback, error: insertError } = await supabaseAdmin
      .from('manual_handling_scans')
      .insert({
        isbn: 'N/A', // Not applicable for rate limit feedback
        reason: 'rate_limit_feedback',
        status: 'pending',
        error_message: `Rate limit feedback: ${feedbackType}`,
        metadata: {
          feedback_type: feedbackType,
          message: message,
          email: email || null,
          use_case: useCase || null,
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

