import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

export const runtime = 'nodejs';

/**
 * GET /api/admin/manual-handling-scans
 * Returns scans that require manual handling
 * Used by GitHub Actions to create issues
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status') || 'pending';
    const limit = parseInt(searchParams.get('limit') || '10');

    // Get pending scans
    const { data: scans, error } = await supabaseAdmin
      .from('manual_handling_scans')
      .select('*')
      .eq('status', status)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching manual handling scans:', error);
      return NextResponse.json(
        { error: 'Failed to fetch scans' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      scans: scans || [],
      count: scans?.length || 0
    });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/admin/manual-handling-scans/:id
 * Update status of a manual handling scan
 */
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, status, resolved_by, resolution_notes } = body;

    if (!id || !status) {
      return NextResponse.json(
        { error: 'id and status are required' },
        { status: 400 }
      );
    }

    const updateData: any = {
      status,
      updated_at: new Date().toISOString()
    };

    if (status === 'resolved') {
      updateData.resolved_at = new Date().toISOString();
      if (resolved_by) updateData.resolved_by = resolved_by;
      if (resolution_notes) updateData.resolution_notes = resolution_notes;
    }

    const { data, error } = await supabaseAdmin
      .from('manual_handling_scans')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating manual handling scan:', error);
      return NextResponse.json(
        { error: 'Failed to update scan' },
        { status: 500 }
      );
    }

    return NextResponse.json({ scan: data });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

