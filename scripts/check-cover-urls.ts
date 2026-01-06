/**
 * Check cover URLs for specific books to see if they're valid/accessible
 */

import 'dotenv/config'
import { supabaseAdmin } from '@/lib/supabase/admin'

const booksToCheck = [
  'Spanish Love Deception',
  'Haunting Adeline',
  'Rainbow Six',
  'Jack Ryan 26'
]

async function checkCoverUrls() {
  console.log('🔍 Checking cover URLs for deleted books...\n')

  // Try to find these books (they might still be in database or we can check the URLs directly)
  const { data: books, error } = await supabaseAdmin
    .from('books')
    .select('id, isbn, title, author, cover_url')
    .or(booksToCheck.map(title => `title.ilike.%${title}%`).join(','))

  if (error) {
    console.error('Error querying database:', error)
  }

  if (books && books.length > 0) {
    console.log(`Found ${books.length} book(s) still in database:\n`)
    for (const book of books) {
      console.log(`📚 ${book.title}`)
      console.log(`   ISBN: ${book.isbn}`)
      console.log(`   Cover URL: ${book.cover_url || '(none)'}`)
      if (book.cover_url) {
        await checkUrl(book.cover_url, book.title)
      }
      console.log()
    }
  } else {
    console.log('Books not found in database (already deleted)\n')
  }

  // Check known URLs from our previous findings
  const knownUrls = [
    {
      title: 'Jack Ryan 26',
      isbn: '9781408732885',
      url: 'https://covers.openlibrary.org/b/isbn/9781408732885-L.jpg'
    }
  ]

  console.log('='.repeat(80))
  console.log('Checking known cover URLs:\n')
  
  for (const book of knownUrls) {
    console.log(`📚 ${book.title} (${book.isbn})`)
    console.log(`   URL: ${book.url}`)
    await checkUrl(book.url, book.title)
    console.log()
  }
}

async function checkUrl(url: string, bookTitle: string) {
  try {
    const urlObj = new URL(url)
    console.log(`   Domain: ${urlObj.hostname}`)
    console.log(`   Path: ${urlObj.pathname}`)
    
    // Try to fetch the URL
    try {
      const response = await fetch(url, { 
        method: 'HEAD', // Just check if it exists, don't download
        signal: AbortSignal.timeout(5000) // 5 second timeout
      })
      
      if (response.ok) {
        console.log(`   ✅ Status: ${response.status} - URL is accessible`)
        const contentType = response.headers.get('content-type')
        if (contentType) {
          console.log(`   Content-Type: ${contentType}`)
        }
        if (contentType && !contentType.startsWith('image/')) {
          console.log(`   ⚠️  WARNING: Not an image! (${contentType})`)
        }
      } else if (response.status === 404) {
        console.log(`   ❌ Status: 404 - Image not found at this URL`)
      } else {
        console.log(`   ⚠️  Status: ${response.status} - May not be accessible`)
      }
    } catch (fetchError: any) {
      if (fetchError.name === 'AbortError') {
        console.log(`   ⚠️  Timeout: URL took too long to respond`)
      } else if (fetchError.message?.includes('ENOTFOUND') || fetchError.message?.includes('getaddrinfo')) {
        console.log(`   ❌ DNS Error: Domain not found`)
      } else {
        console.log(`   ❌ Error fetching: ${fetchError.message}`)
      }
    }
  } catch (urlError: any) {
    console.log(`   ❌ Invalid URL format: ${urlError.message}`)
  }
}

checkCoverUrls().catch(console.error)

