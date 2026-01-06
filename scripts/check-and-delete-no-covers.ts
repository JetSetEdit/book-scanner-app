/**
 * Check all books for missing covers and delete them
 */

import 'dotenv/config'
import { supabaseAdmin } from '@/lib/supabase/admin'

async function checkAndDeleteNoCovers() {
  console.log('🔍 Checking all books for missing covers...\n')

  // Get all books
  const { data: books, error } = await supabaseAdmin
    .from('books')
    .select('id, isbn, title, author, cover_url')
    .order('title')

  if (error) {
    console.error('❌ Error:', error)
    return
  }

  if (!books || books.length === 0) {
    console.log('✅ No books found')
    return
  }

  console.log(`Total books: ${books.length}\n`)

  // Find books without covers
  const booksWithoutCovers = books.filter(
    book => !book.cover_url || book.cover_url.trim() === ''
  )

  console.log('='.repeat(80))
  console.log(`Books WITHOUT covers: ${booksWithoutCovers.length}`)
  console.log('='.repeat(80))

  if (booksWithoutCovers.length === 0) {
    console.log('✅ All books have covers!')
    return
  }

  booksWithoutCovers.forEach((book, idx) => {
    console.log(`${idx + 1}. ${book.title || 'Untitled'}`)
    console.log(`   ISBN: ${book.isbn} | Author: ${book.author || 'Unknown'}`)
    console.log(`   Cover URL: ${book.cover_url || '(empty)'}`)
    console.log()
  })

  console.log('⚠️  Deleting books without covers...\n')

  let deleted = 0
  let errors = 0

  for (const book of booksWithoutCovers) {
    try {
      // Delete content warnings
      const { error: warningsError } = await supabaseAdmin
        .from('content_warnings')
        .delete()
        .eq('book_id', book.id)

      if (warningsError && !warningsError.message.includes('invalid input syntax')) {
        console.error(`  ⚠️  Warnings for ${book.isbn}: ${warningsError.message}`)
      }

      // Delete scans
      const { error: scansError } = await supabaseAdmin
        .from('scans')
        .delete()
        .eq('isbn', book.isbn)

      if (scansError) {
        console.error(`  ⚠️  Scans for ${book.isbn}: ${scansError.message}`)
      }

      // Delete book
      const { error: deleteError } = await supabaseAdmin
        .from('books')
        .delete()
        .eq('id', book.id)

      if (deleteError) {
        console.error(`  ❌ Failed to delete ${book.title}: ${deleteError.message}`)
        errors++
      } else {
        console.log(`  ✅ Deleted: ${book.title}`)
        deleted++
      }
    } catch (error) {
      console.error(`  ❌ Error deleting ${book.title}:`, error)
      errors++
    }
  }

  console.log()
  console.log('='.repeat(80))
  console.log(`✅ Deleted: ${deleted} books`)
  console.log(`❌ Errors: ${errors}`)
  console.log('='.repeat(80))

  // Show remaining books with covers
  const remainingBooks = books.filter(
    book => book.cover_url && book.cover_url.trim() !== ''
  )
  console.log(`\n📚 Remaining books with covers: ${remainingBooks.length}`)
}

checkAndDeleteNoCovers().catch(console.error)

