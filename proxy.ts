import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Next.js 16 request proxy (formerly middleware).
 * Public beta: all app routes are open. VIP cookie still unlocks unlimited scans via API entitlements.
 */
export function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Redirect common typos / old URLs
  if (pathname === '/scanner') {
    return NextResponse.redirect(new URL('/scan', request.url), 301);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
