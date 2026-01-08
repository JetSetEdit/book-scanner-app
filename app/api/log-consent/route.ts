import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Get country from headers for logging
    const country = request.geo?.country || request.headers.get('x-vercel-ip-country');
    
    const logEntry = {
      ...body,
      country,
      ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
      timestamp: new Date().toISOString(),
    };
    
    // TODO: Send to your preferred logging service
    // For now, just log to console (in production, send to database or analytics)
    if (process.env.NODE_ENV === 'development') {
      console.log('Consent accepted:', logEntry);
    }
    
    // You can add database insertion here later
    // await db.consentLogs.insert(logEntry);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Error logging consent:', error);
    }
    return NextResponse.json({ error: 'Failed to log consent' }, { status: 500 });
  }
}
