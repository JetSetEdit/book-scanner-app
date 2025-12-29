/**
 * Diagnostic script to check why books are missing covers
 * Tests validation logic and attempts to find covers from multiple sources
 */

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { resolve } from 'path'

// Load environment variables
config({ path: resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:')
  console.error('   NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✅' : '❌')
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✅' : '❌')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Test ISBNs from the screenshot (if we can identify them)
// You can add specific ISBNs here to test
const TEST_ISBNS = [
  // Add ISBNs here to test specific books
]

async function validateImageUrl(url: string): Promise<{ valid: boolean; reason?: string; size?: number; contentType?: string }> {
  try {
    const controller = new AbortController()
    const id = setTimeout(() => controller.abort(), 8000)

    const response = await fetch(url, {
      method: 'HEAD',
      signal: controller.signal,
      headers: {
        'User-Agent': 'Book-Scanner-App/1.0'
      },
      redirect: 'follow'
    })

    clearTimeout(id)

    if (!response.ok) {
      return { valid: false, reason: `HTTP ${response.status}: ${response.statusText}` }
    }

    const contentType = response.headers.get('content-type')
    const contentLength = response.headers.get('content-length')

    // Check if it's an image
    if (contentType && !contentType.startsWith('image/')) {
      return { valid: false, reason: `Not an image: ${contentType}`, contentType }
    }

    // Check for tiny images
    if (contentLength) {
      const size = parseInt(contentLength)
      if (size < 1000) {
        return { valid: false, reason: `Too small: ${size} bytes (< 1KB)`, size }
      }
      if (size === 15567) {
        return { valid: false, reason: `Google Books placeholder: ${size} bytes`, size }
      }
      return { valid: true, size, contentType: contentType || undefined }
    }

    // No content-length header - might still be valid
    return { valid: true, reason: 'No content-length header (assuming valid)', contentType: contentType || undefined }
  } catch (error) {
    return { valid: false, reason: error instanceof Error ? error.message : 'Unknown error' }
  }
}

async function testCoverSources(isbn: string) {
  console.log(`\n🔍 Testing cover sources for ISBN: ${isbn}`)
  console.log('=' .repeat(60))

  // 1. Google Books
  try {
    const response = await fetch(`https://www.googleapis.com/books/v1/volumes?q=isbn:${isbn}`)
    const data = await response.json()
    
    if (data.items?.[0]?.volumeInfo?.imageLinks) {
      const imageLinks = data.items[0].volumeInfo.imageLinks
      const candidates = [
        { name: 'extraLarge', url: imageLinks.extraLarge },
        { name: 'large', url: imageLinks.large },
        { name: 'medium', url: imageLinks.medium },
        { name: 'thumbnail', url: imageLinks.thumbnail },
        { name: 'smallThumbnail', url: imageLinks.smallThumbnail }
      ].filter(c => c.url)

      console.log(`\n📚 Google Books: Found ${candidates.length} cover size(s)`)
      for (const candidate of candidates) {
        const secureUrl = candidate.url.replace('http:', 'https:')
        const validation = await validateImageUrl(secureUrl)
        console.log(`  ${candidate.name}: ${secureUrl.substring(0, 80)}...`)
        console.log(`    → ${validation.valid ? '✅ VALID' : '❌ INVALID'}: ${validation.reason || ''} ${validation.size ? `(${validation.size} bytes)` : ''}`)
      }
    } else {
      console.log('📚 Google Books: No image links found')
    }
  } catch (error) {
    console.log('📚 Google Books: Error:', error instanceof Error ? error.message : 'Unknown')
  }

  // 2. Open Library
  try {
    const url = `https://covers.openlibrary.org/b/isbn/${isbn}-L.jpg`
    const response = await fetch(url, { method: 'HEAD' })
    if (response.ok) {
      const validation = await validateImageUrl(url)
      console.log(`\n📖 Open Library: ${url}`)
      console.log(`  → ${validation.valid ? '✅ VALID' : '❌ INVALID'}: ${validation.reason || ''} ${validation.size ? `(${validation.size} bytes)` : ''}`)
    } else {
      console.log(`\n📖 Open Library: ${url}`)
      console.log(`  → ❌ INVALID: HTTP ${response.status} - ${response.statusText}`)
    }
  } catch (error) {
    console.log('📖 Open Library: Error:', error instanceof Error ? error.message : 'Unknown')
  }

  // 3. Check database
  const { data: book } = await supabase
    .from('books')
    .select('id, title, isbn, cover_url')
    .eq('isbn', isbn)
    .single()

  if (book) {
    console.log(`\n💾 Database:`)
    console.log(`  Title: ${book.title}`)
    console.log(`  Cover URL: ${book.cover_url || 'NULL (missing)'}`)
    if (book.cover_url) {
      const validation = await validateImageUrl(book.cover_url)
      console.log(`  → Current cover: ${validation.valid ? '✅ VALID' : '❌ INVALID'}: ${validation.reason || ''}`)
    }
  } else {
    console.log(`\n💾 Database: Book not found`)
  }
}

async function checkBooksWithoutCovers() {
  console.log('\n📊 Checking books without covers in database...\n')

  const { data: books, error } = await supabase
    .from('books')
    .select('id, isbn, title, cover_url')
    .is('cover_url', null)
    .limit(10)

  if (error) {
    console.error('Error:', error)
    return
  }

  console.log(`Found ${books.length} books without covers (showing first 10):\n`)
  
  for (const book of books) {
    console.log(`- ${book.title} (ISBN: ${book.isbn})`)
  }

  // Test first book
  if (books.length > 0) {
    await testCoverSources(books[0].isbn)
  }
}

async function main() {
  if (TEST_ISBNS.length > 0) {
    for (const isbn of TEST_ISBNS) {
      await testCoverSources(isbn)
    }
  } else {
    await checkBooksWithoutCovers()
  }
}

main().catch(console.error)

