import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { requireAdmin } from '@/lib/utils/admin-auth';

export const runtime = 'nodejs';

/**
 * GET /api/admin/manual-handling-scans
 * Returns scans that require manual handling
 * Used by GitHub Actions to create issues
 * Requires x-admin-secret header (ADMIN_SECRET or DEBUG_IP_SECRET)
 */
export async function GET(req: NextRequest) {
  const auth = requireAdmin(req);
  if (auth) return auth;
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status') || 'pending';
    const limit = parseInt(searchParams.get('limit') || '10');
    const reason = searchParams.get('reason');
    const userReportedOnly = searchParams.get('user_reported_only') === 'true';

    // Build query
    let query = supabaseAdmin
      .from('manual_handling_scans')
      .select('*')
      .eq('status', status);

    // Filter by reason if provided
    if (reason) {
      query = query.eq('reason', reason);
    }

    // Filter for user-reported only (only applies to not_found)
    if (userReportedOnly) {
      query = query.eq('reason', 'not_found');
      // Filter for user-reported: source=user_report OR user_reported=true OR user_provided_title exists
      query = query.or('metadata->>source.eq.user_report,metadata->>user_reported.eq.true');
    }

    // Execute query
    const { data: scans, error } = await query
      .order('created_at', { ascending: false })
      .limit(limit);

    // If user_reported_only is true, also filter by user_provided_title in memory
    // (Supabase JSONB filtering can be limited, so we do a secondary filter)
    let filteredScans = scans || [];
    if (userReportedOnly && scans) {
      filteredScans = scans.filter(scan => {
        const meta = scan.metadata || {};
        return meta.source === 'user_report' || 
               meta.user_reported === true || 
               !!meta.user_provided_title;
      });
    }

    if (error) {
      console.error('Error fetching manual handling scans:', error);
      return NextResponse.json(
        { error: 'Failed to fetch scans' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      scans: filteredScans,
      count: filteredScans.length
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
 * Requires x-admin-secret header (ADMIN_SECRET or DEBUG_IP_SECRET)
 */
export async function PATCH(req: NextRequest) {
  const auth = requireAdmin(req);
  if (auth) return auth;
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

