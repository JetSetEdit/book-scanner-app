interface OpenLibraryBook {
  title: string
  authors?: Array<{ name: string }>
  publishers?: Array<{ name: string }>
  publish_date?: string
  number_of_pages?: number
  cover?: {
    small?: string
    medium?: string
    large?: string
  }
  subjects?: Array<{ name: string }>
  excerpts?: Array<{ text: string }>
}

import { isPlaceholderTitle, filterPlaceholderCandidates } from './utils/placeholder-detection'

interface BookData {
  isbn: string
  title: string
  author?: string
  cover_url?: string
  description?: string
  publisher?: string
  published_date?: string
  page_count?: number
  categories?: string[]
  classification_rating?: string
}

export interface BookCandidate extends BookData {
  source: 'openlibrary' | 'googlebooks';
  source_id?: string;
}

export async function fetchCandidatesByISBN(isbn: string): Promise<BookCandidate[]> {
  const cleanIsbn = isbn.replace(/[-\s]/g, "")
  console.log(`[Book API] Fetching candidates for ISBN: ${cleanIsbn}`)

  const candidates: BookCandidate[] = []

  // 1. Open Library
  const openLibResult = await fetchFromOpenLibrary(cleanIsbn)
  if (openLibResult) {
    candidates.push({ ...openLibResult, source: 'openlibrary' })
  }

  // 2. Google Books (Always fetch to see if there are alternatives)
  const googleCandidates = await fetchCandidatesFromGoogleBooks(cleanIsbn)
  candidates.push(...googleCandidates)

  // Deduplicate by title and author (simple normalization)
  const uniqueCandidates: BookCandidate[] = []
  const seen = new Set<string>()

  for (const candidate of candidates) {
    const key = `${candidate.title.toLowerCase().trim()}|${candidate.author?.toLowerCase().trim() || ''}`
    if (!seen.has(key)) {
      seen.add(key)
      uniqueCandidates.push(candidate)
    }
  }

  return uniqueCandidates
}

async function fetchCandidatesFromGoogleBooks(isbn: string): Promise<BookCandidate[]> {
  try {
    const response = await fetch(`https://www.googleapis.com/books/v1/volumes?q=isbn:${isbn}`, {
      next: { revalidate: 86400 },
      headers: { 'User-Agent': 'Book-Scanner-App/1.0' }
    })

    if (!response.ok) return []

    const data = await response.json()
    if (!data.items || data.items.length === 0) return []

    // Map top 3 results and filter out placeholder titles
    const candidates = data.items.slice(0, 3).map((item: any) => {
      const book = item.volumeInfo
      return {
        isbn,
        title: book.title || 'Unknown Title',
        author: book.authors?.[0],
        cover_url: book.imageLinks?.large?.replace("http:", "https:") ||
          book.imageLinks?.medium?.replace("http:", "https:") ||
          book.imageLinks?.small?.replace("http:", "https:") ||
          book.imageLinks?.thumbnail?.replace("http:", "https:")?.replace("zoom=1", "zoom=2") ||
          book.imageLinks?.smallThumbnail?.replace("http:", "https:")?.replace("zoom=5", "zoom=2"),
        description: book.description,
        publisher: book.publisher,
        published_date: book.publishedDate,
        page_count: book.pageCount,
        categories: book.categories?.slice(0, 5),
        source: 'googlebooks',
        source_id: item.id
      }
    })
    
    // Filter out placeholder titles (like "Untitled TBC 202325")
    return filterPlaceholderCandidates(candidates).filter((b: BookCandidate) => b.title !== 'Unknown Title')
  } catch (error) {
    console.error("[Book API] Google Books candidates error:", error)
    return []
  }
}

export async function fetchBookByISBN(isbn: string): Promise<BookData | null> {
  // Clean ISBN (remove hyphens and spaces)
  const cleanIsbn = isbn.replace(/[-\s]/g, "")

  console.log(`[Book API] Fetching book data for ISBN: ${cleanIsbn}`)

  // 1. Try Open Library API first (primary source)
  const openLibResult = await fetchFromOpenLibrary(cleanIsbn)
  if (openLibResult) {
    console.log(`[Book API] ✅ Found book via Open Library: ${openLibResult.title}`)
    return openLibResult
  }

  // 2. Fallback to Google Books API
  console.log(`[Book API] Open Library failed, trying Google Books...`)
  const googleResult = await fetchFromGoogleBooks(cleanIsbn)
  if (googleResult) {
    console.log(`[Book API] ✅ Found book via Google Books: ${googleResult.title}`)
    return googleResult
  }

  // 3. Both APIs failed
  console.log(`[Book API] ❌ Book not found in any API for ISBN: ${cleanIsbn}`)
  return null
}

