import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Get country from headers for logging
    const country = request.geo?.country || request.headers.get('x-vercel-ip-country');
    const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip');
    
    // Insert into database
    const { error: insertError } = await supabaseAdmin
      .from('consent_logs')
      .insert({
        timestamp: body.timestamp || new Date().toISOString(),
        disclaimer_version: body.disclaimerVersion || 'unknown',
        user_agent: body.userAgent || null,
        country: country || null,
        ip_address: ipAddress || null,
      });
    
    if (insertError) {
      console.error('Error inserting consent log:', insertError);
      // Don't fail the request if logging fails - consent is still accepted
      // Just log to console in dev mode
      if (process.env.NODE_ENV === 'development') {
        console.log('Consent accepted (failed to log to DB):', {
          timestamp: body.timestamp,
          disclaimerVersion: body.disclaimerVersion,
          country,
          ip: ipAddress,
        });
      }
    } else if (process.env.NODE_ENV === 'development') {
      console.log('Consent logged successfully:', {
        timestamp: body.timestamp,
        disclaimerVersion: body.disclaimerVersion,
        country,
      });
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error logging consent:', error);
    // Don't fail the request - consent is still accepted even if logging fails
    return NextResponse.json({ success: true }); // Return success to not block user
  }
}
