import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Allow testing via URL parameter: ?test-country=US
  const testCountry = request.nextUrl.searchParams.get('test-country');
  // Get country from Vercel's geo headers (or test parameter)
  const country = testCountry || request.geo?.country || request.headers.get('x-vercel-ip-country');
  
  // During development, allow localhost/no geo data
  const isDevelopment = process.env.NODE_ENV === 'development';
  const isLocalhost = request.headers.get('host')?.includes('localhost') || 
                      request.headers.get('host')?.includes('127.0.0.1');
  
  if (isDevelopment && isLocalhost) {
    // Allow all traffic in local development
    return NextResponse.next();
  }
  
  // Allow Australia only (ISO code: AU)
  if (country && country !== 'AU') {
    // Return a geo-blocked page
    return new NextResponse(
      `<!DOCTYPE html>
      <html>
        <head>
          <title>Service Not Available</title>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
              display: flex;
              justify-content: center;
              align-items: center;
              min-height: 100vh;
              margin: 0;
              background: #f5f5f5;
              color: #333;
            }
            .container {
              text-align: center;
              max-width: 500px;
              padding: 2rem;
              background: white;
              border-radius: 8px;
              box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            }
            h1 { color: #8B4513; }
            p { line-height: 1.6; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>Service Not Available</h1>
            <p>Subtext is currently only available to users in Australia.</p>
            <p>We're working on expanding our service to other regions in the future.</p>
            <p>Thank you for your interest!</p>
          </div>
        </body>
      </html>`,
      {
        status: 451,
        headers: {
          'Content-Type': 'text/html',
        },
      }
    );
  }

  // If no country detected in production, allow (geo detection may fail)
  // This prevents false positives from blocking legitimate users
  return NextResponse.next();
}

// Apply middleware to all routes except static files and API routes
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
