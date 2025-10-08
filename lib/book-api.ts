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
      cover_url: `https://covers.openlibrary.org/b/isbn/${isbn}-L.jpg`,
      description: bookData.excerpts?.[0]?.text,
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

    const book = data.items[0].volumeInfo

    if (!book.title) {
      return null
    }

    return {
      isbn,
      title: book.title,
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
    }
  } catch (error) {
    console.error("[Book API] Google Books error:", error)
    return null
  }
}
