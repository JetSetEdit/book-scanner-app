/**
 * Validate cover URLs and delete books with broken/invalid covers
 */

import 'dotenv/config'
import { supabaseAdmin } from '@/lib/supabase/admin'

async function validateAndDeleteBrokenCovers() {
  console.log('🔍 Checking all books for broken cover URLs...\n')

  const { data: books, error } = await supabaseAdmin
    .from('books')
    .select('id, isbn, title, author, cover_url')
    .not('cover_url', 'is', null)

  if (error) {
    console.error('❌ Error:', error)
    return
  }

  if (!books || books.length === 0) {
    console.log('✅ No books found')
    return
  }

  console.log(`Checking ${books.length} books with cover URLs...\n`)

  const booksToDelete: typeof books = []

  for (const book of books) {
    if (!book.cover_url) continue

    // Check if URL looks valid
    let isValid = false
    try {
      const url = new URL(book.cover_url)
      // Check if it's from a known source
      const validDomains = [
        'openlibrary.org',
        'books.google.com',
        'googleusercontent.com',
        'amazonaws.com',
        'cloudfront.net'
      ]
      isValid = validDomains.some(domain => url.hostname.includes(domain))
    } catch {
      isValid = false
    }

    // Also check for common broken patterns
    const brokenPatterns = [
      'placeholder',
      'no-cover',
      'default',
      'missing',
      'null',
      'undefined'
    ]
    const hasBrokenPattern = brokenPatterns.some(pattern => 
      book.cover_url.toLowerCase().includes(pattern)
    )

    if (!isValid || hasBrokenPattern) {
      booksToDelete.push(book)
      console.log(`❌ ${book.title}`)
      console.log(`   URL: ${book.cover_url}`)
      console.log(`   Reason: ${!isValid ? 'Invalid URL format' : 'Broken pattern detected'}`)
      console.log()
    }
  }

  if (booksToDelete.length === 0) {
    console.log('✅ All cover URLs look valid!')
    console.log('\n💡 Note: URLs may still be broken at the source.')
    console.log('   If covers still don\'t load, the image may not exist at that URL.')
    return
  }

  console.log(`\n⚠️  Found ${booksToDelete.length} books with broken/invalid cover URLs`)
  console.log('Deleting...\n')

  let deleted = 0
  let errors = 0

  for (const book of booksToDelete) {
    try {
      // Delete content warnings
      await supabaseAdmin
        .from('content_warnings')
        .delete()
        .eq('book_id', book.id)

      // Delete scans
      await supabaseAdmin
        .from('scans')
        .delete()
        .eq('isbn', book.isbn)

      // Delete book
      const { error: deleteError } = await supabaseAdmin
        .from('books')
        .delete()
        .eq('id', book.id)

      if (deleteError) {
        console.error(`  ❌ Failed: ${book.title} - ${deleteError.message}`)
        errors++
      } else {
        console.log(`  ✅ Deleted: ${book.title}`)
        deleted++
      }
    } catch (error) {
      console.error(`  ❌ Error: ${book.title} - ${error}`)
      errors++
    }
  }

  console.log()
  console.log('='.repeat(80))
  console.log(`✅ Deleted: ${deleted}`)
  console.log(`❌ Errors: ${errors}`)
  console.log('='.repeat(80))
}

validateAndDeleteBrokenCovers().catch(console.error)

