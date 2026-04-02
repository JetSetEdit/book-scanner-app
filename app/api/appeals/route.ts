import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

export const runtime = 'nodejs';

const OPEN_STATUSES = ['pending', 'acknowledged'];

/**
 * POST /api/appeals
 * Submit a "Report a mistake" appeal for wrong content warning(s).
 * Returns ticket number; disputed warning(s) are suppressed until resolution.
 * SLA: 1 business day acknowledgment, 5 business days resolution.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { bookId, isbn, message, contentWarningIds, email } = body;

    const rawIsbn = typeof isbn === 'string' ? isbn.replace(/-/g, '') : null;
    if (!message || typeof message !== 'string' || !message.trim()) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    if (message.trim().length > 2000) {
      return NextResponse.json(
        { error: 'Message must be 2000 characters or fewer' },
        { status: 400 }
      );
    }

    if (rawIsbn && !/^\d{10}(\d{3})?$/.test(rawIsbn)) {
      return NextResponse.json(
        { error: 'Invalid ISBN format' },
        { status: 400 }
      );
    }

    if (email && typeof email === 'string') {
      if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return NextResponse.json(
          { error: 'Invalid email address' },
          { status: 400 }
        );
      }
    }

    let resolvedBookId: string | null = bookId || null;
    let resolvedIsbn: string = rawIsbn || '';

    if (resolvedBookId) {
      const { data: book } = await supabaseAdmin
        .from('books')
        .select('id, isbn')
        .eq('id', resolvedBookId)
        .single();
      if (book) {
        resolvedIsbn = book.isbn || resolvedIsbn;
      }
    } else if (resolvedIsbn) {
      const { data: book } = await supabaseAdmin
        .from('books')
        .select('id, isbn')
        .eq('isbn', resolvedIsbn)
        .single();
      if (book) {
        resolvedBookId = book.id;
        resolvedIsbn = book.isbn || resolvedIsbn;
      }
    }

    if (!resolvedBookId) {
      return NextResponse.json(
        { error: 'Book not found. Please provide a valid book (ISBN or ID) that exists in Subtext.' },
        { status: 400 }
      );
    }

    // Prevent duplicate open appeals for the same book
    const { data: existingAppeals } = await supabaseAdmin
      .from('warning_appeals')
      .select('id, ticket_number')
      .eq('book_id', resolvedBookId)
      .in('status', OPEN_STATUSES)
      .limit(1);

    if (existingAppeals && existingAppeals.length > 0) {
      return NextResponse.json(
        { error: `An open appeal already exists for this book (ticket ${existingAppeals[0].ticket_number}). Please wait for it to be resolved.` },
        { status: 409 }
      );
    }

    const warningIds: string[] = Array.isArray(contentWarningIds)
      ? contentWarningIds.filter((id: unknown) => typeof id === 'string')
      : [];
    const content_warning_ids = warningIds.length > 0 ? warningIds : [];

    const { data: ticketData, error: rpcError } = await supabaseAdmin
      .rpc('next_warning_appeal_ticket_number');

    if (rpcError || ticketData == null) {
      console.error('Appeals ticket number RPC error:', rpcError);
      return NextResponse.json(
        { error: 'Unable to generate ticket. Please try again.' },
        { status: 500 }
      );
    }

    const ticket_number = typeof ticketData === 'string' ? ticketData : String(ticketData);

    const { data: appeal, error: insertError } = await supabaseAdmin
      .from('warning_appeals')
      .insert({
        ticket_number,
        book_id: resolvedBookId,
        isbn: resolvedIsbn,
        content_warning_ids,
        status: 'pending',
        message: message.trim(),
        reporter_email: typeof email === 'string' && email.trim() ? email.trim() : null,
        updated_at: new Date().toISOString(),
      })
      .select('id')
      .single();

    if (insertError) {
      console.error('Appeals insert error:', insertError);
      return NextResponse.json(
        { error: 'Failed to submit appeal. Please try again.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ticketNumber: ticket_number,
      appealId: appeal?.id,
      message: "We've received your report. We'll acknowledge within one business day and resolve within five business days. The disputed warning(s) are hidden until we complete the review.",
    });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
