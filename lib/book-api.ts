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
import { normalizeISBN } from './isbn-validation'

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
  source?: 'openlibrary' | 'googlebooks' // Track data source for TOS compliance
}

export interface BookCandidate extends BookData {
  source: 'openlibrary' | 'googlebooks';
  source_id?: string;
}

export async function fetchCandidatesByISBN(isbn: string): Promise<BookCandidate[]> {
  const cleanIsbn = isbn.replace(/[-\s]/g, "")
  console.log(`[Book API] Fetching candidates for ISBN: ${cleanIsbn}`)

  // Fetch from both APIs in parallel for better performance
  const [openLibResult, googleCandidates] = await Promise.allSettled([
    fetchFromOpenLibrary(cleanIsbn),
    fetchCandidatesFromGoogleBooks(cleanIsbn)
  ])

  const candidates: BookCandidate[] = []

  // Add Open Library result if successful
  if (openLibResult.status === 'fulfilled' && openLibResult.value) {
    candidates.push({ ...openLibResult.value, source: 'openlibrary' })
  }

  // Add Google Books candidates if successful
  if (googleCandidates.status === 'fulfilled') {
    candidates.push(...googleCandidates.value)
  }

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

/**
 * Extract and normalize ISBNs from Google Books industryIdentifiers
 */
function extractISBNsFromGoogleBooks(industryIdentifiers: any[] | undefined): string[] {
  if (!industryIdentifiers) return []
  
  return industryIdentifiers
    .filter((id: any) => id.type === 'ISBN_10' || id.type === 'ISBN_13')
    .map((id: any) => normalizeISBN(id.identifier))
    .filter(Boolean)
}

/**
 * Check if any of the returned ISBNs match the scanned ISBN
 */
function isbnMatches(scannedIsbn: string, returnedISBNs: string[]): boolean {
  const normalizedScanned = normalizeISBN(scannedIsbn)
  return returnedISBNs.some(isbn => normalizeISBN(isbn) === normalizedScanned)
}

async function fetchCandidatesFromGoogleBooks(isbn: string): Promise<BookCandidate[]> {
  try {
    const cleanScannedIsbn = normalizeISBN(isbn)
    const response = await fetch(`https://www.googleapis.com/books/v1/volumes?q=isbn:${cleanScannedIsbn}`, {
      next: { revalidate: 86400 },
      headers: { 'User-Agent': 'Book-Scanner-App/1.0' }
    })

    if (!response.ok) return []

    const data = await response.json()
    if (!data.items || data.items.length === 0) return []

    // Map top 3 results, validate ISBN match, and filter out placeholder titles
    const candidates = data.items.slice(0, 3)
      .map((item: any) => {
        const book = item.volumeInfo
        const returnedISBNs = extractISBNsFromGoogleBooks(book.industryIdentifiers)
        
        // CRITICAL: Only include if ISBN matches the scanned ISBN
        if (!isbnMatches(cleanScannedIsbn, returnedISBNs)) {
          console.warn(`[Book API] Google Books returned book "${book.title}" with ISBNs ${returnedISBNs.join(', ')} which doesn't match scanned ISBN ${cleanScannedIsbn}. Skipping.`)
          return null
        }
        
        return {
          isbn: cleanScannedIsbn, // Always use the scanned ISBN, not what Google Books returned
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
      .filter((candidate): candidate is BookCandidate => candidate !== null)
    
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

  // Fetch from both APIs in parallel for better performance
  const [openLibResult, googleResult] = await Promise.allSettled([
    fetchFromOpenLibrary(cleanIsbn),
    fetchFromGoogleBooks(cleanIsbn)
  ])

  const openLibBook = openLibResult.status === 'fulfilled' ? openLibResult.value : null
  const googleBook = googleResult.status === 'fulfilled' ? googleResult.value : null

  // Prefer the result that has a description (needed for content warning analysis)
  if (openLibBook && googleBook) {
    // Both succeeded - prefer the one with description
    if (openLibBook.description && openLibBook.description.length > 50) {
      console.log(`[Book API] ✅ Found book via Open Library (with description): ${openLibBook.title}`)
      return openLibBook
    }
    if (googleBook.description && googleBook.description.length > 50) {
      console.log(`[Book API] ✅ Found book via Google Books (with description): ${googleBook.title}`)
      return googleBook
    }
    // Neither has good description, prefer Open Library as primary source
    console.log(`[Book API] ✅ Found book via Open Library (no description): ${openLibBook.title}`)
    return openLibBook
  }

  // Only one succeeded
  if (openLibBook) {
    console.log(`[Book API] ✅ Found book via Open Library: ${openLibBook.title}`)
    return openLibBook
  }

  if (googleBook) {
    console.log(`[Book API] ✅ Found book via Google Books: ${googleBook.title}`)
    return googleBook
  }

  // Both APIs failed
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
      source: 'openlibrary', // Mark as Open Library source (TOS-compliant to store)
    }
  } catch (error) {
    console.error("[Book API] Open Library error:", error)
    return null
  }
}

async function fetchFromGoogleBooks(isbn: string): Promise<BookData | null> {
  try {
    const cleanScannedIsbn = normalizeISBN(isbn)
    const response = await fetch(`https://www.googleapis.com/books/v1/volumes?q=isbn:${cleanScannedIsbn}`, {
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

    // Find first non-placeholder book with matching ISBN
    let book = null
    for (const item of data.items) {
      const volumeInfo = item.volumeInfo
      if (volumeInfo.title && !isPlaceholderTitle(volumeInfo.title)) {
        // CRITICAL: Validate ISBN match before accepting the book
        const returnedISBNs = extractISBNsFromGoogleBooks(volumeInfo.industryIdentifiers)
        if (isbnMatches(cleanScannedIsbn, returnedISBNs)) {
          book = volumeInfo
          break
        } else {
          console.warn(`[Book API] Google Books returned book "${volumeInfo.title}" with ISBNs ${returnedISBNs.join(', ')} which doesn't match scanned ISBN ${cleanScannedIsbn}. Skipping.`)
        }
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
      ].filter(Boolean);

      if (candidates.length === 0) return undefined;

      // Try validation in parallel for faster results
      const validationResults = await Promise.allSettled(
        candidates.map(async (url) => {
          const secureUrl = url.replace("http:", "https:").replace("&edge=curl", "");
          const isValid = await validateImageUrl(secureUrl);
          return { url: secureUrl, valid: isValid };
        })
      );

      // Return the first valid URL found
      for (const result of validationResults) {
        if (result.status === 'fulfilled' && result.value.valid) {
          return result.value.url;
        }
      }

      // If all validations failed, don't return a fallback - it might be a placeholder
      // Better to return undefined and let the system try other sources or AI agent
      if (candidates.length > 0) {
        console.warn(`[Book API] All cover validations failed for ${isbn}. Not using fallback to avoid placeholders.`);
      }

      return undefined;
    }

    return {
      isbn: cleanScannedIsbn, // Always use the scanned ISBN, not what Google Books returned
      title: book.title,
      author: book.authors?.[0],
      cover_url: await getBestCover(book.imageLinks),
      description: book.description,
      publisher: book.publisher,
      published_date: book.publishedDate,
      page_count: book.pageCount,
      categories: book.categories?.slice(0, 5),
      source: 'googlebooks', // Mark as Google Books source (TOS violation to store permanently)
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
    const id = setTimeout(() => controller.abort(), 5000); // 5 second timeout

    const response = await fetch(url, {
      method: 'HEAD',
      signal: controller.signal,
      headers: {
        'User-Agent': 'Book-Scanner-App/1.0'
      },
      redirect: 'follow'
    });

    clearTimeout(id);

    if (!response.ok) {
      return false;
    }

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

    // If no content-length header, assume it's valid (some servers don't send it)
    return true;
  } catch (error) {
    // If validation fails (CORS, timeout, etc.), return false
    // The caller (getBestCover) will fall back to accepting the URL anyway
    return false;
  }
}
