import { NextRequest, NextResponse } from "next/server"

/**
 * Redirect /collection to canonical /bookshelf (preserves query string).
 */
export function GET(request: NextRequest) {
  const url = request.nextUrl
  const path = "/bookshelf"
  const search = url.searchParams.toString()
  const destination = search ? `${path}?${search}` : path
  return NextResponse.redirect(new URL(destination, url.origin), 308)
}
