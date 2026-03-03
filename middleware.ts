import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // 1. Define paths that are always allowed (static files, API, next internals, gate)
  const pathname = request.nextUrl.pathname;
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/static') ||
    pathname === '/' ||
    pathname === '/welcome' ||
    pathname === '/favicon.ico' ||
    pathname.match(/\.(svg|png|jpg|jpeg|gif|webp)$/)
  ) {
    return NextResponse.next();
  }

  // 2. Check for access cookie (invite code or legacy country-join) OR VIP cookie
  const hasAccessCookie = request.cookies.has('subtext_access_granted');
  const hasVipCookie = request.cookies.has('subtext_vip');
  
  if (hasAccessCookie || hasVipCookie) {
    return NextResponse.next();
  }

  // 3. During development, allow localhost (no gate)
  const isDevelopment = process.env.NODE_ENV === 'development';
  const isLocalhost = request.headers.get('host')?.includes('localhost') || 
                      request.headers.get('host')?.includes('127.0.0.1');
  
  if (isDevelopment && isLocalhost) {
    return NextResponse.next();
  }

  // 4. No cookie: redirect to gate (homepage shows gate; only way past is access code)
  const gateUrl = new URL('/', request.url);
  return NextResponse.redirect(gateUrl);
}

// Apply middleware to all routes
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
