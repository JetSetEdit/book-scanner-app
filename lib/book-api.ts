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
  classification_rating?: string
}

export async function fetchBookByISBN(isbn: string): Promise<BookData | null> {
  try {
    // Clean ISBN (remove hyphens and spaces)
    const cleanIsbn = isbn.replace(/[-\s]/g, "")

    // Try Open Library API
    const response = await fetch(
      `https://openlibrary.org/api/books?bibkeys=ISBN:${cleanIsbn}&format=json&jscmd=data`,
      { next: { revalidate: 86400 } }, // Cache for 24 hours
    )

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`)
    }

    const data = await response.json()
    const bookKey = `ISBN:${cleanIsbn}`
    const bookData: OpenLibraryBook = data[bookKey]

    if (!bookData) {
      // Try Google Books API as fallback
      return await fetchFromGoogleBooks(cleanIsbn)
    }

    return {
      isbn: cleanIsbn,
      title: bookData.title,
      author: bookData.authors?.[0]?.name,
      cover_url: bookData.cover?.large || bookData.cover?.medium || bookData.cover?.small,
      description: bookData.excerpts?.[0]?.text,
      publisher: bookData.publishers?.[0]?.name,
      published_date: bookData.publish_date,
      page_count: bookData.number_of_pages,
      categories: bookData.subjects?.slice(0, 5).map((s) => s.name),
    }
  } catch (error) {
    console.error("[v0] Error fetching book from Open Library:", error)
    return null
  }
}

async function fetchFromGoogleBooks(isbn: string): Promise<BookData | null> {
  try {
    const response = await fetch(`https://www.googleapis.com/books/v1/volumes?q=isbn:${isbn}`, {
      next: { revalidate: 86400 },
    })

    if (!response.ok) {
      throw new Error(`Google Books API request failed: ${response.status}`)
    }

    const data = await response.json()

    if (!data.items || data.items.length === 0) {
      return null
    }

    const book = data.items[0].volumeInfo

    return {
      isbn,
      title: book.title,
      author: book.authors?.[0],
      cover_url: book.imageLinks?.thumbnail?.replace("http:", "https:"),
      description: book.description,
      publisher: book.publisher,
      published_date: book.publishedDate,
      page_count: book.pageCount,
      categories: book.categories?.slice(0, 5),
    }
  } catch (error) {
    console.error("[v0] Error fetching book from Google Books:", error)
    return null
  }
}
