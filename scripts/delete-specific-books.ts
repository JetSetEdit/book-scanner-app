/**
 * Delete specific books by title
 */

import 'dotenv/config'
import { supabaseAdmin } from '@/lib/supabase/admin'

const booksToDelete = [
  'Spanish Love Deception',
  'Haunting Adeline',
  'Rainbow Six'
]

async function deleteSpecificBooks() {
  console.log('🔍 Finding books to delete...\n')

  // Find books by title
  const { data: books, error } = await supabaseAdmin
    .from('books')
    .select('id, isbn, title, author, cover_url')
    .or(booksToDelete.map(title => `title.ilike.%${title}%`).join(','))

  if (error) {
    console.error('❌ Error:', error)
    return
  }

  if (!books || books.length === 0) {
    console.log('✅ No matching books found')
    return
  }

  console.log(`Found ${books.length} books:\n`)
  books.forEach(book => {
    console.log(`- ${book.title} (${book.isbn})`)
    console.log(`  Cover: ${book.cover_url ? 'YES' : 'NO'}`)
  })
  console.log()

  console.log('⚠️  Deleting books...\n')

  let deleted = 0
  let errors = 0

  for (const book of books) {
    try {
      // Delete content warnings
      const { error: warningsError } = await supabaseAdmin
        .from('content_warnings')
        .delete()
        .eq('book_id', book.id)

      if (warningsError) {
        console.error(`  ⚠️  Warnings: ${warningsError.message}`)
      }

      // Delete scans
      const { error: scansError } = await supabaseAdmin
        .from('scans')
        .delete()
        .eq('isbn', book.isbn)

      if (scansError) {
        console.error(`  ⚠️  Scans: ${scansError.message}`)
      }

      // Delete book
      const { error: deleteError } = await supabaseAdmin
        .from('books')
        .delete()
        .eq('id', book.id)

      if (deleteError) {
        console.error(`  ❌ Failed: ${deleteError.message}`)
        errors++
      } else {
        console.log(`  ✅ Deleted: ${book.title}`)
        deleted++
      }
    } catch (error) {
      console.error(`  ❌ Error: ${error}`)
      errors++
    }
  }

  console.log()
  console.log('='.repeat(80))
  console.log(`✅ Deleted: ${deleted}`)
  console.log(`❌ Errors: ${errors}`)
  console.log('='.repeat(80))
}

deleteSpecificBooks().catch(console.error)

