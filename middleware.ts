import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // 1. Define paths that are always allowed (static files, API, next internals)
  const pathname = request.nextUrl.pathname;
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/static') ||
    pathname === '/welcome' ||
    pathname === '/favicon.ico' ||
    pathname.match(/\.(svg|png|jpg|jpeg|gif|webp)$/)
  ) {
    return NextResponse.next();
  }

  // 2. Check for access cookie (granted via welcome page) OR VIP cookie
  const hasAccessCookie = request.cookies.has('subtext_access_granted');
  const hasVipCookie = request.cookies.has('subtext_vip');
  
  if (hasAccessCookie || hasVipCookie) {
    return NextResponse.next();
  }

  // 3. Check Country (AU is always allowed)
  // Allow testing via URL parameter: ?test-country=US
  const testCountry = request.nextUrl.searchParams.get('test-country');
  const country = testCountry || request.geo?.country || request.headers.get('x-vercel-ip-country');
  
  // During development, allow localhost
  const isDevelopment = process.env.NODE_ENV === 'development';
  const isLocalhost = request.headers.get('host')?.includes('localhost') || 
                      request.headers.get('host')?.includes('127.0.0.1');
  
  if (isDevelopment && isLocalhost) {
    return NextResponse.next();
  }
  
  if (country === 'AU') {
    return NextResponse.next();
  }

  // 4. If not AU and no cookie, redirect to welcome page
  const welcomeUrl = new URL('/welcome', request.url);
  return NextResponse.redirect(welcomeUrl);
}

// Apply middleware to all routes
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
