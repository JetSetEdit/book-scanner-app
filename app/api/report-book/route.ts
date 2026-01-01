import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { normalizeISBN } from '@/lib/isbn-validation';

export const runtime = 'nodejs';

/**
 * POST /api/report-book
 * Allows users to report a book that should exist but wasn't found
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { isbn, title, author, additionalInfo } = body;

    if (!isbn) {
      return NextResponse.json(
        { error: 'ISBN is required' },
        { status: 400 }
      );
    }

    // Normalize ISBN
    const cleanIsbn = normalizeISBN(isbn);

    // Check if a report already exists for this ISBN
    const { data: existingReport } = await supabaseAdmin
      .from('manual_handling_scans')
      .select('id')
      .eq('isbn', cleanIsbn)
      .eq('reason', 'not_found')
      .eq('status', 'pending')
      .single();

    if (existingReport) {
      // Update existing report with user-provided info
      const { error: updateError } = await supabaseAdmin
        .from('manual_handling_scans')
        .update({
          metadata: {
            user_reported: true,
            user_reported_at: new Date().toISOString(),
            user_provided_title: title || null,
            user_provided_author: author || null,
            user_additional_info: additionalInfo || null,
            report_count: (existingReport as any).metadata?.report_count 
              ? (existingReport as any).metadata.report_count + 1 
              : 1
          },
          updated_at: new Date().toISOString()
        })
        .eq('id', existingReport.id);

      if (updateError) {
        console.error('Error updating existing report:', updateError);
        return NextResponse.json(
          { error: 'Failed to update report' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: 'Thank you! Your report has been updated. We\'ll investigate this ISBN.',
        reportId: existingReport.id
      });
    }

    // Create new report
    const { data: newReport, error: insertError } = await supabaseAdmin
      .from('manual_handling_scans')
      .insert({
        isbn: cleanIsbn,
        reason: 'not_found',
        status: 'pending',
        error_message: `User reported: Book with ISBN ${cleanIsbn} not found. User believes it should exist.`,
        metadata: {
          user_reported: true,
          user_reported_at: new Date().toISOString(),
          user_provided_title: title || null,
          user_provided_author: author || null,
          user_additional_info: additionalInfo || null,
          report_count: 1,
          source: 'user_report'
        }
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error creating report:', insertError);
      return NextResponse.json(
        { error: 'Failed to create report' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Thank you! Your report has been submitted. We\'ll investigate this ISBN.',
      reportId: newReport.id
    });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