async function fetchFromOpenLibrary(isbn: string): Promise<BookData | null> {
  try {
    const response = await fetch(
      `https://openlibrary.org/api/books?bibkeys=ISBN:${isbn}&format=json&jscmd=data`,
      {
        next: { revalidate: 86400 }, // Cache for 24 hours
        headers: {
          'User-Agent': 'Book-Scanner-App/1.0 (https://github.com/your-repo)'
        }
      }
    )

    if (!response.ok) {
      throw new Error(`Open Library API request failed: ${response.status}`)
    }

    const data = await response.json()
    const bookKey = `ISBN:${isbn}`
    const bookData: OpenLibraryBook = data[bookKey]

    if (!bookData || !bookData.title) {
      return null
    }

    return {
      isbn,
      title: bookData.title,
      author: bookData.authors?.[0]?.name,
      // Use the dedicated covers API if the key exists
      cover_url: await (async () => {
        const candidates = [
          bookData.cover?.large,
          bookData.cover?.medium,
          `https://covers.openlibrary.org/b/isbn/${isbn}-L.jpg`
        ];

        for (const url of candidates) {
          if (url && await validateImageUrl(url)) {
            return url;
          }
        }
        return undefined;
      })(),
      description: typeof bookData.excerpts?.[0]?.text === 'string' ? bookData.excerpts[0].text : undefined,
      publisher: bookData.publishers?.[0]?.name,
      published_date: bookData.publish_date,
      page_count: bookData.number_of_pages,
      categories: bookData.subjects?.slice(0, 5).map((s) => s.name),
    }
  } catch (error) {
    console.error("[Book API] Open Library error:", error)
    return null
  }
}

async function fetchFromGoogleBooks(isbn: string): Promise<BookData | null> {
  try {
    const response = await fetch(`https://www.googleapis.com/books/v1/volumes?q=isbn:${isbn}`, {
      next: { revalidate: 86400 },
      headers: {
        'User-Agent': 'Book-Scanner-App/1.0 (https://github.com/your-repo)'
      }
    })

    if (!response.ok) {
      throw new Error(`Google Books API request failed: ${response.status}`)
    }

    const data = await response.json()

    if (!data.items || data.items.length === 0) {
      return null
    }

    // Find first non-placeholder book
    let book = null
    for (const item of data.items) {
      const volumeInfo = item.volumeInfo
      if (volumeInfo.title && !isPlaceholderTitle(volumeInfo.title)) {
        book = volumeInfo
        break
      }
    }

    if (!book || !book.title) {
      return null
    }

    // Helper to prioritize higher quality images and ensure HTTPS
    const getBestCover = async (imageLinks: any) => {
      if (!imageLinks) return undefined;

      const candidates = [
        imageLinks.extraLarge,
        imageLinks.large,
        imageLinks.medium,
        imageLinks.small,
        imageLinks.thumbnail,
        imageLinks.smallThumbnail
      ];

      // Return the first valid URL found
      for (const url of candidates) {
        if (url) {
          const secureUrl = url.replace("http:", "https:").replace("&edge=curl", "");
          if (await validateImageUrl(secureUrl)) {
            return secureUrl;
          }
        }
      }
      return undefined;
    }

    return {
      isbn,
      title: book.title,
      author: book.authors?.[0],
      cover_url: await getBestCover(book.imageLinks),
      description: book.description,
      publisher: book.publisher,
      published_date: book.publishedDate,
      page_count: book.pageCount,
      categories: book.categories?.slice(0, 5),
    }
  } catch (error) {
    console.error("[Book API] Google Books error:", error)
    return null
  }
}

// Helper function to validate if an image URL is accessible and is an image
async function validateImageUrl(url: string): Promise<boolean> {
  try {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), 8000); // 8 second timeout

    const response = await fetch(url, {
      method: 'HEAD',
      signal: controller.signal,
      headers: {
        'User-Agent': 'Book-Scanner-App/1.0'
      },
      redirect: 'follow' // Explicitly follow redirects
    });

    clearTimeout(id);

    if (!response.ok) return false;

    const contentType = response.headers.get('content-type');
    const contentLength = response.headers.get('content-length');

    // Check if it's an image
    if (contentType && !contentType.startsWith('image/')) {
      return false;
    }

    // Check for tiny images (likely tracking pixels or empty placeholders)
    // < 1000 bytes is suspicious for a book cover
    if (contentLength) {
      const size = parseInt(contentLength);
      if (size < 1000) return false;

      // Block specific Google Books "Image Not Available" placeholder size
      // We observed this exact size (15567 bytes) for multiple placeholder images
      if (size === 15567) return false;
    }

    return true;
  } catch (error) {
    return false;
  }
}
