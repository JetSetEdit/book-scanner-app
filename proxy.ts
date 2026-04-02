import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Redirect common typos / old URLs
  if (pathname === '/scanner') {
    return NextResponse.redirect(new URL('/scan', request.url), 301);
  }

  // 1. Define paths that are always allowed (static files, API, next internals, gate)
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

  // 2. Check for access: VIP (invite code) or legacy cookie (no longer issued)
  const hasVipCookie = request.cookies.has('subtext_vip');
  const hasLegacyAccessCookie = request.cookies.has('subtext_access_granted');

  if (hasVipCookie || hasLegacyAccessCookie) {
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

// Apply proxy to all routes
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
