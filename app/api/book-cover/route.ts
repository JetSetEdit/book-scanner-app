import { NextRequest, NextResponse } from 'next/server'

/**
 * Proxy book cover images to avoid CORS issues
 * Usage: /api/book-cover?url=<encoded-cover-url>
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const imageUrl = searchParams.get('url')

    if (!imageUrl) {
      return NextResponse.json({ error: 'URL parameter is required' }, { status: 400 })
    }

    // Decode the URL
    const decodedUrl = decodeURIComponent(imageUrl)

    // Validate it's a book cover URL (security check)
    const allowedDomains = [
      'books.google.com',
      'covers.openlibrary.org',
      'images-na.ssl-images-amazon.com',
      'isbndb.com'
    ]

    const urlObj = new URL(decodedUrl)
    if (!allowedDomains.some(domain => urlObj.hostname.includes(domain))) {
      return NextResponse.json({ error: 'Invalid image source' }, { status: 403 })
    }

    // Fetch the image
    const imageResponse = await fetch(decodedUrl, {
      headers: {
        'User-Agent': 'Book-Scanner-App/1.0'
      }
    })

    if (!imageResponse.ok) {
      return NextResponse.json({ error: 'Failed to fetch image' }, { status: imageResponse.status })
    }

    // Get the image data
    const imageBuffer = await imageResponse.arrayBuffer()
    const contentType = imageResponse.headers.get('content-type') || 'image/jpeg'

    // Return the image with proper headers
    return new NextResponse(imageBuffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable', // Cache for 1 year
        'Access-Control-Allow-Origin': '*', // Allow CORS
      },
    })
  } catch (error) {
    console.error('Image proxy error:', error)
    return NextResponse.json(
      { error: 'Failed to proxy image' },
      { status: 500 }
    )
  }
}



