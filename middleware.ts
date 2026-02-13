import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Always pass the current pathname to the layout via header
  const addPathHeader = (response: NextResponse) => {
    response.headers.set('x-pathname', pathname);
    return response;
  };

  // 1. Define paths that are always allowed (static files, API, next internals)
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/static') ||
    pathname === '/' || // Homepage (waitlist) is public
    pathname === '/welcome' ||
    pathname === '/login' || // Allow invite code login from anywhere
    pathname.startsWith('/share/') || // Allow referral links through
    pathname === '/favicon.ico' ||
    pathname.match(/\.(svg|png|jpg|jpeg|gif|webp)$/)
  ) {
    return addPathHeader(NextResponse.next());
  }

  // 2. Skip country gate when disabled (e.g. open internationally)
  if (process.env.NEXT_PUBLIC_DISABLE_COUNTRY_GATE === 'true') {
    return addPathHeader(NextResponse.next());
  }

  // 3. Check for access cookie (granted via welcome page) OR VIP cookie
  const hasAccessCookie = request.cookies.has('subtext_access_granted');
  const hasVipCookie = request.cookies.has('subtext_vip');
  
  if (hasAccessCookie || hasVipCookie) {
    return addPathHeader(NextResponse.next());
  }

  // 4. Check Country (AU is always allowed)
  const testCountry = request.nextUrl.searchParams.get('test-country');
  const country = testCountry || request.geo?.country || request.headers.get('x-vercel-ip-country');
  
  // During development, allow localhost
  const isDevelopment = process.env.NODE_ENV === 'development';
  const isLocalhost = request.headers.get('host')?.includes('localhost') || 
                      request.headers.get('host')?.includes('127.0.0.1');
  
  if (isDevelopment && isLocalhost) {
    return addPathHeader(NextResponse.next());
  }
  
  if (country === 'AU') {
    return addPathHeader(NextResponse.next());
  }

  // 5. If not AU and no cookie, redirect to welcome page
  const welcomeUrl = new URL('/welcome', request.url);
  return NextResponse.redirect(welcomeUrl);
}

// Apply middleware to all routes
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
